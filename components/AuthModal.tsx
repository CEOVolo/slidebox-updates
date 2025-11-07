'use client';

import { useState } from 'react';
import { X, User, Lock, Mail, Eye, EyeOff, UserCircle, Settings } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { AuthUser } from '@/lib/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Логин - для демонстрации создаем пользователя
        const user: AuthUser = {
          id: 'user-' + Date.now(),
          email,
          name: email.includes('admin') ? 'Administrator' : 'User',
          role: email.includes('admin') ? 'ADMIN' : 'USER'
        };

        onAuthSuccess(user);
        onClose();
        resetForm();
        
        // Редирект в зависимости от роли
        if (user.role === 'ADMIN') {
          window.location.href = '/moderation';
        } else {
          window.location.href = '/';
        }
      } else {
        // Регистрация - для демонстрации создаем пользователя
        const user: AuthUser = {
          id: 'user-' + Date.now(),
          email,
          name: name || email.split('@')[0],
          role: 'USER'
        };

        onAuthSuccess(user);
        onClose();
        resetForm();
        
        // Редирект на главную после регистрации
        window.location.href = '/';
      }
    } catch (error) {
      setError('Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setName('');
    setPassword('');
    setError('');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDemoLogin = (role: 'ADMIN' | 'USER') => {
    const user: AuthUser = {
      id: 'demo-' + role.toLowerCase(),
      email: role === 'ADMIN' ? 'admin@slidebox.com' : 'user@slidebox.com',
      name: role === 'ADMIN' ? 'Administrator' : 'User',
      role
    };

    onAuthSuccess(user);
    onClose();
    resetForm();
    
    // Редирект в зависимости от роли
    if (role === 'ADMIN') {
      window.location.href = '/moderation';
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UserCircle className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Demo buttons */}
        <div className="p-6 bg-gray-50 border-b">
          <p className="text-sm text-gray-600 mb-3">Quick demo login:</p>
          <div className="flex space-x-3">
            <button
              onClick={() => handleDemoLogin('ADMIN')}
              className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center justify-center text-sm font-medium"
            >
              <Settings className="w-4 h-4 mr-2" />
              Administrator
            </button>
            <button
              onClick={() => handleDemoLogin('USER')}
              className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center text-sm font-medium"
            >
              <User className="w-4 h-4 mr-2" />
              User
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Name (только для регистрации) */}
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name (optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isLoading}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>

          {/* Switch Mode */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {isLogin ? 'Don\'t have an account?' : 'Already have an account?'}
              {' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-blue-500 hover:text-blue-600 font-medium"
                disabled={isLoading}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 