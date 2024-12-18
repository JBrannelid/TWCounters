import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Coffee, Database } from 'lucide-react';
import { useState } from 'react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  // State för att hantera skickad status och felmeddelanden
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Hantera formulärinlämning
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormStatus('sending');
    setErrorMessage('');
  
    try {
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
  
      // För utvecklingsmiljö
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setFormStatus('sent');
        form.reset();
        return;
      }
  
      // För produktion
      const response = await fetch(form.action || window.location.pathname, {
        method: 'POST',
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData as any).toString(),
      });
  
      if (response.ok) {
        setFormStatus('sent');
        form.reset();
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Form submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setFormStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    }
  };
  
  return (
    <AnimatePresence>
      <form name="contact" data-netlify="true" data-netlify-honeypot="bot-field" hidden>
        <input type="text" name="name" />
        <input type="email" name="email" />
        <textarea name="message"></textarea>
        <input name="bot-field" />
      </form>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg mx-4 bg-space-darker rounded-lg border border-white/10 overflow-hidden"
          >
            {/* Header with glow effect */}
            <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative flex justify-between items-center">
                <h2 className="text-xl font-orbitron text-white">Welcome to SWGOH TW Counter</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-auto max-h-[500px]"> {/* max height and scrollable content */}
              {/* Mission Statement */}
              <div className="flex items-start gap-4">
                <Heart className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <p className="text-white/80">
                  This website is a passion project, built and maintained without any profit motive. Our mission is to help SWGOH players optimize their Territory Wars strategy.
                </p>
              </div>

              {/* Infrastructure Info */}
              <div className="flex items-start gap-4">
                <Database className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <p className="text-white/80">
                  While the site is free to use, there are ongoing costs for domain hosting and database maintenance. Your support helps keep this resource available to the community.
                </p>
              </div>

              {/* Form Content */}
              <div>
                <p className="text-white/80 mb-2">Have any questions or suggestions? Feel free to drop a message:</p>

                {/* Netlify Form */}
                <form
                    name="contact"
                    method="POST"
                    action="/success" // Lägg till detta
                    data-netlify="true"
                    data-netlify-honeypot="bot-field"
                    onSubmit={handleFormSubmit}
                    className="space-y-4"
                  >
                    <input type="hidden" name="form-name" value="contact" />
                    <div className="hidden">
                      <input name="bot-field" />
                    </div>
                    <div className="flex flex-col space-y-2">
                    <label htmlFor="name" className="text-white/80">Your Name</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      className="p-2 bg-transparent border border-white/30 text-white rounded-lg"
                      placeholder="Your Name"
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label htmlFor="email" className="text-white/80">Your Email</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      className="p-2 bg-transparent border border-white/30 text-white rounded-lg"
                      placeholder="Your Email"
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label htmlFor="message" className="text-white/80">Your Message</label>
                    <textarea
                      name="message"
                      id="message"
                      required
                      className="p-2 bg-transparent border border-white/30 text-white rounded-lg"
                      placeholder="Your Message"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 mt-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all"
                    disabled={formStatus === 'sending'}
                  >
                    {formStatus === 'sending' ? 'Sending...' : 'Send Message'}
                  </button>
                </form>

                {/* Bekräftelse och felmeddelanden */}
                {formStatus === 'sent' && (
                  <p className="mt-4 text-green-500">Thank you for your message! We will get back to you soon.</p>
                )}
                {formStatus === 'error' && (
                  <p className="mt-4 text-red-500">{errorMessage}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-2 bg-white/5 flex items-center justify-center gap-1">
              <a
                href="https://www.buymeacoffee.com/jbrannelid"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-[#FFDD00] text-black hover:bg-[#FFDD00]/90 transition-all text-sm"
              >
                <Coffee className="w-4 h-4" />
                <span className="hidden sm:block">Support the Project</span>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
