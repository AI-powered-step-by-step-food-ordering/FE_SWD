'use client';

import React, { useState, useEffect } from 'react';

export default function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const updateDebugInfo = () => {
      const info = {
        localStorage: {
          accessToken: (document.cookie.includes('accessToken=')) ? 'Present' : 'Missing',
          refreshToken: (document.cookie.includes('refreshToken=')) ? 'Present' : 'Missing',
          isAuthenticated: (document.cookie.includes('isAuthenticated=true')) ? 'true' : 'false',
          user: (document.cookie.includes('user=')) ? 'Present' : 'Missing',
        },
        cookies: {
          accessToken: document.cookie.includes('accessToken=') ? 'Present' : 'Missing',
          refreshToken: document.cookie.includes('refreshToken=') ? 'Present' : 'Missing',
          isAuthenticated: document.cookie.includes('isAuthenticated=') ? 'Present' : 'Missing',
          user: document.cookie.includes('user=') ? 'Present' : 'Missing',
        },
        userData: (() => {
          const m = document.cookie.split(';').find(c => c.trim().startsWith('user='));
          if (!m) return null;
          try { return JSON.parse(decodeURIComponent(m.split('=')[1])); } catch { return null; }
        })(),
        allCookies: document.cookie,
      };
      setDebugInfo(info);
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  const clearAll = () => {
    document.cookie.split(';').forEach(c => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;');
    });
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    setDebugInfo({});
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md text-xs z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      
      <div className="mb-2">
        <strong>localStorage:</strong>
        <pre className="text-xs">{JSON.stringify(debugInfo.localStorage, null, 2)}</pre>
      </div>
      
      <div className="mb-2">
        <strong>Cookies:</strong>
        <pre className="text-xs">{JSON.stringify(debugInfo.cookies, null, 2)}</pre>
      </div>
      
      <div className="mb-2">
        <strong>User Data:</strong>
        <pre className="text-xs">{JSON.stringify(debugInfo.userData, null, 2)}</pre>
      </div>
      
      <button 
        onClick={clearAll}
        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
      >
        Clear All
      </button>
    </div>
  );
}

