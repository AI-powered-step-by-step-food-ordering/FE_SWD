'use client';

import { useState, useEffect } from 'react';

export default function DebugTokenModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  useEffect(() => {
    // Load tokens from localStorage on mount
    const savedAccessToken = localStorage.getItem('accessToken') || '';
    const savedRefreshToken = localStorage.getItem('refreshToken') || '';
    setAccessToken(savedAccessToken);
    setRefreshToken(savedRefreshToken);
  }, []);

  const handleSave = () => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    alert('Tokens saved! They will be included in all API requests.');
    setIsOpen(false);
  };

  const handleClear = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken('');
    setRefreshToken('');
    alert('Tokens cleared!');
  };

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all"
        title="Debug: Set Auth Tokens"
      >
        🔑
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Debug: Set Auth Tokens</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token
                </label>
                <textarea
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Paste your access token here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refresh Token
                </label>
                <textarea
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Paste your refresh token here..."
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Save Tokens
              </button>
              <button
                onClick={handleClear}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Clear Tokens
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-800">
                <strong>Debug Mode:</strong> Tokens are stored in localStorage and will be sent with all API requests as Bearer authorization.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
