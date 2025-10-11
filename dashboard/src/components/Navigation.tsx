import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, AlertTriangle, Settings, Activity, Moon, Sun, MessageCircle,
  Menu, X, Droplets, ChevronRight, Bell, User, LogOut, Search,
  BarChart3, Shield, Zap
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useAuth } from '../contexts/AuthContext';

// Enhanced animation variants with fixed TypeScript typing
const navVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
      staggerChildren: 0.08,
      delayChildren: 0.1,
      when: "beforeChildren" as const
    }
  }
};

const itemVariants = {
  hidden: { y: -30, opacity: 0, scale: 0.9 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 15
    }
  }
};

const mobileMenuVariants = {
  hidden: {
    x: "100%",
    opacity: 0,
    skewX: "-5deg"
  },
  visible: {
    x: 0,
    opacity: 1,
    skewX: "0deg",
    transition: {
      type: "spring" as const,
      stiffness: 80,
      damping: 15,
      staggerChildren: 0.08,
      delayChildren: 0.2,
      when: "beforeChildren" as const
    }
  },
  exit: {
    x: "100%",
    opacity: 0,
    skewX: "5deg",
    transition: {
      duration: 0.3,
      ease: "easeInOut" as const
    }
  }
};

// Item animations for mobile menu
const mobileItemVariants = {
  hidden: { x: 30, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20
    }
  },
  exit: {
    x: 20,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

// Logo animation
const logoVariants = {
  hidden: { rotate: -10, scale: 0.8, opacity: 0 },
  visible: {
    rotate: 0,
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 15
    }
  }
};

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(3);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home, color: 'from-blue-400 to-cyan-500' },
    { path: '/town', label: 'Town View', icon: BarChart3, color: 'from-green-400 to-teal-500' },
    { path: '/alerts', label: 'Alerts', icon: AlertTriangle, color: 'from-yellow-400 to-orange-500' },
    { path: '/chat', label: 'AI Chat', icon: MessageCircle, color: 'from-purple-400 to-pink-500' },
    { path: '/settings', label: 'Settings', icon: Settings, color: 'from-gray-400 to-gray-600' },
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Admin Panel', icon: Shield, color: 'from-red-400 to-red-600' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const quickStats = [
    { icon: Droplets, value: '85%', label: 'Water Level' },
    { icon: Zap, value: '2.5L/min', label: 'Flow Rate' },
    { icon: Shield, value: 'Good', label: 'Quality' },
  ];

  return (
    <>
      <motion.nav 
        initial="hidden"
        animate="visible"
        variants={navVariants}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'glass-heavy shadow-2xl' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              variants={itemVariants}
              className="flex items-center space-x-3"
            >
              <motion.div
                className="relative"
                variants={logoVariants}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95, rotate: -5 }}
              >
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg overflow-hidden relative">
                  <Activity className="h-8 w-8 text-white relative z-10" />
                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-300/30 to-blue-400/0 animate-shine"></div>
                </div>
                {/* Enhanced status indicator */}
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                  initial={false}
                  animate={{
                    scale: [1, 1.5, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(16, 185, 129, 0.7)',
                      '0 0 0 5px rgba(16, 185, 129, 0.2)',
                      '0 0 0 0 rgba(16, 185, 129, 0.7)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              
              <div>
                <motion.h1
                  className="text-2xl font-bold text-gradient"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  Smart Tank
                </motion.h1>
                <motion.p
                  className="text-xs text-gray-600 dark:text-gray-400"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  Intelligent Water Management
                </motion.p>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div 
              variants={itemVariants}
              className="hidden lg:flex items-center space-x-2"
            >
              {navItems.map(({ path, label, icon: Icon, color }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className="relative group"
                  >
                    <motion.div
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all overflow-hidden ${
                        isActive
                          ? 'bg-gradient-to-r ' + color + ' text-white shadow-lg'
                          : 'hover:bg-white/10'
                      }`}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      transition={{
                        scale: { type: "spring", stiffness: 400, damping: 15 }
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{label}</span>
                      
                      {/* Active state indication */}
                      {isActive && (
                        <>
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl"
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                          {/* Active indicator dots */}
                          <motion.div
                            className="absolute right-2 bottom-1"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <span className="flex space-x-1">
                              <motion.span
                                className="block w-1 h-1 rounded-full bg-white"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                              />
                              <motion.span
                                className="block w-1 h-1 rounded-full bg-white"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                              />
                              <motion.span
                                className="block w-1 h-1 rounded-full bg-white"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                              />
                            </span>
                          </motion.div>
                        </>
                      )}
                      
                      {/* Hover animation overlay */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                        initial={{ x: '-100%', opacity: 0 }}
                        whileHover={{ x: '100%', opacity: 1 }}
                        transition={{ duration: 0.8 }}
                      />
                    </motion.div>
                    
                    {/* Tooltip */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none"
                    >
                      {label}
                    </motion.div>
                  </Link>
                );
              })}
            </motion.div>

            {/* Quick Stats (Desktop) */}
            <motion.div 
              variants={itemVariants}
              className="hidden xl:flex items-center space-x-4"
            >
              {quickStats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl glass"
                  whileHover={{ scale: 1.05 }}
                >
                  <stat.icon className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-sm font-bold">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Right Controls */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center space-x-3"
            >
              {/* Search Button */}
              <motion.button
                className="hidden md:flex p-3 rounded-xl glass hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Search className="h-5 w-5" />
              </motion.button>

              {/* Notifications */}
              <motion.button
                className="relative p-3 rounded-xl glass hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                  >
                    {notifications}
                  </motion.span>
                )}
              </motion.button>

              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                className="p-3 rounded-xl glass hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95, rotate: 180 }}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </motion.button>

              {/* Admin Navigation */}
              {isAdmin && (
                <motion.div 
                  variants={itemVariants}
                  className="hidden lg:flex items-center space-x-2"
                >
                  {adminNavItems.map(({ path, label, icon: Icon, color }) => {
                    const isActive = location.pathname === path;
                    return (
                      <Link
                        key={path}
                        to={path}
                        className="relative group"
                      >
                        <motion.div
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all overflow-hidden ${
                            isActive
                              ? 'bg-gradient-to-r ' + color + ' text-white shadow-lg'
                              : 'hover:bg-white/10'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{label}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </motion.div>
              )}

              {/* User Menu */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-xl glass hover:bg-white/10 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-90' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-2 w-48 rounded-xl glass-heavy shadow-2xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/10">
                        <p className="font-semibold">{user?.full_name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          isAdmin ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user?.role}
                        </span>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/profile"
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                        <button 
                          onClick={() => {
                            setShowUserMenu(false);
                            handleSignOut();
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-all text-red-500"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Toggle */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-3 rounded-xl glass hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Status Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="hidden md:block border-t border-white/10"
        >
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-500">System Online</span>
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  Last Update: 2 mins ago
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 dark:text-gray-400">
                  Tank: 85% Full
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  Flow: 2.5 L/min
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed right-0 top-0 bottom-0 w-80 glass-heavy shadow-2xl z-50 lg:hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-gradient">Menu</h2>
                  <motion.button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/10 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </div>

                {/* Mobile Nav Items */}
                <div className="space-y-2">
                  {navItems.map(({ path, label, icon: Icon, color }) => {
                    const isActive = location.pathname === path;
                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <motion.div
                          variants={mobileItemVariants}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden ${
                            isActive
                              ? 'bg-gradient-to-r ' + color + ' text-white shadow-lg'
                              : 'hover:bg-white/10'
                          }`}
                          whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{label}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>

                {/* Mobile Quick Stats */}
                <div className="mt-8 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                    Quick Stats
                  </h3>
                  {quickStats.map((stat, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl glass"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center space-x-2">
                        <stat.icon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{stat.label}</span>
                      </div>
                      <span className="font-bold">{stat.value}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navigation */}
      <div className="h-20 md:h-28" />
    </>
  );
};