import React, { useState, useEffect } from 'react';
import { Shield, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CookieManager } from './CookieManager';
import { COOKIE_CATEGORIES } from './CookieConsentTypes';

interface CookieSettingsContentProps {
  onSave?: () => void;
}

export const CookieSettingsContent: React.FC<CookieSettingsContentProps> = ({ onSave }) => {
  const [categories, setCategories] = useState(COOKIE_CATEGORIES);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const savedConsent = CookieManager.getStoredConsent();
    if (savedConsent) {
      setCategories(prev => prev.map(category => ({
        ...category,
        enabled: category.required || Boolean(savedConsent[category.id as keyof typeof savedConsent]) || false
      })));
    }
  }, []);

  const handleSaveSettings = () => {
    const consent = {
      necessary: true,
      preferences: categories.find(c => c.id === 'preferences')?.enabled || false,
      analytics: categories.find(c => c.id === 'analytics')?.enabled || false,
      marketing: categories.find(c => c.id === 'marketing')?.enabled || false,
      timestamp: new Date().toISOString()
    };
    
    CookieManager.setConsent(consent);
    onSave?.();
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(current => current === categoryId ? null : categoryId);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {categories.map(category => (
        <div
          key={category.id}
          className="p-4 rounded-lg bg-white/5 border border-white/10 transition-all duration-200 hover:border-white/20"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  {category.name}
                  <span className="px-2 py-0.5 text-sm bg-white/10 rounded-full text-white/60">
                    {category.cookies.length}
                  </span>
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                    aria-label={expandedCategory === category.id ? "Collapse" : "Expand"}
                  >
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedCategory === category.id ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                </h3>
                {category.required && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400
                               flex items-center gap-1 whitespace-nowrap">
                    <Shield className="w-3 h-3" />
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm text-white/60 mb-2 sm:mb-0">{category.description}</p>
            </div>

            <div className="flex justify-end sm:flex-shrink-0">
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

          <AnimatePresence>
            {expandedCategory === category.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 space-y-3 pl-4 border-l border-white/10"
              >
                {category.cookies.map((cookie, index) => (
                  <div 
                    key={index} 
                    className="group relative bg-gradient-to-r from-space-dark/50 to-transparent
                             p-4 rounded-lg border border-white/10 hover:border-white/20 
                             transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h4 className="text-base font-medium text-white group-hover:text-blue-400 
                                   transition-colors duration-200">
                        {cookie.name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <span className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${cookie.type === 'Local Storage' 
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                            : cookie.type === 'IndexedDB'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}
                        `}>
                          {cookie.type}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full 
                                       text-xs font-medium bg-white/5 text-white/60 
                                       border border-white/10">
                          {cookie.duration}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-white/70 leading-relaxed 
                                pl-3 border-l-2 border-white/10 
                                group-hover:border-blue-500/50 transition-colors">
                      {cookie.description}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 
                   text-white transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};