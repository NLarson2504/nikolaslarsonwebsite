import React from 'react';
import Wall from './Wall';

/*
 * The home page is the wall — one screen showing every project at once, with
 * shape carrying the taxonomy. It replaces the old stacked hero + per-section
 * preview scroll (Hero / ExperienceMarquee / AgentsPreview / MobilePreview /
 * DesignPreview), which are still used nowhere else and kept in the tree for
 * reference.
 */

const Home = () => (
  <div className="home">
    <Wall />
  </div>
);

export default Home;
