import React, { useState, useEffect } from 'react';
import './App.css';
import Home from './pages/home/Home';
import Agents from './pages/agents/Agents';
import Mobile from './pages/mobile/Mobile';
import Design from './pages/design/Design';
import Contact from './pages/contact/Contact';
import TopNav from './components/TopNav';
import Footer from './components/Footer';

function App() {
  // Initialize from URL path
  const getInitialPage = () => {
    const path = window.location.pathname.replace('/', '') || 'home';
    return ['home', 'agents', 'mobile', 'design', 'contact'].includes(path) ? path : 'home';
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage());

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '') || 'home';
      if (['home', 'agents', 'mobile', 'design', 'contact'].includes(path)) {
        setCurrentPage(path);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL when page changes
  const navigateToPage = (page) => {
    setCurrentPage(page);
    const url = page === 'home' ? '/' : `/${page}`;
    window.history.pushState({}, '', url);
    
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'agents':
        return <Agents />;
      case 'mobile':
        return <Mobile />;
      case 'design':
        return <Design />;
      case 'contact':
        return <Contact />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="App bg-dark-950">
      <TopNav currentPage={currentPage} navigateToPage={navigateToPage} />
      {renderPage()}
      <Footer />
    </div>
  );
}

export default App;
