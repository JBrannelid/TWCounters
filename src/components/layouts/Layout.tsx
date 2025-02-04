import React from 'react';
import { Header } from '../Header';

interface LayoutProps {
  children: React.ReactNode;
  isAdmin: boolean;
  onLogout: () => void;
  onAdminClick: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  isAdmin,
  onLogout,
  onAdminClick
}) => {
  return (
    <div className="min-h-screen bg-space-black">
      {/* Show header when not in admin menu */}
      {!isAdmin && (
        <Header 
          isAdmin={isAdmin}
          onLogout={onLogout}
          onAdminClick={onAdminClick}
        />
      )}
      {children}
    </div>
  );
};