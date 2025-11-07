'use client';

import { useState } from 'react';
import ImportModal from '@/components/ImportModal';

export default function TestModalPage() {
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = () => {
    console.log('Импорт успешно завершён!');
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Тест ImportModal с новой логикой
        </h1>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Открыть ImportModal
        </button>

        {showModal && (
          <ImportModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </div>
  );
} 