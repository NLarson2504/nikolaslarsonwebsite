import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './pages/home/Home';
import Agents from './pages/agents/Agents';
import Mobile from './pages/mobile/Mobile';
import Design from './pages/design/Design';
import Contact from './pages/contact/Contact';
import TopNav from './components/TopNav';
import Footer from './components/Footer';
import useGSAPScrollSmooth from './hooks/useGSAPScrollSmooth';
import imagePreloader from './utils/imagePreloader';
import AgentDetail from "./components/AgentDetail";

function App() {
  const { scrollContainerRef, scrollContentRef } = useGSAPScrollSmooth();

  // Preload images once
  useEffect(() => {
    imagePreloader.preloadAllImages().catch(error => {
      console.warn('Failed to preload some images:', error);
    });
  }, []);

  return (
    <Router>
      <div className="App bg-dark-950">
        <TopNav />
        <div ref={scrollContainerRef} className="scroll-container">
          <div ref={scrollContentRef} className="scroll-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/agents/:id" element={<AgentDetail />} />
              <Route path="/mobile" element={<Mobile />} />
              <Route path="/design" element={<Design />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<Home />} /> {/* fallback */}
            </Routes>
            <Footer />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
