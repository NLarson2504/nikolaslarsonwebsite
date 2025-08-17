import React from 'react';
import './App.css';
import Home from './pages/home/Home';
import useLocomotiveScroll from './hooks/useLocomotiveScroll';

function App() {
  const { scrollRef } = useLocomotiveScroll();

  return (
    <div ref={scrollRef} className="App bg-dark-950" data-scroll-container>
      <Home />
    </div>
  );
}

export default App;
