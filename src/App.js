import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

import Home from './pages/home/Home';
import Agents from './pages/agents/Agents';
import Apps from './pages/apps/Apps';
import Web from './pages/web/Web';
import Contact from './pages/contact/Contact';
import CaseStudyPage from './components/caseStudy/CaseStudyPage';
import TopNav from './components/TopNav';
import Footer from './components/Footer';
import useGSAPScrollSmooth from './hooks/useGSAPScrollSmooth';
import imagePreloader from './utils/imagePreloader';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateToPage = (page) => {
    navigate(`/${page === 'home' ? '' : page}`);
  };

  const getCurrentPage = () => {
    const path = location.pathname.slice(1);
    return path === '' ? 'home' : path.split('/')[0];
  };

  const { scrollContainerRef, scrollContentRef } = useGSAPScrollSmooth(getCurrentPage());

  return (
    <div className="App bg-dark-950">
      <TopNav currentPage={getCurrentPage()} navigateToPage={navigateToPage} />
      <div ref={scrollContainerRef} className="scroll-container">
        <div ref={scrollContentRef} className="scroll-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/:slug" element={<CaseStudyPage type="agent" backTo="/agents" backLabel="All agents" />} />
            <Route path="/apps" element={<Apps />} />
            <Route path="/apps/:slug" element={<CaseStudyPage type="app" backTo="/apps" backLabel="All apps" />} />
            <Route path="/web" element={<Web />} />
            <Route path="/web/:slug" element={<CaseStudyPage type="site" backTo="/web" backLabel="All web work" />} />
            <Route path="/contact" element={<Contact />} />
            {/* Redirects from the old section names */}
            <Route path="/mobile" element={<Navigate to="/apps" replace />} />
            <Route path="/design" element={<Navigate to="/web" replace />} />
            <Route path="*" element={<Home />} /> {/* fallback */}
          </Routes>
          <Footer />
        </div>
      </div>
    </div>
  );
}

function App() {
  // Preload images once
  useEffect(() => {
    imagePreloader.preloadAllImages().catch(error => {
      console.warn('Failed to preload some images:', error);
    });
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
