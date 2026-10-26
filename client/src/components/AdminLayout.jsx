import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';

/**
 * AdminLayout component.
 * Renders a clean Tailwind sidebar for navigation with an exit link to the map
 * and renders a React Router <Outlet /> in the main content area.
 */
export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#EEFCFA] text-mengede-dark font-['Plus_Jakarta_Sans',sans-serif] antialiased overflow-hidden">
      {/* Clean Tailwind Admin Sidebar */}
      <aside className="w-64 bg-mengede-dark text-white flex flex-col justify-between shrink-0 shadow-xl z-30 border-r border-white/10 select-none">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10 shrink-0">
            <div className="w-9 h-9 rounded-full bg-mengede-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-[20px]">
                alt_route
              </span>
            </div>
            <div>
              <span className="text-[17px] font-bold text-white tracking-tight block">
                Mengede
              </span>
              <span className="text-[10px] text-mengede-sage uppercase tracking-wider block font-semibold">
                Moderation Hub
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-5 flex-1 overflow-y-auto">
            <p className="px-3 pb-2 text-[11px] text-white/50 uppercase tracking-wider font-semibold">
              Admin Operations
            </p>
            <nav className="flex flex-col gap-1.5">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                    isActive
                      ? 'bg-mengede-teal text-white font-semibold shadow-xs'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">
                  hourglass_top
                </span>
                <span>Pending Approvals</span>
              </NavLink>

              <NavLink
                to="/admin/terminals"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                    isActive
                      ? 'bg-mengede-teal text-white font-semibold shadow-xs'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">
                  location_city
                </span>
                <span>Terminals Overview</span>
              </NavLink>

              <NavLink
                to="/admin/history"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
                    isActive
                      ? 'bg-mengede-teal text-white font-semibold shadow-xs'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">
                  history
                </span>
                <span>Action History</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer Controls & Exit Link */}
        <div className="p-4 border-t border-white/10 bg-black/10 shrink-0 flex flex-col gap-2">
          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/70 hover:text-red-300 hover:bg-white/5 transition-colors text-[13px] font-medium cursor-pointer w-full text-left"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>

          {/* Single-arrow exit link back to the map root route */}
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-[14px] font-semibold cursor-pointer border border-white/10 hover:border-white/20"
          >
            <span>← Back to Map</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-[#EEFCFA]">
        <Outlet />
      </main>
    </div>
  );
}
