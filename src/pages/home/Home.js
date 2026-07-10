import React from 'react';
import Hero from './Hero';
import ExperienceMarquee from './ExperienceMarquee';
import AgentsPreview from './AgentsPreview';
import MobilePreview from './MobilePreview';
import DesignPreview from './DesignPreview';
import AcademicsPreview from './AcademicsPreview';

const Home = () => {
  return (
    <div className="home">
      <Hero />
      <ExperienceMarquee />
      <AgentsPreview />
      <MobilePreview />
      <DesignPreview />
      <AcademicsPreview />
    </div>
  );
};

export default Home;