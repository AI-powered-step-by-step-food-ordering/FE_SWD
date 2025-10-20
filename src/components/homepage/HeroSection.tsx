'use client';

import { useEffect, useState } from 'react';

export default function HeroSection() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Mobile Menu Toggle Functionality
    const addMobileInteractions = () => {
      const viewNutritionBtn = document.querySelector('#viewNutritionBtn');
      if (viewNutritionBtn) {
        viewNutritionBtn.addEventListener('click', () => {
          // Scroll to features section
          const featuresSection = document.querySelector('#features');
          if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
    };

    addMobileInteractions();
  }, []);
  if (!isMounted) {
    return (
      <section className="relative px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
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
                <a href="/order" className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center">
                  🥗 Build Your Bowl
                </a>
                <button id="viewNutritionBtn" className="border-2 border-green-600 text-green-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-green-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
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
    );
  }

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-green-50 to-green-100">
        {/* Decorative Elements */}
        <div className="absolute inset-0 z-0">
          {/* Top Left Bowl */}
          <div className="absolute top-4 sm:top-10 left-2 sm:left-3 w-6 h-6 sm:w-10 sm:h-10 opacity-100 animate-float-rotate">
            <div className="w-full h-full bg-green-600 rounded-3xl flex items-center justify-center pulse-glow">
              <span className="text-lg sm:text-3xl text-white emoji-shadow">🥗</span>
            </div>
          </div>
          
          {/* Top Right Bowl */}
          <div className="absolute top-4 sm:top-10 right-3 sm:right-6 w-6 h-6 sm:w-10 sm:h-10 opacity-100 animate-float-rotate" style={{animationDelay: '1s'}}>
            <div className="w-full h-full bg-green-500 rounded-3xl flex items-center justify-center pulse-glow">
              <span className="text-lg sm:text-3xl text-white emoji-shadow">🍑</span>
            </div>
          </div>
          
          {/* Bottom Left Bowl */}
          <div className="absolute bottom-8 sm:bottom-14 left-3 sm:left-6 w-8 h-8 sm:w-16 sm:h-16 opacity-85 animate-float-rotate" style={{animationDelay: '2s'}}>
            <div className="w-full h-full bg-green-700 rounded-3xl flex items-center justify-center pulse-glow">
              <span className="text-xl sm:text-4xl text-white emoji-shadow">🌱</span>
            </div>
          </div>
          
          {/* Bottom Right Bowl */}
          <div className="absolute bottom-8 sm:bottom-14 right-3 sm:right-6 w-5 h-5 sm:w-8 sm:h-8 opacity-100 animate-float-rotate" style={{animationDelay: '3s'}}>
            <div className="w-full h-full bg-green-500 rounded-3xl flex items-center justify-center pulse-glow">
              <span className="text-lg sm:text-3xl text-white emoji-shadow">🍎</span>
            </div>
          </div>
          
          {/* Additional Floating Elements */}
          <div className="absolute top-4 sm:top-8 left-1/2 transform -translate-x-1/2 w-5 h-5 sm:w-8 sm:h-8 opacity-100 animate-float-rotate" style={{animationDelay: '0.5s'}}>
            <div className="w-full h-full bg-green-400 rounded-3xl flex items-center justify-center pulse-glow">
              <span className="text-lg sm:text-3xl text-white emoji-shadow">🍓</span>
            </div>
          </div>
          
          <div className="absolute top-20 sm:top-32 left-8 sm:left-56 w-6 h-6 sm:w-10 sm:h-10 opacity-80 animate-float-rotate" style={{animationDelay: '1.5s'}}>
            <div className="w-full h-full bg-green-600 rounded-3xl flex items-center justify-center pulse-glow">
              <span className="text-lg sm:text-3xl text-white emoji-shadow">🥒</span>
            </div>
          </div>
          
          <div className="absolute top-16 sm:top-28 right-8 sm:right-52 w-5 h-5 sm:w-9 sm:h-9 opacity-85 animate-float-rotate" style={{animationDelay: '2.5s'}}>
            <div className="w-full h-full bg-green-700 rounded-3xl flex items-center justify-center pulse-glow">
              <span className="text-lg sm:text-3xl text-white emoji-shadow">🥬</span>
            </div>
          </div>
          
          <div className="absolute top-12 sm:top-24 left-1/4 sm:left-1/3 w-4 h-4 sm:w-5 sm:h-5 opacity-90 animate-float-rotate" style={{animationDelay: '3.5s'}}>
            <div className="w-full h-full bg-green-500 rounded-3xl flex items-center justify-center pulse-glow">
              <span className="text-sm sm:text-2xl text-white emoji-shadow">🫐</span>
            </div>
          </div>
          
          <div className="absolute top-20 sm:top-36 right-1/4 sm:right-1/3 w-4 h-4 sm:w-6 sm:h-6 opacity-85 animate-float-rotate" style={{animationDelay: '4s'}}>
            <div className="w-full h-full bg-green-600 rounded-3xl flex items-center justify-center pulse-glow">
              <span className="text-sm sm:text-2xl text-white emoji-shadow">🥝</span>
            </div>
          </div>
          
          {/* Decorative Lines */}
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-300 to-transparent opacity-30"></div>
          <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-300 to-transparent opacity-30"></div>
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-green-300 to-transparent opacity-30"></div>
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-green-300 to-transparent opacity-30"></div>
        </div>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
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
              <a href="/order" className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center">
                🥗 Build Your Bowl
              </a>
              <button id="viewNutritionBtn" className="border-2 border-green-600 text-green-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-green-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                📊 View Nutrition Plans
              </button>
            </div>
          </div>
          
          {/* Right Side - Visual Elements */}
          <div className="relative order-1 lg:order-2">
            {/* Main Bowl Container */}
            <div className="relative mx-auto w-80 h-80 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px]">
              {/* Outermost Ring - Very Light Green */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/40 to-green-200/40 rounded-full shadow-2xl border border-green-200/30"></div>
              
              {/* Second Ring - Light Green */}
              <div className="absolute inset-8 bg-gradient-to-br from-green-200/50 to-green-300/50 rounded-full shadow-xl border border-green-300/30"></div>
              
              {/* Third Ring - Medium Green */}
              <div className="absolute inset-16 bg-gradient-to-br from-green-300/60 to-green-400/60 rounded-full shadow-lg border border-green-400/30"></div>
              
              {/* Fourth Ring - Inner Space */}
              <div className="absolute inset-24 bg-gradient-to-br from-green-400/70 to-green-500/70 rounded-full shadow-md border border-green-500/30"></div>
              
              {/* Fifth Ring - Center Space */}
              <div className="absolute inset-32 bg-gradient-to-br from-green-500/80 to-green-600/80 rounded-full shadow-sm border border-green-600/30"></div>
              
              {/* Rotating Food Items Container - Outer Ring (4 quả - 7xl) */}
              <div className="absolute inset-0 animate-spin" style={{animationDuration: '25s'}}>
                {/* Top */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="text-6xl emoji-shadow">🍊</span>
                </div>
                {/* Right */}
                <div className="absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <span className="text-6xl emoji-shadow">🍎</span>
                </div>
                {/* Bottom */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <span className="text-6xl emoji-shadow">🍉</span>
                </div>
                {/* Left */}
                <div className="absolute top-1/2 -left-4 transform -translate-y-1/2">
                  <span className="text-6xl emoji-shadow">🥬</span>
                </div>
              </div>
              
              {/* Second Ring Food Items (4 quả - 5xl) */}
              <div className="absolute inset-16 animate-spin" style={{animationDuration: '30s', animationDirection: 'reverse'}}>
                {/* Top */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="text-5xl emoji-shadow">🥕</span>
                </div>
                {/* Right */}
                <div className="absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <span className="text-5xl emoji-shadow">🍑</span>
                </div>
                {/* Bottom */}
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                  <span className="text-5xl emoji-shadow">🥒</span>
                </div>
                {/* Left */}
                <div className="absolute top-1/2 -left-3 transform -translate-y-1/2">
                  <span className="text-5xl emoji-shadow">🍋</span>
                </div>
              </div>
              
              {/* Third Ring Food Items (4 quả - 3xl) */}
              <div className="absolute inset-28 animate-spin" style={{animationDuration: '35s'}}>
                {/* Top */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="text-3xl emoji-shadow">🫐</span>
                </div>
                {/* Right */}
                <div className="absolute top-1/2 -right-2 transform -translate-y-1/2">
                  <span className="text-3xl emoji-shadow">🥝</span>
                </div>
                {/* Bottom */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <span className="text-3xl emoji-shadow">🍓</span>
                </div>
                {/* Left */}
                <div className="absolute top-1/2 -left-2 transform -translate-y-1/2">
                  <span className="text-3xl emoji-shadow">🍇</span>
                </div>
              </div>
              
              {/* Center Bowl (Stationary) - Chính giữa hoàn hảo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-green-200 bowl-3d pulse-glow">
                  <span className="text-3xl sm:text-4xl lg:text-5xl emoji-shadow">🥗</span>
                </div>
              </div>
            </div>
          </div>
         </div>
       </div>
     </section>
   );
 }
