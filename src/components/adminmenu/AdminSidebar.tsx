import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Ship, PlusCircle, Settings, BarChart2 } from 'lucide-react';

const menuItems = [
  { 
    label: 'Dashboard', 
    icon: <BarChart2 className="w-5 h-5" />, 
    path: '/admin' 
  },
  { 
    label: 'Squads', 
    icon: <Shield className="w-5 h-5" />, 
    path: '/admin/squads' 
  },
  { 
    label: 'Fleets', 
    icon: <Ship className="w-5 h-5" />, 
    path: '/admin/fleets' 
  },
  { 
    label: 'Settings', 
    icon: <Settings className="w-5 h-5" />, 
    path: '/admin/settings' 
  }
];

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <aside className="w-64 min-h-screen bg-space-black border-r border-white/10">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${location.pathname === item.path
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};