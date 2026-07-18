import React from 'react';

const SiteDetail = ({ 
  title, 
  description, 
  url,
  repositoryUrl,
  image,
  features = [],
  technologies = [],
  category = "Web Development",
  status = "Live",
  className = "" 
}) => {
  return (
    <div className={`bg-dark-900/50 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-all duration-300 ${className}`}>
      {/* Image Preview */}
      {image && (
        <div className="aspect-video w-full overflow-hidden bg-dark-800">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-heading font-bold text-dark-50 mb-2">{title}</h3>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {category}
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                {status}
              </div>
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
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Technologies */}
        {technologies.length > 0 && (
          <div className="mb-6">
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

        {/* Links */}
        <div className="flex gap-3">
          {url && (
            <a 
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View Live Site
            </a>
          )}
          {repositoryUrl && (
            <a 
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 text-sm font-medium rounded-lg border border-white/10 hover:border-white/20 transition-all"
            >
              View Code
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiteDetail;