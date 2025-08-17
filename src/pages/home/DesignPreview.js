import React from 'react';
import { Palette } from 'lucide-react';
import FeatureContainer from '../../components/FeatureContainer';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';
import WebPageDiagram from '../../diagrams/WebPageDiagram';

const DesignPreview = () => {
  return (
    <section 
      id="design"
      className="design-preview h-[650px] md:h-[650px] bg-dark-950 border-t border-white/5"
    >
      <div className="h-full flex flex-col-reverse md:flex-row">
        {/* Feature Container - Left on desktop, Bottom on mobile */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex items-center justify-center p-4 md:p-8">
          <div className="max-w-md">
            <FeatureContainer
              categoryIcon={Palette}
              category="Design"
              title="The world's most flexible design platform"
              description="The most popular open-source platform for design. Use our platform as your foundation and focus on building the customizations that move the needle."
              link="/design"
              linkTitle="Get Started"
            />
          </div>
        </div>

        {/* Visual Background - Right on desktop, Top on mobile */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full">
          <VisBackgroundComponent className="h-full flex items-center justify-center">
            <WebPageDiagram />
          </VisBackgroundComponent>
        </div>
      </div>
    </section>
  );
};

export default DesignPreview;