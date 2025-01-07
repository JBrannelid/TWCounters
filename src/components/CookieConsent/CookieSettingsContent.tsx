import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { CookieManager } from './CookieManager';
import { COOKIE_CATEGORIES } from './CookieConsentTypes';

interface CookieSettingsContentProps {
  onSave?: () => void;
}

export const CookieSettingsContent: React.FC<CookieSettingsContentProps> = ({ onSave }) => {
  const [categories, setCategories] = useState(COOKIE_CATEGORIES);

  // Load saved consent when component mounts
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

  return (
    <div className="space-y-6 p-6">
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

      <div className="flex justify-end">
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