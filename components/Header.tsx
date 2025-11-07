'use client';

import { useState, useEffect } from 'react';
import { User, Settings, LogOut, Crown, Shield, Upload, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import AuthModal from './AuthModal';
import { AuthUser } from '@/lib/types';

interface HeaderProps {
  onImportClick?: () => void;
  onSearchFocus?: () => void;
  title?: string;
}

export default function Header({ onImportClick, onSearchFocus, title = "SlideBox by Andersen" }: HeaderProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const auth = useAuth();

  useEffect(() => {
    setCurrentUser(auth.user);
  }, [auth.user]);

  const handleAuthSuccess = (user: AuthUser) => {
    auth.login(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    auth.logout();
    setCurrentUser(null);
    setShowUserMenu(false);
  };

  const getUserBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
          <Crown className="w-3 h-3" />
          <span>Admin</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
        <Shield className="w-3 h-3" />
        <span>User</span>
      </div>
    );
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>

          {/* Center - Search hint */}
          {onSearchFocus && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <button
                onClick={onSearchFocus}
                                 className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-left text-gray-500 hover:bg-gray-100 transition-colors flex items-center"
               >
                 <Search className="w-4 h-4 mr-3" />
                 Search slides...
              </button>
            </div>
          )}

          {/* Right side - User actions */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                {/* Admin buttons */}
                {auth.canImportSlides && (
                  <>
                    {onImportClick && (
                      <button
                        onClick={onImportClick}
                        className="px-4 py-2 bg-yellow-400 text-gray-800 rounded-lg hover:bg-yellow-500 transition-colors flex items-center font-medium shadow-sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </button>
                    )}
                    <a
                      href="/moderation"
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center font-medium shadow-sm"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Moderation
                    </a>
                  </>
                )}

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {currentUser.name || currentUser.email}
                        </p>
                        <div className="flex items-center space-x-1">
                          {getUserBadge(currentUser.role)}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                             <div className="px-4 py-3 border-b border-gray-100">
                         <p className="text-sm font-medium text-gray-900">{currentUser.name || 'User'}</p>
                         <p className="text-xs text-gray-500">{currentUser.email}</p>
                        <div className="mt-2">
                          {getUserBadge(currentUser.role)}
                        </div>
                      </div>
                      
                                             {/* Role capabilities */}
                       <div className="px-4 py-3 border-b border-gray-100">
                         <p className="text-xs font-medium text-gray-700 mb-2">Available features:</p>
                         <div className="space-y-1 text-xs text-gray-600">
                           {auth.canViewSlides && <p>• View slides</p>}
                           {auth.canCreatePresentations && <p>• Create presentations</p>}
                           {auth.canFavoriteSlides && <p>• Favorite slides</p>}
                           {auth.canImportSlides && <p>• Import slides</p>}
                           {auth.canEditSlides && <p>• Edit slides</p>}
                           {auth.canDeleteSlides && <p>• Delete slides</p>}
                           {auth.canManageCategories && <p>• Manage categories</p>}
                         </div>
                       </div>

                      {/* Admin links */}
                      {auth.canImportSlides && (
                        <div className="px-2 py-2 border-b border-gray-100">
                          <a
                            href="/moderation"
                            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            Moderation Queue
                          </a>
                        </div>
                      )}

                      <div className="px-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center font-medium"
              >
                <User className="w-4 h-4 mr-2" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
} 