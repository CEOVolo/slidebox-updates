'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ModerationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Проверяем авторизацию на уровне layout
    if (!auth.isLoading && (!auth.user || auth.user.role !== 'ADMIN')) {
      console.log('Layout redirect - not admin:', { 
        user: auth.user, 
        role: auth.user?.role,
        isLoading: auth.isLoading 
      });
      router.push('/');
    }
  }, [auth.user, auth.isLoading, router]);

  // Показываем загрузку пока проверяем авторизацию
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Checking authorization...</div>
      </div>
    );
  }

  // Если не админ, показываем сообщение о редиректе
  if (!auth.user || auth.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Access denied. Redirecting...</div>
      </div>
    );
  }

  return <>{children}</>;
} 