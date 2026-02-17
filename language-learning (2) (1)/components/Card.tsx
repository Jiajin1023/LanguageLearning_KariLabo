
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-200 dark:border-slate-700 ${className}`}
    >
      {children}
    </div>
  );
};
