'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function AuthTestPage() {
  const auth = useAuth();
  const [localStorageData, setLocalStorageData] = useState<string | null>(null);

  useEffect(() => {
    // Проверяем localStorage напрямую
    const data = localStorage.getItem('slidebox_user');
    setLocalStorageData(data);
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">useAuth() Hook Data:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify({
              user: auth.user,
              isLoading: auth.isLoading,
              isAuthenticated: auth.isAuthenticated,
              isAdmin: auth.isAdmin,
              canImportSlides: auth.canImportSlides,
            }, null, 2)}
          </pre>
        </div>

        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">localStorage Data:</h2>
          <pre className="text-sm overflow-auto">
            {localStorageData ? JSON.stringify(JSON.parse(localStorageData), null, 2) : 'No data'}
          </pre>
        </div>

        <div className="p-4 bg-blue-100 rounded">
          <h2 className="font-semibold mb-2">Quick Actions:</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                auth.login({
                  id: 'admin-test',
                  email: 'admin@test.com',
                  name: 'Test Admin',
                  role: 'ADMIN'
                });
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Force Login as Admin
            </button>
            
            <button
              onClick={() => {
                auth.logout();
                window.location.reload();
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 ml-2"
            >
              Force Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 