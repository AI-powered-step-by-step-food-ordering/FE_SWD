'use client';

import { useState, FormEvent } from 'react';
import emailjs from '@emailjs/browser';
import { toast } from 'react-toastify';
import Header from '@/components/shared/Header';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    setIsSubmitting(true);

    try {
      // EmailJS configuration
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_1sqr7w5';
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_tuv6euw';
      const autoReplyTemplateId = process.env.NEXT_PUBLIC_EMAILJS_AUTO_REPLY_TEMPLATE_ID || 'template_auto_reply';
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'tmrjBpRZd8Op2ncWU';

      if (!serviceId || !templateId || !publicKey) {
        toast.error('Email service chưa được cấu hình. Vui lòng liên hệ admin.');
        setIsSubmitting(false);
        return;
      }

      // Format time
      const now = new Date();
      const formattedTime = now.toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const subject = formData.subject || 'Contact Form - Healthy Bowl';

      // Template parameters cho email gửi đến admin
      const adminTemplateParams = {
        name: formData.name, // {{name}} trong template
        time: formattedTime, // {{time}} trong template
        message: formData.message, // {{message}} trong template
        from_email: formData.email, // Để EmailJS có thể reply
        reply_to: formData.email, // Để có thể reply trực tiếp
        subject: subject, // Email subject
      };

      // Template parameters cho email tự động trả lời người dùng
      const autoReplyParams = {
        name: formData.name, // {{name}} trong template auto-reply
        time: formattedTime, // {{time}} trong template auto-reply
        subject: subject, // {{subject}} trong template auto-reply
        to_email: formData.email, // Email người nhận (người dùng)
      };

      console.log('Sending admin email with params:', { serviceId, templateId, templateParams: adminTemplateParams });

      // Gửi email đến admin
      const adminResult = await emailjs.send(serviceId, templateId, adminTemplateParams, publicKey);

      console.log('Admin EmailJS Result:', adminResult);

      // Gửi email tự động trả lời cho người dùng (nếu có template)
      if (autoReplyTemplateId && autoReplyTemplateId !== 'template_auto_reply') {
        try {
          console.log('Sending auto-reply email with params:', { serviceId, templateId: autoReplyTemplateId, templateParams: autoReplyParams });
          const autoReplyResult = await emailjs.send(serviceId, autoReplyTemplateId, autoReplyParams, publicKey);
          console.log('Auto-reply EmailJS Result:', autoReplyResult);
        } catch (autoReplyError: any) {
          // Nếu auto-reply thất bại, chỉ log lỗi nhưng không ảnh hưởng đến kết quả chính
          console.warn('Auto-reply email failed (non-critical):', autoReplyError);
        }
      }

      if (adminResult.status === 200 || adminResult.text === 'OK') {
        toast.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
        // Reset form
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error(`EmailJS returned status: ${adminResult.status}`);
      }
    } catch (error: any) {
      console.error('EmailJS Error:', error);
      console.error('Error details:', {
        status: error?.status,
        text: error?.text,
        message: error?.message,
        response: error?.response
      });
      
      // Hiển thị lỗi chi tiết hơn
      let errorMessage = 'Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau.';
      
      if (error?.status === 400) {
        errorMessage = 'Lỗi 400: Template parameters không khớp. Vui lòng kiểm tra template trong EmailJS dashboard.';
      } else if (error?.text) {
        errorMessage = `Lỗi: ${error.text}`;
      } else if (error?.message) {
        errorMessage = `Lỗi: ${error.message}`;
      } else if (error?.status) {
        errorMessage = `Lỗi ${error.status}: ${error.text || 'Bad Request'}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="p-6 bg-white rounded-2xl border border-green-100 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Send us a message</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name <span className="text-red-500">*</span></label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" 
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" 
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input 
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" 
                placeholder="What is this about?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
              <textarea 
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none" 
                rows={5} 
                placeholder="How can we help?"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-5 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Đang gửi...
                </span>
              ) : (
                'Send Message'
              )}
            </button>
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


