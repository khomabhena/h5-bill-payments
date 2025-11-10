import React from 'react';

const PageWrapper = ({ children, className = '' }) => {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className={`min-h-screen mx-auto pb-8 flex w-full max-w-4xl flex-col bg-white px-4l sm:px-6l lg:px-4l ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;

