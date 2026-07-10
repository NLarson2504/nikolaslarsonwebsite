import React from 'react';
import WebGallery from './WebGallery';
import useProjects from '../../hooks/useProjects';

const Web = () => {
  const { data: sitesData, loading, error } = useProjects('site');

  if (loading || error || sitesData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 text-dark-400 font-mono text-sm tracking-wide">
        {error
          ? 'Could not load web work.'
          : loading
          ? 'Loading…'
          : 'No web work yet.'}
      </div>
    );
  }

  return <WebGallery projects={sitesData} />;
};

export default Web;
