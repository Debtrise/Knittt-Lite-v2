'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

type SplashScreenProps = {
  onFinished: () => void;
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Keep splash screen visible for 2 seconds, then start fade out
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 2200);

    // After fade out animation completes, call onFinished
    const fadeTimer = setTimeout(() => {
      onFinished();
    }, 3000); // 2200ms delay + 800ms for the animation

    return () => {
      clearTimeout(timer);
      clearTimeout(fadeTimer);
    };
  }, [onFinished]);

  return (
    <div
      className={`fixed z-50 transition-opacity duration-800 ease-in-out ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      } lg:left-64 lg:right-0 lg:top-0 lg:bottom-0 left-0 right-0 top-0 bottom-0 bg-white flex items-center justify-center`}
    >
      <div className="w-72 h-auto relative">
        <Image 
          src="/logo.png" 
          alt="Knitt Logo" 
          width={400} 
          height={200} 
          priority 
          className={`w-full h-auto transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>
    </div>
  );
};

export default SplashScreen; 