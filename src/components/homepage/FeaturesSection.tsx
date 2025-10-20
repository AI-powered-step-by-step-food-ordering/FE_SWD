'use client';

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 bg-gradient-to-br from-green-50 via-white to-green-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0" suppressHydrationWarning={true}>
        <div className="absolute top-4 left-1/4 w-20 h-20 bg-green-100 rounded-full opacity-45 animate-pulse" suppressHydrationWarning={true}></div>
        <div className="absolute bottom-8 right-12 w-16 h-16 bg-green-200 rounded-full opacity-45 animate-bounce" style={{animationDelay: '0.5s'}} suppressHydrationWarning={true}></div>
        <div className="absolute top-1/2 left-8 w-12 h-12 bg-green-300 rounded-full opacity-45 animate-pulse" style={{animationDelay: '0.5s'}} suppressHydrationWarning={true}></div>
        <div className="absolute top-1/3 right-12 w-14 h-14 bg-green-100 rounded-full opacity-45 animate-bounce" style={{animationDelay: '0.5s'}} suppressHydrationWarning={true}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" suppressHydrationWarning={true}>
        {/* Section Header */}
        <div className="text-center mb-12" suppressHydrationWarning={true}>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Why Choose Our AI-Powered System?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Perfect for busy office workers who want healthy, personalized meals during peak hours
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" suppressHydrationWarning={true}>
          {/* Feature 1: AI Recommendations */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100 hover:border-green-300" suppressHydrationWarning={true}>
            <div className="flex flex-col items-center text-center" suppressHydrationWarning={true}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg" suppressHydrationWarning={true}>
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">AI Recommendations</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Smart suggestions based on your goals: slim fit, muscle gain, or fat loss
              </p>
              <div className="mt-3 w-8 h-1 bg-green-400 rounded-full group-hover:w-12 transition-all duration-300" suppressHydrationWarning={true}></div>
            </div>
          </div>

          {/* Feature 2: Real-time Nutrition */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100 hover:border-green-300" suppressHydrationWarning={true}>
            <div className="flex flex-col items-center text-center" suppressHydrationWarning={true}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg" suppressHydrationWarning={true}>
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Real-time Nutrition</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Track calories and macros as you build. See progress towards your daily goals
              </p>
              <div className="mt-3 w-8 h-1 bg-blue-400 rounded-full group-hover:w-12 transition-all duration-300" suppressHydrationWarning={true}></div>
            </div>
          </div>

          {/* Feature 3: Quick Ordering */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100 hover:border-green-300" suppressHydrationWarning={true}>
            <div className="flex flex-col items-center text-center" suppressHydrationWarning={true}>
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg" suppressHydrationWarning={true}>
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">Quick Ordering</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                One-tap reorder from history. Perfect for busy office workers during rush hours
              </p>
              <div className="mt-3 w-8 h-1 bg-emerald-400 rounded-full group-hover:w-12 transition-all duration-300" suppressHydrationWarning={true}></div>
            </div>
          </div>

          {/* Feature 4: Step-by-Step */}
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100 hover:border-green-300" suppressHydrationWarning={true}>
            <div className="flex flex-col items-center text-center" suppressHydrationWarning={true}>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg" suppressHydrationWarning={true}>
                <span className="text-3xl">🥗</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Step-by-Step</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Build your bowl: Starch → Protein → Vegetables → Sauce. Simple and intuitive
              </p>
              <div className="mt-3 w-8 h-1 bg-purple-400 rounded-full group-hover:w-12 transition-all duration-300" suppressHydrationWarning={true}></div>
            </div>
          </div>
        </div>
        
        {/* Additional Stats Row */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6" suppressHydrationWarning={true}>
          <div className="text-center" suppressHydrationWarning={true}>
            <div className="text-3xl font-bold text-green-600 mb-1" suppressHydrationWarning={true}>2000+</div>
            <div className="text-sm text-gray-600" suppressHydrationWarning={true}>Office Workers Served</div>
          </div>
          <div className="text-center" suppressHydrationWarning={true}>
            <div className="text-3xl font-bold text-green-600 mb-1" suppressHydrationWarning={true}>95%</div>
            <div className="text-sm text-gray-600" suppressHydrationWarning={true}>Goal Achievement Rate</div>
          </div>
          <div className="text-center" suppressHydrationWarning={true}>
            <div className="text-3xl font-bold text-green-600 mb-1" suppressHydrationWarning={true}>3min</div>
            <div className="text-sm text-gray-600" suppressHydrationWarning={true}>Average Order Time</div>
          </div>
          <div className="text-center" suppressHydrationWarning={true}>
            <div className="text-3xl font-bold text-green-600 mb-1" suppressHydrationWarning={true}>4.8★</div>
            <div className="text-sm text-gray-600" suppressHydrationWarning={true}>AI Accuracy Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}
