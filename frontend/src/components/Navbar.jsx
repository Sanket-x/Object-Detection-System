import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo + Title */}
        <Link to="/" className="flex items-center gap-3 group">
          {/* Animated dot */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
          </span>

          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-indigo-300 group-hover:to-cyan-300 transition-colors">
            Smart Surveillance AI
          </h1>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link 
            to="/" 
            className={`transition-colors ${location.pathname === '/' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/history" 
            className={`transition-colors ${location.pathname === '/history' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            History
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            System Online
          </span>

          <span className="text-xs text-slate-500">v1.0</span>
        </div>
      </div>
    </motion.nav>
  );
}
