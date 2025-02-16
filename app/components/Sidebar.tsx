import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Timer, 
  Users, 
  MonitorPlay,
  History,
  PlusCircle,
  LogOut
} from 'lucide-react';

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Active Events',
      href: '/events/active',
      icon: Timer
    },
    {
      name: 'Event History',
      href: '/events/history',
      icon: History
    },
    {
      name: 'Room Management',
      href: '/room',
      icon: Users
    },
    {
      name: 'Display Settings',
      href: '/display/settings',
      icon: MonitorPlay
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-[#1d1d1f]">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">Lumeo</span>
          </div>
        </div>

        {/* Create New Event Button */}
        <div className="p-4 pl-5 pr-0">
          <Link
            href="/events/new"
            className="flex items-center justify-center space-x-2 w-full bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-3  rounded-lg transition-colors text-sm font-medium"
          >
            <PlusCircle size={20} />
            <span>Create Event</span>
          </Link>
        </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 pl-5 pr-0 ">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 mb-1 backdrop-blur-sm
                  ${active 
                    ? 'bg-dark-card text-white shadow-lg' 
                    : 'text-text-secondary hover:bg-dark-surface hover:text-text-primary'
                  }`}
              >
                <Icon size={20} className={active ? 'text-white' : 'text-text-tertiary'} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Active Event Status */}
        <div className="p-4 pr-0 pl-5">
          <div className="rounded-lg bg-dark-card backdrop-blur-sm p-4 pr-0 shadow-lg">
            <h3 className="text-sm font-medium text-text-primary mb-2">Active Event</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-status-success animate-ping opacity-75" />
              </div>
              <span className="text-sm text-text-secondary font-medium">Poker Tournament</span>
            </div>
          </div>
        </div>

  

        {/* Spacer */}
        <div className="flex-1" />

      

        {/* User Profile & Settings */}
        <div className="p-4 pr-0 border-t border-dark-border/80 ml-5 pl-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center">
                <span className="text-brand-primary font-medium">
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {session?.user?.name || session?.user?.email}
                </p>
                {(session?.user as ExtendedUser)?.isAdmin && (
                  <p className="text-xs text-brand-primary">Admin</p>
                )}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-dark-surface transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 