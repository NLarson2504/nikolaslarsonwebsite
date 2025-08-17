import React, { useState, useEffect } from 'react';
import imagePreloader from '../utils/imagePreloader';

// Global index to ensure different images for each component
let currentImageIndex = 0;

const Phone = ({ 
  className = "",
  size = "promax15",
  imageIndex = null // Optional prop to specify which image to use
}) => {
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const selectImage = () => {
      const mobileImages = imagePreloader.getMobileImages();
      
      if (mobileImages.length > 0) {
        let imageToUse;
        
        if (imageIndex !== null) {
          // Use specific image index if provided
          imageToUse = mobileImages[imageIndex % mobileImages.length];
        } else {
          // Use round-robin selection for variety
          imageToUse = mobileImages[currentImageIndex % mobileImages.length];
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
    promax15: "w-[12rem] h-[25rem]",
  };

  return (
    <div className={`phone-component ${className}`}>
      <div className={`${sizeClasses[size]} bg-gray-950 rounded-[20px] border border-white border-opacity-10 shadow-2xl relative overflow-hidden`}>
        <div className="absolute inset-1 bg-gray-950 rounded-[16px] overflow-hidden">
          {selectedImage ? (
            <img 
              src={selectedImage} 
              alt="Mobile app preview" 
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-gray-400 text-xs">Loading...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Phone;