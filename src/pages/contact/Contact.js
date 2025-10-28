import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import PageTemplate from '../../components/PageTemplate';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';
import { ReactComponent as ContactIllustration } from '../../assets/images/Contact.svg';

const Contact = () => {
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear status when user starts typing again
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const result = await emailjs.sendForm(
        'service_3amebrj',    // Your EmailJS Service ID
        'template_q126lg4',   // Your EmailJS Template ID
        e.target,
        'zjHsV_tywr2_0qK9O'  // Your EmailJS User ID
      );

      console.log('EmailJS result:', result.text);
      setSubmitStatus('success');
      
      // Reset form after successful submission
      setFormData({
        email: '',
        message: ''
      });

    } catch (error) {
      console.error('EmailJS error:', error.text);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTemplate className="contact-page">
      <div className="flex min-h-screen pt-16"> {/* pt-16 accounts for navbar */}

        {/* Left Half - Visualization Container */}
        <div className="w-1/2">
          <VisBackgroundComponent className="h-full bg-gradient-to-br from-dark-900/80 to-dark-800/80">
            <ContactIllustration className="w-full h-full" style={{ maxWidth: 'none', width: '80%', height: '80%' }} />
          </VisBackgroundComponent>
        </div>

        {/* Right Half - Contact Form */}
        <div className="w-1/2 flex flex-col justify-center px-16 py-12">
            {/* Success/Error Messages */}
            {submitStatus === 'success' && (
              <div className="mb-8">
                <p className="text-green-400 font-sans text-sm">Message sent successfully! I'll get back to you soon.</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-8">
                <p className="text-red-400 font-sans text-sm">Failed to send message. Please try again or contact me directly.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-dark-400 mb-3 font-sans uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-0 border-b border-white/20 text-2xl text-dark-50 placeholder-dark-500 focus:outline-none focus:border-white/40 transition-colors duration-300 font-sans pb-2"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-medium text-dark-400 mb-3 font-sans uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full bg-transparent border-0 border-b border-white/20 text-xl text-dark-50 placeholder-dark-500 focus:outline-none focus:border-white/40 transition-colors duration-300 resize-none font-sans pb-2"
                  placeholder="Tell me about your project..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`mt-8 font-medium py-4 px-8 border border-white/20 hover:border-white/40 transition-all duration-300 font-sans text-dark-50 hover:bg-white/5 ${
                  isSubmitting 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105'
                }`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
        </div>
      </div>
    </PageTemplate>
  );
};

export default Contact;