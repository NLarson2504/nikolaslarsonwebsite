import React from 'react';
import { Palette } from 'lucide-react';
import FeatureContainer from '../../components/FeatureContainer';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';

const DesignPreview = () => {
  return (
    <section 
      id="design"
      className="design-preview h-[650px] bg-dark-950 border-t border-white/5"
    >
      <div className="h-full flex">
        {/* Left Half - Feature Container */}
        <div className="w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md">
            <FeatureContainer
              categoryIcon={Palette}
              category="Design"
              title="UI/UX Design & Branding"
              description="Creating intuitive user interfaces and comprehensive brand identities. From wireframing to high-fidelity prototypes, focusing on user-centered design principles and modern aesthetic trends."
              link="/design"
              linkTitle="View Design Work"
            />
          </div>
        </div>

        {/* Right Half - Visual Background */}
        <div className="w-1/2">
          <VisBackgroundComponent className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-20">🎨</div>
              <h3 className="text-2xl font-heading font-bold text-white/30">
                Creative Design
              </h3>
              <p className="text-white/20 font-sans">
                UI/UX & Brand Identity
              </p>
            </div>
          </VisBackgroundComponent>
        </div>
      </div>
    </section>
  );
};

export default DesignPreview;