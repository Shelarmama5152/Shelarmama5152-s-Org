import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Train as TrainIcon, User as UserIcon, LogOut, ShieldCheck, Database } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single Brand Element */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-800 transition-colors">
            <TrainIcon className="w-5 h-5 text-orange-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Rail<span className="text-blue-900">Connect</span>
          </span>
        </button>

        {/* Zone 2: 4-5 Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('home')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'home'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'search'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            Search Trains
          </button>
          <button
            onClick={() => setActiveTab('pnr')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'pnr'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            PNR Status
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'bookings'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            My Bookings
          </button>
          <button
            onClick={() => setActiveTab('dbms')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'dbms'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-orange-600" />
            DBMS Lab & SQL
          </button>
          {user?.Role === 'Admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors py-1 text-orange-600 ${
                activeTab === 'admin'
                  ? 'font-bold border-b-2 border-orange-600'
                  : 'hover:text-orange-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Portal
            </button>
          )}
          <button
            onClick={() => setActiveTab('about')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'about'
                ? 'text-blue-900 font-semibold border-b-2 border-blue-900'
                : 'hover:text-slate-900'
            }`}
          >
            About Us
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action Area */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                  {user.Name}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {user.Role === 'Admin' ? 'Administrator' : 'Passenger'}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Login / Register</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
