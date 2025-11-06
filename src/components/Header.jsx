import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ title, onBack, showBackButton = true, className = "" }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`bg-white px-3 pt-14 pb-4 flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-3">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h2 className="text-base font-semibold text-gray-500">
          {title}
        </h2>
      </div>
      <div className="w-10"></div> {/* Spacer for centering */}
    </div>
  );
};

export default Header;

