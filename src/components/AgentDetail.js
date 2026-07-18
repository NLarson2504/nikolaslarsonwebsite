import React from 'react';

const AgentDetail = ({ 
  title, 
  description, 
  features = [], 
  technologies = [], 
  status = "In Development",
  icon,
  className = "" 
}) => {
  return (
    <div className={`bg-dark-900/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded overflow-clip bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <img src={icon} alt={title} className="w-12 h-12 object-contain" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-2xl font-heading font-bold text-dark-50 mb-2">{title}</h3>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {status}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-dark-300 font-sans mb-6 leading-relaxed">
        {description}
      </p>

      {/* Features */}
      {features.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-heading font-semibold text-dark-100 mb-3">Key Features</h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-dark-300 font-sans">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Technologies */}
      {technologies.length > 0 && (
        <div>
          <h4 className="text-lg font-heading font-semibold text-dark-100 mb-3">Technologies</h4>
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech, index) => (
              <span 
                key={index} 
                className="px-3 py-1 text-xs font-medium bg-dark-800 text-dark-200 rounded-full border border-white/10"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDetail;