'use client';

import Header from '@/components/shared/Header';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      <Header />
      {/* Hero */}
      <section className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">About Healthy Bowl</h1>
          <p className="opacity-90 max-w-2xl">We craft nutritious, customizable bowls and the product experiences that make healthy eating effortless.</p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Mission */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white/90 backdrop-blur rounded-2xl border border-green-100 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">Help busy people eat better through delightful, AI-assisted nutrition and real, quality ingredients.</p>
          </div>
          <div className="p-6 bg-white/90 backdrop-blur rounded-2xl border border-green-100 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">What We Do</h2>
            <p className="text-gray-600 leading-relaxed">We combine tech, data, and culinary craft to recommend the right bowls for your goals.</p>
          </div>
        </section>

        {/* Values */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-green-100 shadow-sm">
            <span className="text-2xl">🥗</span>
            <h3 className="mt-3 font-semibold text-gray-900">Quality First</h3>
            <p className="text-gray-600 text-sm mt-1">Fresh ingredients, transparent nutrition, consistent taste.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-green-100 shadow-sm">
            <span className="text-2xl">🤝</span>
            <h3 className="mt-3 font-semibold text-gray-900">Customer Obsessed</h3>
            <p className="text-gray-600 text-sm mt-1">We listen, iterate, and build for real-life routines.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-green-100 shadow-sm">
            <span className="text-2xl">⚙️</span>
            <h3 className="mt-3 font-semibold text-gray-900">Thoughtful Tech</h3>
            <p className="text-gray-600 text-sm mt-1">Use AI where it helps—never to overwhelm.</p>
          </div>
        </section>

        {/* Story */}
        <section className="p-6 md:p-8 bg-white rounded-2xl border border-green-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Our Story</h2>
          <p className="text-gray-600 leading-relaxed">We started Healthy Bowl to make it easier to choose nutrition without sacrificing time or taste. From the office to the gym to home—your bowl adapts to you.</p>
        </section>
      </main>
    </div>
  );
}


