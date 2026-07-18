import React from 'react';
import Hero from './Hero';
import ExperienceMarquee from './ExperienceMarquee';
import AgentsPreview from './AgentsPreview';
import MobilePreview from './MobilePreview';
import DesignPreview from './DesignPreview';

const Home = () => {
  return (
    <div className="home">
      <Hero />
      <ExperienceMarquee />
      <AgentsPreview />
      <MobilePreview />
      <DesignPreview />
    </div>
  );
};

export default Home;