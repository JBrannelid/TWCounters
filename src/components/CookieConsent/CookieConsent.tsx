// src/components/CookieConsent/CookieConsent.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Check, Shield, ChevronRight, Lock, ChevronDown } from 'lucide-react';
import type { 
  CookieCategory, 
  CookieConsentData,
  CookieConsentProps
} from './CookieConsentTypes';
import { 
  COOKIE_CATEGORIES
} from './CookieConsentTypes';
import { CookieManager } from './CookieManager';
import { useNavigate } from 'react-router-dom';

export const CookieConsentBanner: React.FC<CookieConsentProps> = ({ 
  onAccept, 
  onDecline 
}) => {
  const [showBanner, setShowBanner] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [categories, setCategories] = useState<CookieCategory[]>(COOKIE_CATEGORIES);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCookiePolicyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/cookie-policy');
  };
  // Kontrollera om cookie consent redan finns
  useEffect(() => {
    const savedConsent = CookieManager.getStoredConsent();
    if (savedConsent) {
      setShowBanner(false);
    }
  }, []);

  // Skanna efter existerande cookies
  const scanForCookies = useCallback(() => {
    try {
      const existingCookies = CookieManager.scanCookies();
      console.log('Detected storage items:', existingCookies);
    } catch (error) {
      console.error('Error scanning cookies:', error);
    }
  }, []);

  useEffect(() => {
    scanForCookies();
  }, [scanForCookies]);

  // Hantera acceptans av alla cookies
  const handleAcceptAll = () => {
    const consent: CookieConsentData = {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    
    CookieManager.setConsent(consent);
    onAccept?.(consent);
    setShowBanner(false);
  };

  // Hantera avböjande av cookies
  const handleDecline = () => {
    const consent: CookieConsentData = {
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    
    CookieManager.setConsent(consent);
    onDecline?.();
    setShowBanner(false);
  };

  // Hantera sparande av inställningar
  const handleSaveSettings = () => {
    const consent: CookieConsentData = {
      necessary: true,
      preferences: categories.find(c => c.id === 'preferences')?.enabled || false,
      analytics: categories.find(c => c.id === 'analytics')?.enabled || false,
      marketing: categories.find(c => c.id === 'marketing')?.enabled || false,
      timestamp: new Date().toISOString()
    };
    
    CookieManager.setConsent(consent);
    onAccept?.(consent);
    setShowSettings(false);
    setShowBanner(false);
  };

  // Växla kategori
  const toggleCategory = (categoryId: string) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId && !cat.required 
          ? { ...cat, enabled: !cat.enabled }
          : cat
      )
    );
  };

  // Växla expanderad kategori
  const toggleExpandCategory = (categoryId: string) => {
    setExpandedCategory(current => current === categoryId ? null : categoryId);
  };

  if (!showBanner) return null;

  // JSX för banner
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
      <div className="absolute inset-0 bg-transparent backdrop-blur-md" />
        
        <div className="relative max-w-7xl mx-auto p-6">
          {!showSettings ? (
            // Huvudbanner
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 rounded-xl border border-white/10 p-6 bg-gray-900/90">
              <div className="flex-shrink-0 p-3 bg-blue-500/10 rounded-full">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>
              
              <div className="flex-grow space-y-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-orbitron text-white">
                    Your Privacy Matters to Us
                  </h2>
                  <p className="text-sm text-white/70 max-w-2xl">
                    We use cookies to enhance your experience on our website by optimizing loading times and locally storing images, squads, and counter setups. 
                    This data is used exclusively to improve site performance and is never shared with external services or advertising partners.
                    You can customize your cookie preferences or accept the default settings.
                  </p>
                  <button 
                  onClick={handleCookiePolicyClick}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 group"
                >
                  Read our cookie-policy 
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0 w-full lg:w-auto">
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-6 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 
                           text-white transition-colors flex items-center justify-center gap-2
                           hover:border-white/20"
                >
                  <Settings className="w-4 h-4" />
                  <span>Customize</span>
                </button>
                <button
                  onClick={handleDecline}
                  className="px-6 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 
                           text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-2
                           border border-red-500/20 hover:border-red-500/30"
                >
                  <X className="w-4 h-4" />
                  <span>Reject all</span>
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 
                           text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept all</span>
                </button>
              </div>
            </div>
          ) : (
            // Inställningar vy
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-space-darker border border-white/10 rounded-xl overflow-hidden"
            >
              {/* Inställningsvy innehåll... (behåll existerande JSX) */}
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-orbitron text-white flex items-center gap-3">
                  <Settings className="w-6 h-6 text-blue-400" />
                  Cookie Settings
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 
                             transition-colors group"
                  >
                    {/* Behåll existerande kategori JSX */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-grow">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium group-hover:text-blue-400 
                                       transition-colors flex items-center gap-2">
                            {category.name}
                            <span className="px-2 py-0.5 bg-gray-500/20 rounded-full text-xs">
                              {category.cookies.length}
                            </span>
                            <button
                              onClick={() => toggleExpandCategory(category.id)}
                              className="p-1 hover:bg-white/5 rounded-full"
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                  expandedCategory === category.id ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </h4>
                          {category.required && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400
                                         flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/60">{category.description}</p>
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={category.enabled}
                          onChange={() => toggleCategory(category.id)}
                          disabled={category.required}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 rounded-full peer 
                                    peer-checked:bg-blue-500/80 peer-disabled:bg-white/5
                                    after:content-[''] after:absolute after:top-0.5 
                                    after:left-[2px] after:bg-white after:rounded-full
                                    after:h-5 after:w-5 after:transition-all
                                    peer-checked:after:translate-x-full
                                    peer-hover:ring-2 peer-hover:ring-blue-400/30"></div>
                      </label>
                    </div>

                    {/* Expanded cookie details */}
                    <AnimatePresence>
                      {expandedCategory === category.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 space-y-3 pl-4 border-l border-white/10"
                        >
                          {category.cookies.map((cookie, index) => (
                            <div key={index} className="space-y-1">
                              <div className="text-sm font-medium text-white/80">
                                {cookie.name}
                              </div>
                              <div className="text-xs text-white/60">
                                {cookie.description}
                              </div>
                              <div className="text-xs text-white/40 flex gap-4">
                                <span>Duration: {cookie.duration}</span>
                                <span>Type: {cookie.type}</span>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2.5 rounded-lg border border-white/10 bg-white/5 
                           hover:bg-white/10 text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 
                           text-white transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const CookieConsent = CookieConsentBanner;