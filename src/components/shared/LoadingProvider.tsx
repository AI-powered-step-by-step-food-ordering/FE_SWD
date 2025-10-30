'use client';

import { createContext, useContext, ReactNode, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUiStore } from '@/store/ui.store';

interface LoadingContextType {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
  navigateWithLoading: (url: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: ReactNode;
}

export default function LoadingProvider({ children }: LoadingProviderProps) {
  const router = useRouter();
  const isLoading = useUiStore(s => s.isLoading);
  const showLoading = useUiStore(s => s.showLoading);
  const hideLoading = useUiStore(s => s.hideLoading);
  // Debounced visibility to avoid flicker
  const [isVisible, setIsVisible] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastShowTsRef = useRef<number>(0);

  useEffect(() => {
    const SHOW_DELAY_MS = 120; // wait before showing
    const HIDE_DELAY_MS = 200; // keep a bit before hiding
    const MIN_VISIBLE_MS = 400; // minimum visible once shown

    if (isLoading) {
      if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
      if (isVisible) {
        // already visible; just keep it
        return;
      }
      if (!showTimerRef.current) {
        showTimerRef.current = setTimeout(() => {
          setIsVisible(true);
          lastShowTsRef.current = Date.now();
          showTimerRef.current = null;
        }, SHOW_DELAY_MS);
      }
    } else {
      if (showTimerRef.current) { clearTimeout(showTimerRef.current); showTimerRef.current = null; }
      if (!isVisible) return;
      const elapsed = Date.now() - lastShowTsRef.current;
      const wait = Math.max(HIDE_DELAY_MS, MIN_VISIBLE_MS - elapsed, 0);
      if (!hideTimerRef.current) {
        hideTimerRef.current = setTimeout(() => {
          setIsVisible(false);
          hideTimerRef.current = null;
        }, wait);
      }
    }
  }, [isLoading, isVisible]);

  // Lock body scroll while loader visible
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    if (isVisible) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = prevOverflow || '';
    }
    return () => {
      body.style.overflow = prevOverflow || '';
    };
  }, [isVisible]);

  const navigateWithLoading = (url: string) => {
    // Show loading first
    showLoading();
    
    // Small delay to ensure loading shows, then navigate
    setTimeout(() => {
      router.push(url);
      
      // Hide loading after navigation
      setTimeout(() => {
        hideLoading();
      }, 600); // Keep loading for 600ms after navigation
    }, 100); // Small delay before navigation
  };

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading, navigateWithLoading }}>
      {children}
      
      {/* Global Loading Overlay */}
      {isVisible && (
        <div className="fixed inset-0 z-[9999] bg-emerald-50 flex items-center justify-center">
          <div className="w-32 h-32 text-emerald-600">
            <svg viewBox="0 0 240 240" className="w-full h-full">
              <style>{`
                .pl1123__ring {
                  animation: ringA 2s linear infinite;
                }
                .pl1123__ring--a {
                  stroke: currentColor;
                }
                .pl1123__ring--b {
                  animation-name: ringB;
                  stroke: currentColor;
                }
                .pl1123__ring--c {
                  animation-name: ringC;
                  stroke: currentColor;
                }
                .pl1123__ring--d {
                  animation-name: ringD;
                  stroke: currentColor;
                }
                @keyframes ringA {
                  from, 4% {
                    stroke-dasharray: 0 660;
                    stroke-width: 20;
                    stroke-dashoffset: -330;
                  }
                  12% {
                    stroke-dasharray: 60 600;
                    stroke-width: 30;
                    stroke-dashoffset: -335;
                  }
                  32% {
                    stroke-dasharray: 60 600;
                    stroke-width: 30;
                    stroke-dashoffset: -595;
                  }
                  40%, 54% {
                    stroke-dasharray: 0 660;
                    stroke-width: 20;
                    stroke-dashoffset: -660;
                  }
                  62% {
                    stroke-dasharray: 60 600;
                    stroke-width: 30;
                    stroke-dashoffset: -665;
                  }
                  82% {
                    stroke-dasharray: 60 600;
                    stroke-width: 30;
                    stroke-dashoffset: -925;
                  }
                  90%, to {
                    stroke-dasharray: 0 660;
                    stroke-width: 20;
                    stroke-dashoffset: -990;
                  }
                }
                @keyframes ringB {
                  from, 12% {
                    stroke-dasharray: 0 220;
                    stroke-width: 20;
                    stroke-dashoffset: -110;
                  }
                  20% {
                    stroke-dasharray: 20 200;
                    stroke-width: 30;
                    stroke-dashoffset: -115;
                  }
                  40% {
                    stroke-dasharray: 20 200;
                    stroke-width: 30;
                    stroke-dashoffset: -195;
                  }
                  48%, 62% {
                    stroke-dasharray: 0 220;
                    stroke-width: 20;
                    stroke-dashoffset: -220;
                  }
                  70% {
                    stroke-dasharray: 20 200;
                    stroke-width: 30;
                    stroke-dashoffset: -225;
                  }
                  90% {
                    stroke-dasharray: 20 200;
                    stroke-width: 30;
                    stroke-dashoffset: -305;
                  }
                  98%, to {
                    stroke-dasharray: 0 220;
                    stroke-width: 20;
                    stroke-dashoffset: -330;
                  }
                }
                @keyframes ringC {
                  from {
                    stroke-dasharray: 0 440;
                    stroke-width: 20;
                    stroke-dashoffset: 0;
                  }
                  8% {
                    stroke-dasharray: 40 400;
                    stroke-width: 30;
                    stroke-dashoffset: -5;
                  }
                  28% {
                    stroke-dasharray: 40 400;
                    stroke-width: 30;
                    stroke-dashoffset: -175;
                  }
                  36%, 58% {
                    stroke-dasharray: 0 440;
                    stroke-width: 20;
                    stroke-dashoffset: -220;
                  }
                  66% {
                    stroke-dasharray: 40 400;
                    stroke-width: 30;
                    stroke-dashoffset: -225;
                  }
                  86% {
                    stroke-dasharray: 40 400;
                    stroke-width: 30;
                    stroke-dashoffset: -395;
                  }
                  94%, to {
                    stroke-dasharray: 0 440;
                    stroke-width: 20;
                    stroke-dashoffset: -440;
                  }
                }
                @keyframes ringD {
                  from, 8% {
                    stroke-dasharray: 0 440;
                    stroke-width: 20;
                    stroke-dashoffset: 0;
                  }
                  16% {
                    stroke-dasharray: 40 400;
                    stroke-width: 30;
                    stroke-dashoffset: -5;
                  }
                  36% {
                    stroke-dasharray: 40 400;
                    stroke-width: 30;
                    stroke-dashoffset: -175;
                  }
                  44%, 50% {
                    stroke-dasharray: 0 440;
                    stroke-width: 20;
                    stroke-dashoffset: -220;
                  }
                  58% {
                    stroke-dasharray: 40 400;
                    stroke-width: 30;
                    stroke-dashoffset: -225;
                  }
                  78% {
                    stroke-dasharray: 40 400;
                    stroke-width: 30;
                    stroke-dashoffset: -395;
                  }
                  86%, to {
                    stroke-dasharray: 0 440;
                    stroke-width: 20;
                    stroke-dashoffset: -440;
                  }
                }
              `}</style>
              <circle className="pl1123__ring pl1123__ring--a" cx="120" cy="120" r="105" fill="none" stroke="currentColor" strokeWidth="20" strokeDasharray="0 660" strokeDashoffset="-330" strokeLinecap="round"/>
              <circle className="pl1123__ring pl1123__ring--b" cx="120" cy="120" r="35" fill="none" stroke="currentColor" strokeWidth="20" strokeDasharray="0 220" strokeDashoffset="-110" strokeLinecap="round"/>
              <circle className="pl1123__ring pl1123__ring--c" cx="85" cy="120" r="70" fill="none" stroke="currentColor" strokeWidth="20" strokeDasharray="0 440" strokeLinecap="round"/>
              <circle className="pl1123__ring pl1123__ring--d" cx="155" cy="120" r="70" fill="none" stroke="currentColor" strokeWidth="20" strokeDasharray="0 440" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
