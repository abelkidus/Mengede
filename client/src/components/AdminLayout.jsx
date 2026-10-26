import { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

/**
 * AdminLayout component.
 * Renders a responsive Tailwind sidebar (off-canvas drawer on mobile, static on desktop)
 * with a mobile header containing a hamburger menu toggle, backdrop overlay,
 * and renders a React Router <Outlet /> in the main content area.
 */
export default function AdminLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#EEFCFA] text-mengede-dark font-['Plus_Jakarta_Sans',sans-serif] antialiased overflow-hidden relative">
      {/* 1. Mobile-only top header with hamburger toggle */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-mengede-dark text-white flex items-center justify-between px-4 z-40 border-b border-white/10 md:hidden select-none shadow-md">
        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          className="p-2 -ml-1 text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2 font-bold text-white tracking-tight">
          <div className="w-7 h-7 rounded-full bg-mengede-primary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-white text-[16px]">
              alt_route
            </span>
          </div>
          <span className="text-[15px]">Mengede Moderation Hub</span>
        </div>

        <Link
          to="/"
          title="Back to Map"
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">map</span>
        </Link>
      </header>

      {/* 2. Backdrop Overlay for mobile drawer */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity animate-fade-in"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* 3. Responsive Sidebar (Off-canvas drawer on mobile, static on desktop) */}
      <aside
        className={`w-64 bg-mengede-dark text-white flex flex-col justify-between shrink-0 shadow-2xl md:shadow-xl z-50 border-r border-white/10 select-none fixed inset-y-0 left-0 transform transition-transform duration-300 md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
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

            {/* Close button inside sidebar on mobile */}
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Close menu"
              className="md:hidden p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
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
                onClick={closeSidebar}
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
                onClick={closeSidebar}
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
                onClick={closeSidebar}
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
            onClick={closeSidebar}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-[14px] font-semibold cursor-pointer border border-white/10 hover:border-white/20"
          >
            <span>← Back to Map</span>
          </Link>
        </div>
      </aside>

      {/* 4. Main Content Area */}
      <main className="flex-1 w-full overflow-y-auto relative bg-[#EEFCFA] pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
