// src/components/layout/Navigation.jsx

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  BarChart2, 
  LineChart, 
  List, 
  Clipboard, 
  Wallet, 
  User, 
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { 
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from '@/components/ui';

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useSelector((state) => state.auth || { user: null, isAuthenticated: true });
  const { status: kycStatus } = useSelector((state) => state.kyc || { status: 'not_started' });
  const { balance } = useSelector((state) => state.wallet || { balance: 0 });
  
  // Decide if KYC badge should be shown
  const showKYCBadge = isAuthenticated && (kycStatus === 'not_started' || kycStatus === 'rejected');
  
  const mainNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <BarChart2 size={18} /> },
    { label: 'Trading', path: '/trading', icon: <LineChart size={18} /> },
    { label: 'Watchlist', path: '/watchlist', icon: <List size={18} /> },
    { label: 'Orders', path: '/orders', icon: <Clipboard size={18} /> },
    { label: 'Wallet', path: '/wallet', icon: <Wallet size={18} /> },
  ];

  const profileNavItems = [
    { label: 'Profile', path: '/profile', icon: <User size={18} /> },
    { label: 'KYC Verification', path: '/kyc', icon: <User size={18} /> },
    { label: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];
  
  // Conditional admin item
  const isAdmin = user?.role === 'admin';
  const adminItems = isAdmin ? [
    { label: 'Admin Dashboard', path: '/admin', icon: <Settings size={18} /> },
    { label: 'User Management', path: '/admin/users', icon: <User size={18} /> },
    { label: 'KYC Management', path: '/admin/kyc', icon: <User size={18} /> },
    { label: 'Wallet Management', path: '/admin/wallet', icon: <Wallet size={18} /> },
  ] : [];
  
  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="font-bold text-xl">StockTrader</Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              {mainNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden md:flex items-center">
            {isAuthenticated && (
              <>
                <div className="mr-4 px-3 py-1 bg-muted/20 rounded-md">
                  <div className="text-xs text-muted-foreground">Balance</div>
                  <div className="font-medium">₹{balance.toFixed(2)}</div>
                </div>
                
                <button className="mr-4 relative">
                  <Bell size={20} />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative" size="sm">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="hidden lg:block">
                          {user?.name || 'User'} 
                        </span>
                        <ChevronDown size={16} className="ml-2" />
                      </div>
                      
                      {showKYCBadge && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {profileNavItems.map((item) => (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link to={item.path} className="flex items-center w-full">
                          {item.icon}
                          <span className="ml-2">{item.label}</span>
                          
                          {item.path === '/kyc' && showKYCBadge && (
                            <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Admin</DropdownMenuLabel>
                        
                        {adminItems.map((item) => (
                          <DropdownMenuItem key={item.path} asChild>
                            <Link to={item.path} className="flex items-center w-full">
                              {item.icon}
                              <span className="ml-2">{item.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center text-red-600">
                      <LogOut size={18} />
                      <span className="ml-2">Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            
            {!isAuthenticated && (
              <div className="flex items-center">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="ml-2">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            {isAuthenticated && (
              <button className="mr-2 relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            )}
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader className="text-left">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                
                {isAuthenticated && (
                  <div className="mt-4 border-b pb-4">
                    <div className="flex items-center relative">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium">{user?.name || 'User'}</div>
                        <div className="text-sm text-muted-foreground">{user?.email || 'user@example.com'}</div>
                      </div>
                      
                      {showKYCBadge && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                    
                    <div className="mt-3 px-3 py-2 bg-muted/20 rounded-md">
                      <div className="text-xs text-muted-foreground">Balance</div>
                      <div className="font-medium">₹{balance.toFixed(2)}</div>
                    </div>
                  </div>
                )}
                
                <div className="py-4">
                  <div className="space-y-1">
                    {mainNavItems.map((item) => (
                      <SheetClose asChild key={item.path}>
                        <Link
                          to={item.path}
                          className="flex items-center py-2 px-3 rounded-md hover:bg-muted"
                        >
                          {item.icon}
                          <span className="ml-3">{item.label}</span>
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                  
                  {isAuthenticated && (
                    <>
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-sm font-medium text-muted-foreground mb-2">Account</div>
                        <div className="space-y-1">
                          {profileNavItems.map((item) => (
                            <SheetClose asChild key={item.path}>
                              <Link
                                to={item.path}
                                className="flex items-center py-2 px-3 rounded-md hover:bg-muted relative"
                              >
                                {item.icon}
                                <span className="ml-3">{item.label}</span>
                                
                                {item.path === '/kyc' && showKYCBadge && (
                                  <span className="absolute right-3 w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                              </Link>
                            </SheetClose>
                          ))}
                        </div>
                      </div>
                      
                      {isAdmin && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="text-sm font-medium text-muted-foreground mb-2">Admin</div>
                          <div className="space-y-1">
                            {adminItems.map((item) => (
                              <SheetClose asChild key={item.path}>
                                <Link
                                  to={item.path}
                                  className="flex items-center py-2 px-3 rounded-md hover:bg-muted"
                                >
                                  {item.icon}
                                  <span className="ml-3">{item.label}</span>
                                </Link>
                              </SheetClose>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-4 border-t">
                        <SheetClose asChild>
                          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 px-3">
                            <LogOut size={18} className="mr-3" />
                            Logout
                          </Button>
                        </SheetClose>
                      </div>
                    </>
                  )}
                  
                  {!isAuthenticated && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <SheetClose asChild>
                        <Link to="/login">
                          <Button variant="outline" className="w-full">Log in</Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/register">
                          <Button className="w-full">Sign up</Button>
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
