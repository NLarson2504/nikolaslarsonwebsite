import React from 'react';

/**
 * Renders a shared loading / error / empty state for a Firestore-backed
 * section. Returns null when there is data to show so the page can render its
 * own content instead.
 */
const CollectionState = ({ loading, error, isEmpty, label = 'projects' }) => {
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-dark-300">
        <div className="inline-block w-8 h-8 border-2 border-dark-600 border-t-dark-50 rounded-full animate-spin mb-4" />
        <p className="font-sans">Loading {label}…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <p className="text-dark-300 font-sans">
          Couldn’t load {label} right now. Please try again later.
        </p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <p className="text-dark-300 font-sans">No {label} to show yet.</p>
      </div>
    );
  }

  return null;
};

export default CollectionState;
