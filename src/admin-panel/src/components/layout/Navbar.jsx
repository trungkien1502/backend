import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common';

const titles = {
  '/dashboard': 'Dashboard',
  '/movies': 'Movies',
  '/cinemas': 'Cinemas',
  '/rooms': 'Rooms & Seats',
  '/showtimes': 'Showtimes',
  '/bookings': 'Bookings',
};

export const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const title = titles[location.pathname] || 'Cinema Admin';

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex h-[68px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu size={18} />
          </button>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Cinema Admin</p>
            <h1 className="mt-0.5 text-lg font-semibold text-slate-950">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  );
};
