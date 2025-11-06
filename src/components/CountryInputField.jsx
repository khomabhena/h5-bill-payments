import React from 'react';
import { colors } from '../data/colors';

const CountryInputField = ({
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  error,
  loading = false,
  icon,
  rightIcon,
  className = '',
  customColors,
  ...props
}) => {
  const fieldColors = customColors || colors;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs font-medium" style={{ color: fieldColors.text.secondary }}>
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full border rounded-lg focus:outline-none focus:ring-1 focus:border-transparent text-base transition-all duration-200
            ${icon ? 'pl-12' : 'pl-4'}
            ${rightIcon ? 'pr-12' : 'pr-4'}
            py-3
            ${error ? 'border-red-300' : ''}
            bg-white
          `}
          style={{
            borderColor: fieldColors.border.primary,
            color: fieldColors.text.black,
          }}
          onFocus={(e) => e.target.style.boxShadow = `0 0 0 3px ${fieldColors.ring.primary}40`}
          onBlur={(e) => e.target.style.boxShadow = 'none'}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CountryInputField;

