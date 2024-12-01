import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, Heart, Coffee, Globe, Database } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  return (
    <AnimatePresence>
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
            <div className="p-6 space-y-6">
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

              {/* Contact Info */}
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-white/80 mb-2">
                    Questions, suggestions, or feedback? I'd love to hear from you! Contact me at:
                  </p>
                  <a
                    href="mailto:jbrannelid@gmail.com"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    jbrannelid@gmail.com
                  </a>
                </div>
              </div>

              {/* Support Options */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://www.buymeacoffee.com/jbrannelid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#FFDD00] text-black hover:bg-[#FFDD00]/90 transition-all"
                >
                  <Coffee className="w-5 h-5" />
                  Support the Project
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/5 flex items-center justify-center gap-2">
              <Globe className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/40">Made with love for the SWGOH community</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}