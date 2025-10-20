'use client';

export default function MarqueeBanner() {
  return (
    <div className="bg-green-600 text-white py-3 overflow-hidden" suppressHydrationWarning={true}>
      <div className="flex animate-marquee whitespace-nowrap text-sm sm:text-base" suppressHydrationWarning={true}>
        <span className="mx-4 sm:mx-6 lg:mx-8">🍎 Fresh Fruits Daily</span>
        <span className="mx-4 sm:mx-6 lg:mx-8">🌱 Organic Sprouts</span>
        <span className="mx-4 sm:mx-6 lg:mx-8">🚚 Free Delivery</span>
        <span className="mx-4 sm:mx-6 lg:mx-8">💚 100% Natural</span>
        <span className="mx-4 sm:mx-6 lg:mx-8">⏰ Timely Delivery</span>
        <span className="mx-4 sm:mx-6 lg:mx-8">🏠 Doorstep Service</span>
        <span className="mx-4 sm:mx-6 lg:mx-8">💰 Best Prices</span>
        <span className="mx-4 sm:mx-6 lg:mx-8">📱 Easy Management</span>
        <span className="mx-4 sm:mx-6 lg:mx-8">🔄 Flexible Plans</span>
        <span className="mx-4 sm:mx-6 lg:mx-8">⭐ 5-Star Rated</span>
      </div>
      
    </div>
  );
}
