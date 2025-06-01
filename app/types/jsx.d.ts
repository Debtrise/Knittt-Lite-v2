import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      svg: React.SVGProps<SVGSVGElement>;
      circle: React.SVGProps<SVGCircleElement>;
      path: React.SVGProps<SVGPathElement>;
    }
  }
} 