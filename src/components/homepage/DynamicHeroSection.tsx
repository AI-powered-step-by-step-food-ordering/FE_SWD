'use client';

import dynamic from 'next/dynamic';

const HeroSection = dynamic(() => import('./HeroSection'), {
  ssr: false,
  loading: () => (
    <section className="relative px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left order-2 lg:order-1">
            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}</style>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-semibold">
                🤖 AI-Powered Nutrition
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Build Your Perfect <span className="text-green-600">Healthy Bowl</span> 
              <br className="hidden sm:block" />with AI Guidance!
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-4 leading-relaxed">
              Step-by-step meal building for busy office workers. Get personalized nutrition recommendations, 
              track your macros in real-time, and achieve your health goals faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-0">
              <span className="relative inline-flex items-center justify-center px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg opacity-90 cursor-not-allowed overflow-hidden">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="2" />
                </svg>
                Loading…
                <span
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                    animation: 'shimmer 1.6s infinite',
                  }}
                />
              </span>
              <button className="border-2 border-green-600 text-green-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold opacity-70 cursor-not-allowed">
                📊 View Nutrition Plans
              </button>
            </div>
          </div>
          <div className="relative order-1 lg:order-2">
            <div className="relative mx-auto w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/40 to-green-200/40 rounded-full shadow-2xl border border-green-200/30"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-green-200">
                  <span className="text-3xl sm:text-4xl lg:text-5xl">🥗</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
});

export default HeroSection;
