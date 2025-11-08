import React from 'react';

const PageWrapper = ({ children, className = '' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className={`min-h-screen mx-auto flex w-full max-w-4xl flex-col px-4 sm:px-6 lg:px-8 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;

