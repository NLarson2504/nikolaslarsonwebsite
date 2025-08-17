import React from 'react';
import { Smartphone } from 'lucide-react';
import FeatureContainer from '../../components/FeatureContainer';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';
import MobileDiagram from '../../diagrams/MobileDiagram';

const MobilePreview = () => {
  return (
    <section 
      id="mobile"
      className="mobile-preview h-[650px] bg-dark-950 border-t border-white/5"
    >
      <div className="h-full flex">
        {/* Left Half - Visual Background */}
        <div className="w-1/2">
          <VisBackgroundComponent className="h-full flex items-center justify-center">
            <MobileDiagram className="w-full h-full" />
          </VisBackgroundComponent>
        </div>

        {/* Right Half - Feature Container */}
        <div className="w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md">
            <FeatureContainer
              categoryIcon={Smartphone}
              category="Mobile Development"
              title="Cross-Platform Mobile Apps"
              description="Developing native and cross-platform mobile applications with React Native and Flutter. Focus on performance, user experience, and seamless integration across iOS and Android platforms."
              link="/mobile"
              linkTitle="View Mobile Projects"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobilePreview;