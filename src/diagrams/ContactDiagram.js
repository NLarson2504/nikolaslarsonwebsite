import React from 'react';

const ContactDiagram = ({ className = "" }) => {
  const squares = [
    {
      id: 1,
      icon: (
        <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 2,
      icon: (
        <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 3,
      icon: (
        <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 002 2h2a2 2 0 002-2V4h-2a2 2 0 00-2-2z" />
        </svg>
      )
    },
    {
      id: 4,
      icon: (
        <svg className="w-12 h-12 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className={`contact-diagram ${className}`}>
      <div className="grid grid-cols-2 gap-8 w-full max-w-2xl mx-auto px-8">
        {squares.map((square) => (
          <div
            key={square.id}
            className={`
              aspect-square
              bg-gray-500/10
              border border-white/20
              rounded-xl
              flex items-center justify-center
              hover:border-white/30
              hover:bg-gray-500/15
              hover:scale-105
              transition-all duration-300
              backdrop-blur-md
              shadow-lg
              shadow-black/20
            `}
          >
            {square.icon}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactDiagram;