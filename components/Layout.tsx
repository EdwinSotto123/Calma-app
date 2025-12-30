import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Heart, AlertTriangle, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isChat = location.pathname === '/chat';
  const isSOS = location.pathname === '/sos';
  const isLive = location.pathname === '/live';

  // Pages that don't show bottom nav
  const hideNav = ['/login', '/register', '/onboarding'].includes(location.pathname) ||
    location.pathname.startsWith('/love/');

  if (hideNav) return <>{children}</>;

  const tabs = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/wellness', icon: Heart, label: 'Bienestar', activeColor: 'text-teal-600' },
    { to: '/sos', icon: AlertTriangle, label: 'SOS', activeColor: 'text-rose-500' },
    { to: '/profile', icon: User, label: 'Perfil' },
  ];

  const getBackgroundClass = () => {
    if (isLive) return 'bg-slate-900';
    if (isSOS) return 'bg-rose-50';
    return 'bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-teal-50/80';
  };

  return (
    <div className={`fixed inset-0 sm:static sm:min-h-screen sm:flex sm:justify-center sm:items-center sm:py-8 font-sans transition-colors duration-500 ${getBackgroundClass()}`}>

      {/* App Frame */}
      <div className="w-full h-full sm:h-[850px] sm:max-w-md bg-white/40 shadow-2xl overflow-hidden flex flex-col relative sm:rounded-[2.5rem] sm:border-[8px] sm:border-white ring-1 ring-black/5 backdrop-blur-3xl">

        {/* Background Orbs */}
        {!isLive && !isChat && (
          <>
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply animate-pulse"></div>
            <div className="absolute top-40 -right-20 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
            <div className="absolute -bottom-20 left-10 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
          </>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 relative z-10 w-full ${isChat ? 'overflow-hidden flex flex-col' : 'overflow-y-auto overflow-x-hidden scrollbar-hide'}`}>
          <div className={`w-full ${isChat ? 'h-full' : 'min-h-full'} ${!isChat && !isSOS ? 'pb-24' : ''} ${isSOS ? 'pb-6' : ''}`}>
            {children}
          </div>
        </main>

        {/* Bottom Navigation - 4 Tabs */}
        {!isSOS && (
          <nav className="absolute bottom-0 left-0 right-0 h-20 glass-nav flex justify-around items-center px-4 z-50 rounded-t-[2rem] sm:rounded-b-[2rem] shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.to ||
                (tab.to === '/wellness' && ['/kit', '/journal', '/chat', '/live'].includes(location.pathname));
              const activeColor = tab.activeColor || 'text-teal-600';

              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${isActive ? `${activeColor} -translate-y-1` : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} fill={isActive && tab.to === '/wellness' ? 'currentColor' : 'none'} />
                  <span className="text-[10px] font-bold">{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
};

export default Layout;