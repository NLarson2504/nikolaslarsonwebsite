import React from 'react';
import AppsWheel from './AppsWheel';
import LoadingCurtain from '../../components/LoadingCurtain';
import useProjects from '../../hooks/useProjects';

const Apps = () => {
  const { data: mobileAppsData, loading, error } = useProjects('app');

  const failed = !loading && (error || mobileAppsData.length === 0);

  return (
    <LoadingCurtain loading={loading} label="APPS">
      {(revealed) => (
        <div className={`lc-content${revealed ? ' is-in' : ''}`}>
          {failed ? (
            <div className="min-h-screen flex items-center justify-center bg-dark-950 text-dark-400 font-mono text-sm tracking-wide">
              {error ? 'Could not load apps.' : 'No apps yet.'}
            </div>
          ) : mobileAppsData.length > 0 ? (
            <AppsWheel projects={mobileAppsData} />
          ) : null}
        </div>
      )}
    </LoadingCurtain>
  );
};

export default Apps;
