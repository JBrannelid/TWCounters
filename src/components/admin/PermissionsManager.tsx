// src/components/admin/PermissionsManager.tsx

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Shield, UserPlus, Key, Users, 
  CheckCircle, XCircle, AlertTriangle 
} from 'lucide-react';
import { AdminUser } from '@/types';
import { GlassCard } from '../ui/GlassCard';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { FirebaseAdminService } from '@/services/firebaseAdmin';
import { LoadingIndicator } from '../ui/LoadingIndicator';

interface PermissionsManagerProps {
  currentUserId: string;
}

export const PermissionsManager: React.FC<PermissionsManagerProps> = ({
  currentUserId
}) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Implementation för att hämta användare
      // Temporary mockup data
      setUsers([
        {
          uid: '1',
          email: 'admin@example.com',
          isAdmin: true,
          isMasterAdmin: true,
          lastLogin: new Date().toISOString()
        }
      ]);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newUserEmail.trim()) {
      setError('Email is required');
      return;
    }

    try {
      // Implementation för att lägga till användare
      setShowAddUser(false);
      setNewUserEmail('');
    } catch (err) {
      setError('Failed to add user');
    }
  };

  const handleToggleRole = async (userId: string, role: 'admin' | 'masterAdmin') => {
    setProcessingUser(userId);
    try {
      const user = users.find(u => u.uid === userId);
      if (!user) return;

      const updatedUser = {
        ...user,
        [role === 'admin' ? 'isAdmin' : 'isMasterAdmin']: 
        !user[role === 'admin' ? 'isAdmin' : 'isMasterAdmin']
      };

      // Implementation för att uppdatera användarroll
      
      setUsers(users.map(u => 
        u.uid === userId ? updatedUser : u
      ));
    } catch (err) {
      setError('Failed to update user role');
    } finally {
      setProcessingUser(null);
    }
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
          <Shield className="w-6 h-6" />
          User Permissions
        </h2>
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 
                   text-white rounded-lg hover:bg-blue-600"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users List */}
      <div className="grid gap-4">
        {users.map(user => (
          <GlassCard 
            key={user.uid}
            variant="darker" 
            className="p-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-full 
                             flex items-center justify-center">
                  <Users className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <div className="text-white font-medium">{user.email}</div>
                  <div className="text-sm text-white/60">
                    Last login: {new Date(user.lastLogin || '').toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Admin Toggle */}
                <button
                  onClick={() => handleToggleRole(user.uid, 'admin')}
                  disabled={user.uid === currentUserId || processingUser === user.uid}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg 
                           transition-colors ${
                    user.isAdmin
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/5 text-white/60'
                  }`}
                >
                  {user.isAdmin ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Admin
                </button>

                {/* Master Admin Toggle */}
                <button
                  onClick={() => handleToggleRole(user.uid, 'masterAdmin')}
                  disabled={user.uid === currentUserId || processingUser === user.uid}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg 
                           transition-colors ${
                    user.isMasterAdmin
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-white/5 text-white/60'
                  }`}
                >
                  {user.isMasterAdmin ? (
                    <Key className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Master Admin
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 
                     flex items-center justify-center p-4"
            onClick={() => setShowAddUser(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-space-darker p-6 rounded-lg max-w-md w-full 
                       border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-medium text-white mb-4">Add New User</h3>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 
                             rounded-lg text-white"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="flex items-center pt-4">
                  <input
                    type="checkbox"
                    id="makeAdmin"
                    className="w-4 h-4 rounded border-white/10 bg-white/5 
                             text-blue-500"
                  />
                  <label htmlFor="makeAdmin" className="ml-2 text-sm text-white">
                    Make this user an admin
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg 
                             hover:bg-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg 
                             hover:bg-blue-600"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PermissionsManager;