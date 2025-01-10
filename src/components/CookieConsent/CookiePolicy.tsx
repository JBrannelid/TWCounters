// src/components/CookieConsent/CookiePolicy.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CookieManager } from './CookieManager';
import { COOKIE_CATEGORIES } from './CookieConsentTypes';

interface ScanReport {
  timestamp: string;
  cookies: string[];
  databases: IDBDatabaseInfo[];
  localStorage: Record<string, string>;
}

export const CookiePolicy: React.FC = () => {
  const navigate = useNavigate();
  const [scanReport, setScanReport] = useState<ScanReport | null>(null);

  useEffect(() => {
    const loadScanReport = async () => {
      try {
        const reportString = await CookieManager.generatePrivacyReport();
        const report = JSON.parse(reportString) as ScanReport;
        setScanReport(report);
      } catch (error) {
        console.error('Failed to load scan report:', error);
      }
    };
    loadScanReport();
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  const handleManageCookies = () => {
    CookieManager.clearConsent();
    navigate('/');
  };

  const formatStorageValue = (value: string): string => {
    if (typeof value !== 'string') return 'N/A';
    
    // Om värdet är för långt, trunkera det på ett snyggt sätt
    if (value.length > 50) {
      try {
        // Försök parsa som JSON för bättre formatering
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2).slice(0, 100) + '...';
      } catch {
        // Om det inte är JSON, trunkera det enkelt
        return value.slice(0, 50) + '...';
      }
    }
    return value;
  };

  const formatScanReport = (report: ScanReport) => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Cookies</h3>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="space-y-2">
              {report.cookies.map((cookie, index) => {
                const [name, value] = cookie.split('=');
                return (
                  <div key={index} className="grid grid-cols-2 gap-4">
                    <span className="text-blue-400">{name?.trim()}</span>
                    <span className="text-white/70">{value?.trim()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-white mb-2">IndexedDB Databases</h3>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="space-y-2">
              {report.databases.map((db, index) => (
                <div key={index} className="text-white/70">
                  {db.name} (version {db.version})
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
        <h3 className="text-lg font-medium text-white mb-2">Local Storage</h3>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="space-y-2">
              {Object.entries(report.localStorage).map(([key, value], index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <span className="text-blue-400 font-medium break-all">{key}</span>
                  <span className="text-white/70 break-all font-mono text-sm">
                    {formatStorageValue(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="text-sm text-white/40 italic">
          Last scan: {new Date(report.timestamp).toLocaleString()}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-space-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-space-darker border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-orbitron text-white">Cookie Policy</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 py-8"
      >
        <div className="prose prose-invert">
          <section className="mb-8">            
            <h2 className="text-2xl font-orbitron text-white mt-8 mb-4">Cookie Policy Overview</h2>
            <p className="text-white/80">
              This Cookie Policy explains how SWGOH TW Counter uses cookies and similar tracking 
              technologies to provide, improve, and protect our services. By using our website, 
              you consent to the use of cookies as described in this policy.
            </p>

            <h2 className="text-2xl font-orbitron text-white mt-8 mb-4">Our Cookie Categories</h2>
            {COOKIE_CATEGORIES.map(category => (
              <div key={category.id} className="mb-6">
                <h3 className="text-xl font-orbitron text-white mb-3">{category.name}</h3>
                <p className="text-white/80 mb-4">{category.description}</p>
                
                {category.cookies.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-lg font-medium text-white mb-3">Cookies in this category:</h4>
                    {category.cookies.map((cookie, index) => (
                      <div key={index} className="mb-4 last:mb-0">
                        <div className="text-blue-400 font-medium mb-1">{cookie.name}</div>
                        <div className="text-white/70 text-sm mb-1">{cookie.description}</div>
                        <div className="text-white/50 text-sm">
                          Duration: {cookie.duration} | Type: {cookie.type}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <h2 className="text-2xl font-orbitron text-white mt-8 mb-4">Your Rights and Choices</h2>
            <div className="space-y-4">
              <p className="text-white/80">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-white/80 space-y-2">
                <li>Accept or decline non-essential cookies</li>
                <li>Change your cookie preferences at any time</li>
                <li>Request information about the cookies we use</li>
                <li>Request deletion of your cookie data</li>
              </ul>
            </div>

            {/* Scan Report Section */}
            {scanReport && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 p-6 bg-white/5 rounded-lg border border-white/10"
              >
                <h2 className="text-2xl font-orbitron text-white mb-4">Current Cookie Usage</h2>
                <p className="text-white/70 mb-6">
                  Below is a detailed report of all cookies and storage currently in use on this website:
                </p>
                {formatScanReport(scanReport)}
              </motion.div>
            )}

            <div className="mt-8 pt-8 border-t border-white/10">
              <button
                onClick={handleManageCookies}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         transition-colors flex items-center gap-2"
              >
                Manage Cookie Settings
              </button>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default CookiePolicy;