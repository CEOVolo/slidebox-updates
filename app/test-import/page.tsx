'use client';

import { useState } from 'react';

export default function TestImportPage() {
  const [url, setUrl] = useState('https://www.figma.com/design/c7YwSoAPkhMTfigPvVm8IY/Managed-Services?m=auto&t=y5Avp9ebksLgkwlH-6');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const testImport = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/figma/test-import-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Неизвестная ошибка');
      }
    } catch (err) {
      setError('Ошибка сети: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Тест импорта всех слайдов из Figma
        </h1>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
          <label className="block text-white text-sm font-medium mb-2">
            URL Figma файла:
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:border-purple-400 focus:outline-none"
            placeholder="https://www.figma.com/design/..."
          />
          
          <button
            onClick={testImport}
            disabled={loading}
            className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {loading ? 'Тестируем...' : 'Тестировать импорт'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <h3 className="text-red-300 font-medium mb-2">Ошибка:</h3>
            <pre className="text-red-200 text-sm whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {result && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Результат импорта
            </h2>
            
            <div className="grid gap-4 mb-6">
              <div className="flex items-center space-x-4 text-white">
                <span className="bg-purple-600 px-3 py-1 rounded-full text-sm">
                  Файл: {result.fileInfo.name}
                </span>
                <span className="bg-green-600 px-3 py-1 rounded-full text-sm">
                  Найдено: {result.slidesCount} слайдов
                </span>
              </div>
            </div>

            <div className="grid gap-4">
              {result.slides.map((slide: any, index: number) => (
                <div
                  key={slide.nodeId}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-medium">{slide.name}</h3>
                    <div className="flex space-x-2">
                      <span className="bg-blue-600 px-2 py-1 rounded text-xs text-white">
                        {slide.category}
                      </span>
                      {slide.hasImage && (
                        <span className="bg-green-600 px-2 py-1 rounded text-xs text-white">
                          ✓ Изображение
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3">
                    {slide.extractedText}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {slide.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="bg-purple-600/30 text-purple-200 px-2 py-1 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-400">
                    ID: {slide.nodeId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 