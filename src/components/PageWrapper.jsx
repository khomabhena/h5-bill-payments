import React from 'react';

const PageWrapper = ({ children, className = "" }) => {
  return (
    <div className={`min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex flex-col ${className}`}>
      <main className="flex-1 w-full max-w-4xl mx-auto">
        {children}
      </main>
    </div>
  );
};

export default PageWrapper;

