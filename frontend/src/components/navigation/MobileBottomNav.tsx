// frontend/src/components/navigation/MobileBottomNav.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Home, 
  BarChart2, 
  PieChart, 
  List, 
  User,
  AlertTriangle
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export default function MobileBottomNav() {
  const router = useRouter();
  const [alertCount, setAlertCount] = useState(0);
  
  // Update alert count whenever relevant data changes
  useEffect(() => {
    // This would be connected to your alert service
    const fetchAlertCount = async () => {
      // Fetch from API in real implementation
      setAlertCount(3); // Mock data
    };
    
    fetchAlertCount();
    const intervalId = setInterval(fetchAlertCount, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const navItems: NavItem[] = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Market', href: '/dashboard/market', icon: BarChart2 },
    { name: 'Portfolio', href: '/dashboard/portfolio', icon: PieChart },
    { name: 'Watchlist', href: '/dashboard/watchlist', icon: List },
    { name: 'Alerts', href: '/dashboard/alerts', icon: AlertTriangle, badge: alertCount },
    { name: 'Account', href: '/dashboard/account', icon: User },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700">
      <div className="grid h-full grid-cols-6">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.name}
              href={item.href}
              className={`inline-flex flex-col items-center justify-center px-5 group ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-500' 
                  : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500'
              }`}
            >
              <div className="relative">
                <Icon size={20} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
