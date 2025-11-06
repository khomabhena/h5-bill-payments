import React from 'react';
import { colors } from '../../data/colors';

/**
 * ReusableButton - A single, comprehensive button component for all button types
 */
const ReusableButton = ({
  children,
  onClick,
  selected = false,
  disabled = false,
  loading = false,
  variant = 'action',
  size = 'md',
  className = '',
  type = 'button',
  icon,
  customColors,
  ...rest
}) => {
  const buttonColors = customColors || colors;
  const baseClasses = 'font-semibold transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-0 active:outline-none cursor-pointer outline-none border-0';
  
  const getVariantClasses = () => {
    const isSelected = selected;
    
    switch (variant) {
      case 'selection':
        return isSelected 
          ? 'bg-white text-gray-700 border-2'
          : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200';
      
      case 'card':
        return isSelected 
          ? 'text-black rounded-xl'
          : 'bg-white text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-200';
      
      case 'action':
        return 'text-black';
      
      default:
        return 'text-white';
    }
  };
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'py-2 px-3 text-xs rounded-lg';
      case 'md': return 'py-3 px-4 text-sm rounded-lg';
      case 'lg': return 'py-4 px-6 text-base rounded-xl';
      case 'xl': return 'py-5 px-8 text-lg rounded-2xl';
      default: return 'py-3 px-4 text-sm rounded-lg';
    }
  };
  
  const disabledClasses = disabled || loading 
    ? 'bg-gray-300 text-gray-500 cursor-not-allowed transform-none shadow-none hover:shadow-none border-gray-300' 
    : '';

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center space-x-2">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </div>
      );
    }

    if (variant === 'selection' && icon) {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center">
            {icon}
          </div>
          <span className="text-xs font-medium">{children}</span>
        </div>
      );
    }

    return children;
  };

  const getInlineStyles = () => {
    if (disabled || loading) return {};
    
    const isSelected = selected;
    const styles = {};
    
    switch (variant) {
      case 'selection':
        styles.borderStyle = 'solid';
        styles.borderWidth = '1px';
        if (isSelected) {
          styles.borderColor = buttonColors.app.primary;
          styles.backgroundColor = buttonColors.app.primary;
          styles.color = buttonColors.text.primary;
        } else {
          styles.borderColor = buttonColors.border.primary;
          styles.backgroundColor = buttonColors.background.primary;
        }
        break;
      
      case 'card':
        styles.borderStyle = 'solid';
        styles.borderWidth = '1px';
        if (isSelected) {
          styles.borderColor = buttonColors.app.primary;
          styles.backgroundColor = buttonColors.app.primary;
        } else {
          styles.borderColor = buttonColors.border.primary;
          styles.backgroundColor = buttonColors.background.primary;
        }
        break;
      
      case 'action':
        styles.backgroundColor = buttonColors.app.primary;
        break;
    }
    
    return styles;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={getInlineStyles()}
      className={`
        ${baseClasses}
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${disabledClasses}
        ${className}
      `}
      {...rest}
    >
      {renderContent()}
    </button>
  );
};

export default ReusableButton;

