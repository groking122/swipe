'use client';

import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

const Card = ({ className = '', children }: CardProps) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`} suppressHydrationWarning>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

const CardHeader = ({ className = '', children }: CardHeaderProps) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`} suppressHydrationWarning>
      {children}
    </div>
  );
};

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

const CardContent = ({ className = '', children }: CardContentProps) => {
  return (
    <div className={`px-6 py-4 ${className}`} suppressHydrationWarning>
      {children}
    </div>
  );
};

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

const CardFooter = ({ className = '', children }: CardFooterProps) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 ${className}`} suppressHydrationWarning>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardContent, CardFooter }; 