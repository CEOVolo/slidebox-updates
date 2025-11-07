import { useState, useEffect } from 'react';
import { AuthUser, UserRole } from './types';

// Простая система аутентификации через localStorage (временное решение)
// В продакшене лучше использовать NextAuth.js или JWT токены

export class AuthService {
  private static readonly USER_KEY = 'slidebox_user';
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 часа

  static getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;

    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) return null;

    try {
      const { user, expires } = JSON.parse(userData);
      
      // Проверяем, не истекла ли сессия
      if (new Date().getTime() > new Date(expires).getTime()) {
        this.logout();
        return null;
      }

      return user;
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: AuthUser): void {
    if (typeof window === 'undefined') return;

    const expires = new Date(Date.now() + this.SESSION_DURATION).toISOString();
    const sessionData = { user, expires };
    
    localStorage.setItem(this.USER_KEY, JSON.stringify(sessionData));
  }

  static logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.USER_KEY);
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  static hasRole(requiredRole: UserRole): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    if (requiredRole === 'ADMIN') {
      return user.role === 'ADMIN';
    }

    // Роль USER доступна всем аутентифицированным пользователям
    return true;
  }

  static isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  static canImportSlides(): boolean {
    return this.hasRole('ADMIN');
  }

  static canEditSlides(): boolean {
    return this.hasRole('ADMIN');
  }

  static canDeleteSlides(): boolean {
    return this.hasRole('ADMIN');
  }

  static canManageCategories(): boolean {
    return this.hasRole('ADMIN');
  }

  static canCreatePresentations(): boolean {
    return this.isAuthenticated();
  }

  static canFavoriteSlides(): boolean {
    return this.isAuthenticated();
  }

  static canViewSlides(): boolean {
    return this.isAuthenticated();
  }
}

// Хук для компонентов React
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  
  // Обновляем состояние при загрузке
  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
  }, []);
  
  // Функция logout с обновлением состояния
  const logout = () => {
    AuthService.logout();
    setUser(null);
  };
  
  // Функция login с обновлением состояния
  const login = (userData: AuthUser) => {
    AuthService.setCurrentUser(userData);
    setUser(userData);
  };
  
  // user === undefined означает, что данные еще загружаются
  const isLoading = user === undefined;
  
  return {
    user: user === undefined ? null : user,
    isLoading,
    isAuthenticated: !!user && user !== null,
    isAdmin: user?.role === 'ADMIN',
    hasRole: (role: UserRole) => !!user && user !== null && AuthService.hasRole(role),
    canImportSlides: !!user && user !== null && user.role === 'ADMIN',
    canEditSlides: !!user && user !== null && user.role === 'ADMIN',
    canDeleteSlides: !!user && user !== null && user.role === 'ADMIN',
    canManageCategories: !!user && user !== null && user.role === 'ADMIN',
    canCreatePresentations: !!user && user !== null,
    canFavoriteSlides: !!user && user !== null,
    canViewSlides: !!user && user !== null,
    logout,
    login,
  };
}

// Middleware для API routes
export function requireAuth(handler: Function) {
  return async (req: any, res: any) => {
    // В этой простой реализации мы проверяем заголовок авторизации
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // В продакшене здесь должна быть проверка JWT токена
    // Пока что просто пропускаем
    return handler(req, res);
  };
}

export function requireRole(role: UserRole) {
  return function(handler: Function) {
    return async (req: any, res: any) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // В продакшене здесь должна быть проверка роли пользователя из JWT токена
      // Пока что просто пропускаем для ADMIN запросов
      
      return handler(req, res);
    };
  };
}

export function requireAdmin(handler: Function) {
  return requireRole('ADMIN')(handler);
} 