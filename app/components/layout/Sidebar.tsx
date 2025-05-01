import Link from 'next/link';
import { LogOut } from 'lucide-react';

const Sidebar = ({ navigation, pathname, handleLogout }) => {
  return (
    <div className="gradient-animation">
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-20">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 bg-white border-b">
            <h1 className="text-xl font-bold text-gray-900">Dialer App</h1>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  pathname === item.href
                    ? 'bg-brand text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 