import React from 'react';
import { colors } from '../data/colors';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'font-semibold transition-all duration-200 focus:outline-none focus:ring-0 focus:ring-offset-0 active:outline-none w-full block cursor-pointer border-0 outline-none';
  
  const variantClasses = {
    primary: 'text-black shadow-md hover:shadow-lg transform hover:-translate-y-0.5',
    secondary: 'bg-white border-1 border-gray-300 text-gray-700 hover:border-gray-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg',
    success: 'bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg',
    ghost: 'bg-transparent hover:bg-gray-50'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl'
  };

  const disabledClasses = 'cursor-not-allowed';
  const loadingClasses = 'relative';

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled || loading ? disabledClasses : ''}
    ${loading ? loadingClasses : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Get inline styles for primary variant
  const getInlineStyles = () => {
    if (variant === 'primary') {
      if (disabled || loading) {
        return {
          backgroundColor: '#e3f1e8',
          opacity: 1
        };
      }
      return {
        backgroundColor: colors.app.primary,
      };
    }
    return {};
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      style={getInlineStyles()}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center w-full">
          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        <span className="w-full">{children}</span>
      )}
    </button>
  );
};

export default Button;

