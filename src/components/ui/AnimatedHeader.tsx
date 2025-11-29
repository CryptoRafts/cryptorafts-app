"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/providers/SimpleAuthProvider';
import { signOut as firebaseSignOut, auth } from '@/lib/firebase.client';
import AnimatedButton from './AnimatedButton';
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface AnimatedHeaderProps {
  title?: string;
  subtitle?: string;
  showUserInfo?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
  showSignOut?: boolean;
  navigation?: Array<{
    label: string;
    href: string;
    active?: boolean;
  }>;
  className?: string;
}

const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title = "CRYPTORAFTS",
  subtitle,
  showUserInfo = true,
  showNotifications = true,
  showSettings = true,
  showSignOut = true,
  navigation = [],
  className = ''
}) => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`
        neo-glass-card border-b border-white/10 sticky top-0 z-50
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <motion.div 
            className="flex items-center space-x-4"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.img 
              src="/cryptorafts.logo.png" 
              alt="Cryptorafts" 
              className="h-12 w-12"
              width={48}
              height={48}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            />
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-sm text-white/60">{subtitle}</p>
              )}
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className={`
                  relative px-3 py-2 rounded-lg transition-all duration-300
                  ${item.active 
                    ? 'text-blue-400 font-semibold bg-blue-500/20' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                  }
                `}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {item.label}
                {item.active && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.a>
            ))}
          </nav>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* Time Display */}
            <motion.div 
              className="hidden lg:flex items-center space-x-2 text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-mono">{formatTime(currentTime)}</span>
            </motion.div>

            {/* User Info */}
            {showUserInfo && user && (
              <motion.div 
                className="hidden sm:flex items-center space-x-2 text-white/60"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <NeonCyanIcon type="user" size={16} className="text-current" />
                <span className="text-sm">{user.email}</span>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {showNotifications && (
                <motion.button
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors relative"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <NeonCyanIcon type="bell" size={20} className="text-white" />
                  {/* Notification Badge */}
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.button>
              )}

              {showSettings && (
                <motion.button
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <NeonCyanIcon type="settings" size={20} className="text-white" />
                </motion.button>
              )}

              {showSignOut && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <AnimatedButton
                    variant="danger"
                    size="sm"
                    onClick={async () => {
                      try {
                        await firebaseSignOut(auth);
                        window.location.href = '/';
                      } catch (error) {
                        console.error('Sign out error:', error);
                      }
                    }}
                    icon={<NeonCyanIcon type="logout" size={16} className="text-current" />}
                  >
                    Sign Out
                  </AnimatedButton>
                </motion.div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NeonCyanIcon type="close" size={24} className="text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NeonCyanIcon type="menu" size={24} className="text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-white/10 overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {navigation.map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    className={`
                      block px-4 py-2 rounded-lg transition-all duration-300
                      ${item.active 
                        ? 'text-blue-400 font-semibold bg-blue-500/20' 
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                      }
                    `}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default AnimatedHeader;
