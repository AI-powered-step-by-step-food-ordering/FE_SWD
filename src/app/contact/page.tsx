'use client';

import Header from '@/components/shared/Header';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Contact Us</h1>
          <p className="opacity-90 max-w-2xl">Questions, feedback, or partnership ideas? We&apos;re here to help.</p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card: Contact */}
          <div className="p-6 bg-white rounded-2xl border border-green-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Get in touch</h2>
            <p className="text-gray-600"><span className="font-medium">Email:</span> support@example.com</p>
            <p className="text-gray-600 mt-1"><span className="font-medium">Phone:</span> +84 123 456 789</p>
          </div>
          {/* Card: Hours */}
          <div className="p-6 bg-white rounded-2xl border border-green-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Business hours</h2>
            <p className="text-gray-600">Mon - Fri: 9:00 - 18:00</p>
            <p className="text-gray-600">Sat: 9:00 - 12:00</p>
          </div>
          {/* Card: Socials */}
          <div className="p-6 bg-white rounded-2xl border border-green-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Follow us</h2>
            <div className="flex gap-3 text-green-600">
              <span>🌐</span>
              <span>🐦</span>
              <span>📸</span>
            </div>
          </div>
        </div>

        {/* Form + Map placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={(e)=>e.preventDefault()} className="p-6 bg-white rounded-2xl border border-green-100 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Send us a message</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-200" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-200" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-200" rows={5} placeholder="How can we help?" />
            </div>
            <button className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700">Send</button>
          </form>
          <div className="p-6 bg-white rounded-2xl border border-green-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Our location</h2>
            <div className="relative w-full overflow-hidden rounded-xl border">
              <div className="pt-[56.25%]" />
              <iframe
                title="Healthy Bowl Location"
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.609941891206!2d106.8050120827022!3d10.841132830456578!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752731176b07b1%3A0xb752b24b379bae5e!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBGUFQgVFAuIEhDTQ!5e0!3m2!1svi!2s!4v1761797844325!5m2!1svi!2s"
              />
            </div>
            <p className="mt-3 text-sm text-gray-600">Find us at your nearest Healthy Bowl location.</p>
          </div>
        </div>
      </main>
    </div>
  );
}


