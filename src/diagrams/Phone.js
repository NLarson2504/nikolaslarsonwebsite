import React from 'react';
import image from '../assets/images/MobileFeatureImg1.png'

const Phone = ({ 
  className = "",
  size = "medium"
}) => {
  const sizeClasses = {
    small: "w-24 h-48",
    medium: "w-32 h-64", 
    large: "w-48 h-96"
  };

  return (
    <div className={`phone-component ${className}`}>
      <div className={`${sizeClasses[size]} bg-gray-950 rounded-[20px] border border-white/10 shadow-2xl relative overflow-hidden`}>
        <div className="absolute inset-1 bg-gray-950 rounded-[16px] overflow-hidden">
          <img src={image} />
        </div>
      </div>
    </div>
  );
};

export default Phone;