import React from 'react';
import { Bot } from 'lucide-react';
import FeatureContainer from '../../components/FeatureContainer';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';

const AgentsPreview = () => {
  return (
    <section 
      id="agents"
      className="agents-preview h-[650px] md:h-[650px] bg-dark-950 border-t border-white/5"
    >
      <div className="h-full flex flex-col-reverse md:flex-row">
        {/* Feature Container - Left on desktop, Bottom on mobile */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex items-center justify-center p-4 md:p-8">
          <div className="max-w-md">
            <FeatureContainer
              categoryIcon={Bot}
              category="AI Agents"
              title="Intelligent Business Automation"
              description="Developing AI agents that transform manual workflows into automated systems. From invoice processing to conversational analytics, creating intelligent solutions that understand context and deliver actionable insights."
              link="/agents"
              linkTitle="Explore AI Agents"
            />
          </div>
        </div>

        {/* Visual Background - Right on desktop, Top on mobile */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full">
          <VisBackgroundComponent className="h-full">
          </VisBackgroundComponent>
        </div>
      </div>
    </section>
  );
};

export default AgentsPreview;