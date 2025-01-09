import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import { CookieManager } from './CookieManager';
import { COOKIE_CATEGORIES } from './CookieConsentTypes';

interface CookieSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CookieSettings: React.FC<CookieSettingsProps> = ({ isOpen, onClose }) => {
  const [categories, setCategories] = React.useState(COOKIE_CATEGORIES);

  // Load saved consent when the modal opens
  useEffect(() => {
    if (isOpen) {
      const savedConsent = CookieManager.getStoredConsent();
      if (savedConsent) {
        setCategories(prev => prev.map(category => {
          const consentValue = savedConsent[category.id as keyof typeof savedConsent];
          return {
            ...category,
            enabled: category.required || (typeof consentValue === 'boolean' ? consentValue : false)
          };
        }));
      }
    }
  }, [isOpen]);

  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);
  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(current => current === categoryId ? null : categoryId);
  };
  
  const handleSaveSettings = () => {
    const consent = {
      necessary: true,
      preferences: categories.find(c => c.id === 'preferences')?.enabled || false,
      analytics: categories.find(c => c.id === 'analytics')?.enabled || false,
      marketing: categories.find(c => c.id === 'marketing')?.enabled || false,
      timestamp: new Date().toISOString()
    };
    
    CookieManager.setConsent(consent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-space-darker border border-white/10 rounded-xl max-w-2xl w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-orbitron text-white">Cookie Settings</h2>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {categories.map(category => (
            <div
              key={category.id}
              className="p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      {category.name}
                      <span className="px-2 py-0.5 text-sm bg-white/10 rounded-full text-white/60">
                        {category.cookies.length}
                      </span>
                    </h3>
                    {category.required && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400
                                   flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/60 mt-1">{category.description}</p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={category.enabled}
                    onChange={() => {
                      if (!category.required) {
                        setCategories(prev =>
                          prev.map(cat =>
                            cat.id === category.id ? { ...cat, enabled: !cat.enabled } : cat
                          )
                        );
                      }
                    }}
                    disabled={category.required}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer 
                              peer-checked:bg-blue-500 peer-disabled:bg-white/5
                              after:content-[''] after:absolute after:top-0.5 
                              after:left-[2px] after:bg-white after:rounded-full
                              after:h-5 after:w-5 after:transition-all
                              peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-white/10 bg-white/5 
                     hover:bg-white/10 text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 
                     text-white transition-colors"
          >
            Save Settings
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};