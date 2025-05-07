import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/app/store/authStore';
import { Phone, Users, BarChart, Layers, Settings, FileText, User, LogOut, Menu, X, GitBranch, MessageSquare } from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <BarChart className="w-6 h-6" /> },
    { name: 'Leads', href: '/leads', icon: <Users className="w-6 h-6" /> },
    { name: 'Calls', href: '/calls', icon: <Phone className="w-6 h-6" /> },
    { name: 'DIDs', href: '/dids', icon: <Layers className="w-6 h-6" /> },
    { name: 'Dialplan', href: '/dialplan', icon: <GitBranch className="w-6 h-6" /> },
    { name: 'SMS', href: '/sms', icon: <MessageSquare className="w-6 h-6" /> },
    { name: 'Reports', href: '/reports', icon: <FileText className="w-6 h-6" /> },
    { name: 'Settings', href: '/settings', icon: <Settings className="w-6 h-6" />, adminOnly: true },
  ];

  const filteredNavigation = user?.role === 'admin' 
    ? navigation 
    : navigation.filter(item => !item.adminOnly);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-40 flex">
          <div
            className={`fixed inset-0 bg-gray-600 bg-opacity-75 ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setSidebarOpen(false)}
          />

          <div
            className={`relative flex-1 flex flex-col max-w-xs w-full sidebar-brand ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center justify-center px-4">
                <div className="h-10 w-auto relative">
                  <Image 
                    src="/logo.png" 
                    alt="Knitt Logo" 
                    width={120} 
                    height={40} 
                    className="w-auto h-10"
                  />
                </div>
              </div>
              <nav className="mt-5 px-2 space-y-3">
                {filteredNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-4 text-lg font-bold rounded-md ${
                      pathname === item.href
                        ? 'bg-brand text-white'
                        : 'text-gray-300 hover:bg-brand hover:bg-opacity-80 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-4">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
              <div className="flex-shrink-0 group block">
                <div className="flex items-center">
                  <div>
                    <User className="inline-block h-10 w-10 rounded-full text-gray-300 bg-gray-600 p-2" />
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-white">{user?.username}</p>
                    <p className="text-sm font-medium text-gray-300">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 sidebar-brand">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center justify-center flex-shrink-0 px-4">
              <div className="h-12 w-auto relative">
                <Image 
                  src="/logo.png" 
                  alt="Knitt Logo" 
                  width={150} 
                  height={50} 
                  className="w-auto h-12"
                />
              </div>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-3">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-4 text-lg font-bold rounded-md ${
                    pathname === item.href
                      ? 'bg-brand text-white'
                      : 'text-gray-300 hover:bg-brand hover:bg-opacity-80 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="ml-4">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <User className="inline-block h-9 w-9 rounded-full text-gray-300 bg-gray-600 p-2" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.username}</p>
                  <p className="text-xs font-medium text-gray-300">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 flex items-center text-sm font-medium text-brand hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-brand">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1 pb-10">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 