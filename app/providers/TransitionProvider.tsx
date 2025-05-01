'use client';

import React, { ReactNode } from 'react';

type TransitionProviderProps = {
  children: ReactNode;
};

const TransitionProvider = ({ children }: TransitionProviderProps) => {
  // Just render children directly without animations or splash screen
  return <>{children}</>;
};

export default TransitionProvider; 