import React from 'react';

const PageWrapper = ({ children, className = '' }) => {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className={`min-h-screen mx-auto flex w-full max-w-4xl flex-col bg-white px-4 sm:px-6 lg:px-8 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;

