import React from 'react';
import { Smartphone } from 'lucide-react';
import FeatureContainer from '../../components/FeatureContainer';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';
import MobileDiagram from '../../diagrams/MobileDiagram';

const MobilePreview = () => {
  return (
    <section 
      id="mobile"
      className="mobile-preview h-[650px] md:h-[650px] bg-dark-950 border-t border-white/5"
    >
      <div className="h-full flex flex-col md:flex-row">
        {/* Visual Background - Left on desktop, Bottom on mobile */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full">
          <VisBackgroundComponent className="h-full flex items-center justify-center">
            <MobileDiagram className="w-full h-full" />
          </VisBackgroundComponent>
        </div>

        {/* Feature Container - Right on desktop, Top on mobile */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex items-center justify-center p-4 md:p-8">
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