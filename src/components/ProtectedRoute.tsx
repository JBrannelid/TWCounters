import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

// this prop will be used to determine if the user needs to be an admin to access the route or not
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

// Create the ProtectedRoute component that will be used to protect routes that require authentication
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false
}) => {
  const { currentUser, isAdmin, loading } = useAuth(); // get the currentUser and isAdmin status from the AuthContext
  const location = useLocation();

  if (loading) { // if the loading state is true, show a loading indicator while the user is being authenticated
    return (
      <div className="min-h-screen bg-space-darker flex items-center justify-center">
        <LoadingIndicator size="lg" message="Verifying access..." />
      </div>
    );
  }

  if (!currentUser) { // if there is no currentUser, redirect the user to the login page
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) { // if the route requires an admin and the user is not an admin, redirect the user to the home page
    return <Navigate to="/" replace />;
  }
// if the user is authenticated and has the required permissions, render the children and allow access to the route
  return <>{children}</>; 
};