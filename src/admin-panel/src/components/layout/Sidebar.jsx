import { NavLink } from 'react-router-dom';
import {
  Building2,
  CalendarRange,
  Clapperboard,
  DoorOpen,
  Film,
  LayoutDashboard,
  Ticket,
  X,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/movies', icon: Film, label: 'Movies' },
  { path: '/cinemas', icon: Building2, label: 'Cinemas' },
  { path: '/rooms', icon: DoorOpen, label: 'Rooms & Seats' },
  { path: '/showtimes', icon: CalendarRange, label: 'Showtimes' },
  { path: '/bookings', icon: Ticket, label: 'Bookings' },
];

export const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-slate-900 bg-slate-950 text-slate-100 shadow-2xl shadow-slate-950/20 transition-transform duration-200 lg:static lg:translate-x-0 lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
              <Clapperboard size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace</p>
              <h2 className="text-lg font-semibold text-white">Cinema Admin</h2>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-5">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/80 px-5 py-5 text-xs leading-5 text-slate-500">
          Movies, venues, rooms, showtimes, and bookings.
        </div>
      </aside>
    </>
  );
};
