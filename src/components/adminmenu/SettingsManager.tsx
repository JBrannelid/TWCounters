import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Moon, Sun, 
  Save, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { useTheme } from '@/contexts/ThemeContext';
import { LoadingIndicator } from '../ui/LoadingIndicator';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'sv';
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  dataRefreshInterval: number;
  autoSync: boolean;
}

export const SettingsManager: React.FC = () => {
  // const { theme: currentTheme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    language: 'en',
    notifications: {
      enabled: true,
      sound: true,
      desktop: false
    },
    dataRefreshInterval: 30,
    autoSync: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(false);
    } catch (err) {
      setError('Failed to load settings');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // simulate API call
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingIndicator size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-orbitron text-white flex items-center gap-2">
          <Settings className="w-6 h-6" />
          App Settings
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 
                   text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Appearance Settings */}
        <GlassCard variant="darker" className="p-6">
          <h3 className="text-lg font-medium text-white mb-6">Appearance</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['light', 'dark', 'system'].map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => updateSettings('theme', themeOption)}
                    className={`flex items-center justify-center gap-2 p-2 
                             rounded-lg border transition-colors ${
                      settings.theme === themeOption
                        ? 'bg-blue-500/20 border-blue-500 text-white'
                        : 'border-white/10 text-white/60 hover:bg-white/5'
                    }`}
                  >
                    {themeOption === 'light' && <Sun className="w-4 h-4" />}
                    {themeOption === 'dark' && <Moon className="w-4 h-4" />}
                    <span className="capitalize">{themeOption}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Language
              </label>
              <select
                value={settings.language}
                onChange={e => updateSettings('language', e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 
                         rounded-lg text-white appearance-none"
              >
                <option value="en">English</option>
                <option value="sv">Svenska</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Notification Settings */}
        <GlassCard variant="darker" className="p-6">
          <h3 className="text-lg font-medium text-white mb-6">Notifications</h3>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.enabled}
                onChange={e => updateSettings('notifications', {
                  ...settings.notifications,
                  enabled: e.target.checked
                })}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500"
              />
              <span className="ml-2 text-white">Enable Notifications</span>
            </label>

            {settings.notifications.enabled && (
              <>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sound}
                    onChange={e => updateSettings('notifications', {
                      ...settings.notifications,
                      sound: e.target.checked
                    })}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500"
                  />
                  <span className="ml-2 text-white">Sound</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications.desktop}
                    onChange={e => updateSettings('notifications', {
                      ...settings.notifications,
                      desktop: e.target.checked
                    })}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500"
                  />
                  <span className="ml-2 text-white">Desktop Notifications</span>
                </label>
              </>
            )}
          </div>
        </GlassCard>

        {/* Data Settings */}
        <GlassCard variant="darker" className="p-6">
          <h3 className="text-lg font-medium text-white mb-6">Data Management</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Auto-refresh Interval (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.dataRefreshInterval}
                onChange={e => updateSettings('dataRefreshInterval', 
                  parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 
                         rounded-lg text-white"
              />
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoSync}
                onChange={e => updateSettings('autoSync', e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500"
              />
              <span className="ml-2 text-white">Enable Auto-sync</span>
            </label>
          </div>
        </GlassCard>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <AlertTitle className="text-green-400">Success</AlertTitle>
              <AlertDescription className="text-green-400">
                Settings saved successfully
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsManager;