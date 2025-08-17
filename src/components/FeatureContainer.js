import React from 'react';

const FeatureContainer = ({ 
  categoryIcon: IconComponent, 
  category, 
  title, 
  description, 
  link, 
  linkTitle 
}) => {
  return (
    <div className="feature-container p-6 group text-left">
      {/* Icon and Category Header - Horizontal Layout */}
      <div className="flex items-center mb-6">
        <IconComponent className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors duration-300 mr-3" />
        <div className="text-sm font-semibold text-white uppercase tracking-wide">
          {category}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-heading font-bold text-white mb-6 group-hover:text-blue-300 transition-colors duration-300">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-400 leading-relaxed mb-8 font-sans font-medium">
        {description}
      </p>

      {/* Link */}
      {link && linkTitle && (
        <a 
          href={link}
          className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300 group/link"
        >
          <span>{linkTitle}</span>
          <svg 
            className="w-4 h-4 ml-2 transform group-hover/link:translate-x-1 transition-transform duration-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}
    </div>
  );
};

export default FeatureContainer;