import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Building2, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function MarketingLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/pricing', label: 'Pricing' },
    { to: '/about', label: 'About' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-brand-600 font-bold text-xl">
              <Building2 className="h-7 w-7" />
              PermitPro
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`text-sm font-medium ${location.pathname === l.to ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {l.label}
                </Link>
              ))}
              {user ? (
                <Link to="/dashboard" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition">
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign In</Link>
                  <Link to="/register" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition">
                    Get Started
                  </Link>
                </div>
              )}
            </nav>

            <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="block text-sm font-medium text-gray-600" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <Link to="/dashboard" className="block text-sm font-medium text-brand-600" onClick={() => setMobileOpen(false)}>Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="block text-sm font-medium text-gray-600" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link to="/register" className="block text-sm font-medium text-brand-600" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
                <Building2 className="h-5 w-5" />
                PermitPro
              </div>
              <p className="text-sm">AI-powered pre-permit plan review. Reduce rejection rates. Accelerate approvals.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Product</h4>
              <div className="space-y-2 text-sm">
                <Link to="/pricing" className="block hover:text-white">Pricing</Link>
                <Link to="/about" className="block hover:text-white">About</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <div className="space-y-2 text-sm">
                <span className="block">Privacy Policy</span>
                <span className="block">Terms of Service</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-sm text-center">
            &copy; {new Date().getFullYear()} PermitPro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
