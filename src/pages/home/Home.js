import React from 'react';
import Hero from './Hero';
import AgentsPreview from './AgentsPreview';
import MobilePreview from './MobilePreview';
import DesignPreview from './DesignPreview';

const Home = () => {
  return (
    <div className="home">
      <Hero />
      <AgentsPreview />
      <MobilePreview />
      <DesignPreview />
    </div>
  );
};

export default Home;