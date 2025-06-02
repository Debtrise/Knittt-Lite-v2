import React from 'react';
import Link from 'next/link';
import { 
  LogOut, 
  MessageSquare, 
  FileText, 
  Folder, 
  Phone, 
  Home, 
  Users, 
  Settings, 
  BarChart,
  Layers,
  Route,
  Link2
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart,
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: Users,
  },
  {
    name: 'Journeys',
    href: '/journeys',
    icon: Route,
  },
  {
    name: 'Calls',
    href: '/calls',
    icon: Phone,
  },
  {
    name: 'DIDs',
    href: '/dids',
    icon: Layers,
  },
  {
    name: 'Dialplan',
    href: '/dialplan',
    icon: Route,
  },
  {
    name: 'SMS',
    items: [
      {
        name: 'Campaigns',
        href: '/sms',
        icon: MessageSquare,
      },
      {
        name: 'Templates',
        href: '/sms/templates',
        icon: FileText,
      },
      {
        name: 'Categories',
        href: '/sms/templates/categories',
        icon: Folder,
      },
      {
        name: 'Numbers',
        href: '/sms/numbers',
        icon: Phone,
      },
    ],
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: FileText,
  },
  {
    name: 'Webhooks',
    href: '/webhooks',
    icon: Link2,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    name: 'admin',
    href: '/admin',
    icon: Settings,
  },
];

interface SidebarProps {
  pathname: string;
  handleLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ pathname, handleLogout }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <img
            className="h-8 w-auto"
            src="/logo.png"
            alt="Knittt"
          />
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.items ? (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {item.name}
                  </div>
                  {item.items.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        pathname === subItem.href
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <subItem.icon
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          pathname === subItem.href
                            ? 'text-gray-500'
                            : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                        aria-hidden="true"
                      />
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    pathname === item.href
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      pathname === item.href
                        ? 'text-gray-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="flex-shrink-0 w-full group block"
        >
          <div className="flex items-center">
            <div>
              <LogOut
                className="inline-block h-6 w-6 rounded-full text-gray-400 group-hover:text-gray-500"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Logout
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 