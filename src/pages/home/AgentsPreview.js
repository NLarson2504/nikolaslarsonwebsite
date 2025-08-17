import React from 'react';
import { Bot } from 'lucide-react';
import FeatureContainer from '../../components/FeatureContainer';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';

const AgentsPreview = () => {
  return (
    <section 
      id="agents"
      className="agents-preview h-[650px] bg-dark-950 border-t border-white/5"
    >
      <div className="h-full flex">
        {/* Left Half - Feature Container */}
        <div className="w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md">
            <FeatureContainer
              categoryIcon={Bot}
              category="AI Agents"
              title="Intelligent Automation Solutions"
              description="Building sophisticated AI agents that understand context, make decisions, and automate complex workflows. From customer service bots to data analysis assistants, creating intelligent systems that enhance productivity."
              link="/agents"
              linkTitle="Explore AI Agents"
            />
          </div>
        </div>

        {/* Right Half - Visual Background */}
        <div className="w-1/2">
          <VisBackgroundComponent className="h-full">
          </VisBackgroundComponent>
        </div>
      </div>
    </section>
  );
};

export default AgentsPreview;