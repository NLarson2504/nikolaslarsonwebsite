import React from 'react';
import WebGallery from './WebGallery';
import LoadingCurtain from '../../components/LoadingCurtain';
import useProjects from '../../hooks/useProjects';


const Web = () => {
  const { data: sitesData, loading, error } = useProjects('site');

  // The curtain only truly "loads" while fetching. On error / empty, let it
  // sweep away and show the fallback message instead of hanging forever.
  const failed = !loading && (error || sitesData.length === 0);

  return (
    <LoadingCurtain loading={loading} label="WEB">
      {(revealed) => (
        <div className={`lc-content${revealed ? ' is-in' : ''}`}>
          {failed ? (
            <div className="min-h-screen flex items-center justify-center bg-dark-950 text-dark-400 font-mono text-sm tracking-wide">
              {error ? 'Could not load web work.' : 'No web work yet.'}
            </div>
          ) : sitesData.length > 0 ? (
            <WebGallery projects={sitesData} />
          ) : null}
        </div>
      )}
    </LoadingCurtain>
  );
};

export default Web;
