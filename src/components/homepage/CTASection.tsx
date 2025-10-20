'use client';

export default function CTASection() {
  return (
    <section className="py-16 bg-gradient-to-r from-green-500 to-green-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center" suppressHydrationWarning={true}>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Build Your Perfect Bowl?
        </h2>
        <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
          Join thousands of office workers achieving their health goals with AI-powered nutrition guidance.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" suppressHydrationWarning={true}>
          <a href="/order" className="inline-flex items-center px-8 py-3 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition-all duration-300 shadow-lg">
            <span className="mr-2">🥗 Start Building</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </a>
          <button className="inline-flex items-center px-8 py-3 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-green-600 transition-all duration-300">
            <span className="mr-2">🤖</span>
            <span>Try AI Recommendations</span>
          </button>
        </div>
      </div>
    </section>
  );
}

