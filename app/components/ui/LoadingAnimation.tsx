'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface LoadingAnimationProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'fullscreen' | 'content' | 'inline';
  className?: string;
  isDashboard?: boolean;
}

const sizeConfig = {
  sm: { icon: 32, container: 'p-4' },
  md: { icon: 48, container: 'p-6' },
  lg: { icon: 64, container: 'p-8' },
  xl: { icon: 80, container: 'p-12' }
};

export function LoadingAnimation({
  isVisible,
  message = 'Loading...',
  progress,
  showProgress = false,
  size = 'lg',
  variant = 'fullscreen',
  className = '',
  isDashboard = false
}: LoadingAnimationProps) {
  const config = sizeConfig[size];
  const [iconError, setIconError] = useState(false);

  const containerVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  const iconVariants = {
    hidden: { 
      opacity: 0,
      rotate: -180,
      scale: 0.5
    },
    visible: { 
      opacity: 1,
      rotate: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  };

  const spinAnimation = {
    rotate: 360,
    transition: {
      duration: 2,
      ease: 'linear',
      repeat: Infinity
    }
  };

  const getContainerClasses = () => {
    const baseClasses = 'flex flex-col items-center justify-center';
    
    if (variant === 'inline') {
      return `${baseClasses} ${config.container}`;
    }

    // For dashboard layout, loading should be positioned within the main content area
    if (isDashboard) {
      return `${baseClasses} fixed lg:pl-64 inset-y-0 right-0 left-0 z-40 bg-white/80 backdrop-blur-sm ${config.container}`;
    }

    // For non-dashboard pages, loading covers the entire viewport
    return `${baseClasses} fixed inset-0 z-50 bg-white/90 backdrop-blur-sm ${config.container}`;
  };

  const ProgressBar = () => (
    <div className="w-64 bg-gray-200 rounded-full h-2 mt-4 overflow-hidden">
      <motion.div
        className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress || 0}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );

  if (!isVisible) return null;

  const LoadingContent = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`${getContainerClasses()} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* Main loading icon with animations */}
      <motion.div
        variants={iconVariants}
        initial="hidden"
        animate="visible"
        className="relative mb-4"
      >
        <motion.div
          animate={spinAnimation}
          className="relative"
        >
          {iconError ? (
            <Loader2 
              size={config.icon} 
              className="animate-spin text-blue-500"
            />
          ) : (
            <Image
              src="/loading-icon.png"
              alt="Loading"
              width={config.icon}
              height={config.icon}
              className="drop-shadow-lg"
              priority
              onError={() => setIconError(true)}
            />
          )}
        </motion.div>
      </motion.div>

      {/* Loading message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-center"
      >
        <p className="text-gray-700 font-medium mb-1">{message}</p>
        
        {showProgress && typeof progress === 'number' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-gray-500 mb-2"
          >
            {Math.round(progress)}%
          </motion.p>
        )}
      </motion.div>

      {/* Progress bar */}
      {showProgress && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <ProgressBar />
        </motion.div>
      )}

      {/* Floating dots animation */}
      <motion.div
        className="flex space-x-1 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              delay: i * 0.2,
              ease: 'easeInOut',
              repeat: Infinity
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      <LoadingContent />
    </AnimatePresence>
  );
}

// Mini loading component for smaller areas
export function MiniLoadingAnimation({ 
  size = 'sm', 
  message = '',
  className = '' 
}: {
  size?: 'sm' | 'md';
  message?: string;
  className?: string;
}) {
  const iconSize = size === 'sm' ? 20 : 24;
  const [iconError, setIconError] = useState(false);
  
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          ease: 'linear',
          repeat: Infinity
        }}
      >
        {iconError ? (
          <Loader2 
            size={iconSize} 
            className="animate-spin text-blue-500"
          />
        ) : (
          <Image
            src="/loading-icon.png"
            alt="Loading"
            width={iconSize}
            height={iconSize}
            className="drop-shadow-lg"
            priority
            onError={() => setIconError(true)}
          />
        )}
      </motion.div>
      {message && (
        <span className="text-sm text-gray-600">{message}</span>
      )}
    </div>
  );
} 