import React from 'react';
import AppsWheel from './AppsWheel';
import useProjects from '../../hooks/useProjects';

const Apps = () => {
  const { data: mobileAppsData, loading, error } = useProjects('app');

  if (loading || error || mobileAppsData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 text-dark-400 font-mono text-sm tracking-wide">
        {error
          ? 'Could not load apps.'
          : loading
          ? 'Loading…'
          : 'No apps yet.'}
      </div>
    );
  }

  return <AppsWheel projects={mobileAppsData} />;
};

export default Apps;
