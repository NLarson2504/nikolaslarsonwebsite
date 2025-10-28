import React from 'react';
import PageTemplate from '../../components/PageTemplate';
import AgentDetail from '../../components/AgentDetail';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';
import { agentsData } from '../../data/projectsData';
import { ReactComponent as AgentsIllustration } from '../../assets/images/Agents.svg';

const Agents = () => {

  return (
    <PageTemplate className="agents-page">
      {/* Full Page Landing Section */}
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Left Half - Title and Description */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-4 md:px-16 pt-24 pb-12 md:py-12">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 md:mb-8 text-dark-50">AI Agents</h1>
          <p className="text-lg md:text-2xl text-dark-300 font-sans leading-relaxed">
            Leveraging artificial intelligence to create intelligent automation solutions
            that enhance productivity and drive innovation.
          </p>
        </div>

        {/* Right Half - Visualization with Striped Background */}
        <div className="w-full md:w-1/2 min-h-[300px] md:min-h-0">
          <VisBackgroundComponent className="h-full bg-gradient-to-br from-dark-900/80 to-dark-800/80">
            <AgentsIllustration className="w-full h-full" style={{ maxWidth: 'none', width: '80%', height: '80%' }} />
          </VisBackgroundComponent>
        </div>
      </div>

      {/* Projects Section */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-20 -mt-80 md:mt-0 md:py-20">
        <div className="grid gap-8 md:gap-12">
          {agentsData.map((agent, index) => (
            <AgentDetail
              key={index}
              title={agent.title}
              description={agent.description}
              features={agent.features}
              technologies={agent.technologies}
              status={agent.status}
              icon={agent.icon}
              className="max-w-4xl mx-auto"
            />
          ))}
        </div>
      </div>
    </PageTemplate>
  );
};

export default Agents;