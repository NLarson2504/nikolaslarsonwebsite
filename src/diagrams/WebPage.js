import React, { useState, useEffect } from 'react';
import imagePreloader from '../utils/imagePreloader';

// Global index to ensure different images for each component
let currentImageIndex = 0;

const WebPage = ({ 
  className = "",
  size = "medium",
  imageIndex = null // Optional prop to specify which image to use
}) => {
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const selectImage = () => {
      const webImages = imagePreloader.getWebImages();
      
      if (webImages.length > 0) {
        let imageToUse;
        
        if (imageIndex !== null) {
          // Use specific image index if provided
          imageToUse = webImages[imageIndex % webImages.length];
        } else {
          // Use round-robin selection for variety
          imageToUse = webImages[currentImageIndex % webImages.length];
          currentImageIndex++;
        }
        
        setSelectedImage(imageToUse);
      }
    };

    if (imagePreloader.areImagesLoaded()) {
      selectImage();
    } else {
      // Wait for images to be preloaded
      imagePreloader.preloadAllImages().then(() => {
        selectImage();
      });
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