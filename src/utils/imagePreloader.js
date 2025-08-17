// Image preloader utility to load all images on site initialization
class ImagePreloader {
  constructor() {
    this.webImages = [];
    this.mobileImages = [];
    this.isLoaded = false;
    this.loadPromise = null;
  }

  // Load all images from both directories
  async preloadAllImages() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadImages();
    return this.loadPromise;
  }

  async loadImages() {
    try {
      // Load web images
      const webRequireContext = require.context('../assets/images/web', false, /\.(png|jpe?g|svg)$/);
      const webImagePromises = webRequireContext.keys().map(async (item) => {
        const imageSrc = webRequireContext(item);
        await this.preloadImage(imageSrc);
        return imageSrc;
      });

      // Load mobile images
      const mobileRequireContext = require.context('../assets/images/mobile', false, /\.(png|jpe?g|svg)$/);
      const mobileImagePromises = mobileRequireContext.keys().map(async (item) => {
        const imageSrc = mobileRequireContext(item);
        await this.preloadImage(imageSrc);
        return imageSrc;
      });

      // Wait for all images to load
      this.webImages = await Promise.all(webImagePromises);
      this.mobileImages = await Promise.all(mobileImagePromises);
      
      this.isLoaded = true;
      console.log(`Preloaded ${this.webImages.length} web images and ${this.mobileImages.length} mobile images`);
      
      return {
        webImages: this.webImages,
        mobileImages: this.mobileImages
      };
    } catch (error) {
      console.warn('Error preloading images:', error);
      return {
        webImages: [],
        mobileImages: []
      };
    }
  }

  // Preload a single image
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  // Get preloaded web images
  getWebImages() {
    return this.webImages;
  }

  // Get preloaded mobile images
  getMobileImages() {
    return this.mobileImages;
  }

  // Check if images are loaded
  areImagesLoaded() {
    return this.isLoaded;
  }
}

// Create singleton instance
const imagePreloader = new ImagePreloader();

export default imagePreloader;