import React, { useState, useEffect } from 'react';

// Dynamic import function to load all images from web directory
const importAllImages = () => {
  const images = {};
  
  // Import all images from the web directory
  const requireContext = require.context('../assets/images/web', false, /\.(png|jpe?g|svg)$/);
  
  requireContext.keys().forEach((item, index) => {
    images[item.replace('./', '')] = requireContext(item);
  });
  
  return Object.values(images);
};

// Global image pool and index to ensure different images for each component
let globalImagePool = [];
let currentImageIndex = 0;

const WebPage = ({ 
  className = "",
  size = "medium",
  imageIndex = null // Optional prop to specify which image to use
}) => {
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    // Load images only once globally
    if (globalImagePool.length === 0) {
      globalImagePool = importAllImages();
    }
    
    if (globalImagePool.length > 0) {
      let imageToUse;
      
      if (imageIndex !== null) {
        // Use specific image index if provided
        imageToUse = globalImagePool[imageIndex % globalImagePool.length];
      } else {
        // Use round-robin selection for variety
        imageToUse = globalImagePool[currentImageIndex % globalImagePool.length];
        currentImageIndex++;
      }
      
      setSelectedImage(imageToUse);
    }
  }, [imageIndex]);

  const sizeClasses = {
    small: "w-32 h-20",
    medium: "w-48 h-32", 
    large: "w-64 h-40",
    xlarge: "w-[32rem] h-[20rem]"
  };

  return (
    <div className={`webpage-component ${className}`}>
      <div className={`${sizeClasses[size]} bg-gray-950 rounded-lg border border-white/10 shadow-2xl relative overflow-hidden`}>
        <div className="absolute inset-1 bg-white rounded-md overflow-hidden">
          <div className="h-3 bg-gray-200 border-b border-gray-300 flex items-center px-1">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
            </div>
            <div className="ml-2 flex-1 h-1 bg-gray-100 rounded"></div>
          </div>
          <div className="flex-1 overflow-hidden">
            {selectedImage ? (
              <img 
                src={selectedImage} 
                alt="Web design preview" 
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <div className="text-gray-400 text-xs">Loading...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebPage;