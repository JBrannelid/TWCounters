import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { useAuth } from '@/contexts/AuthContext';
import AppContent from '@/components/AppContent';

const AdminRoutes = React.lazy(() => 
  import('@/components/adminmenu/AdminRoutes').then(module => ({
    default: module.AdminRoutes
  }))
);

const CookiePolicy = React.lazy(() => 
  import('@/components/CookieConsent/CookiePolicy').then(module => ({
    default: module.CookiePolicy
  }))
);

export const MainRoutes: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          isAdmin ? <Navigate to="/admin" replace /> : <AppContent />
        } 
      />
      
      <Route 
        path="/cookie-policy" 
        element={
          <Suspense fallback={<LoadingIndicator size="lg"  message="Loading..."/>}>
            <CookiePolicy />
          </Suspense>
        } 
      />

      {/* Protected Admin Routes */}
      <Route 
        path="/admin/*" 
        element={
          isAdmin ? (
            <Suspense 
              fallback={
                <div className="min-h-screen bg-space-darker flex items-center justify-center">
                  <LoadingIndicator size="lg" message="Loading admin dashboard..." />
                </div>
              }
            >
              <AdminRoutes />
            </Suspense>
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};