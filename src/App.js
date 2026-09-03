import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

import Home from './pages/home/Home';
import Agents from './pages/agents/Agents';
import Apps from './pages/apps/Apps';
import Web from './pages/web/Web';
import Contact from './pages/contact/Contact';
import CaseStudyPage from './components/caseStudy/CaseStudyPage';
import Admin from './pages/admin/Admin';
import TopNav from './components/TopNav';
import { DetailTransitionProvider } from './components/DetailTransition';
import { DetailBrandProvider } from './components/DetailBrand';
import Footer from './components/Footer';
import CursorDot from './components/CursorDot';
import LogoIntro from './components/LogoIntro';
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

  /*
   * Detail routes are `/<section>/<slug>` — one segment deeper than a section
   * page. On those the nav shows a back orb, derived from the path here rather
   * than threaded up from the route element.
   */
  const segments = location.pathname.split('/').filter(Boolean);
  const isDetail =
    segments.length === 2 && ['web', 'apps', 'agents'].includes(segments[0]);

  /*
   * Back goes to the previous entry in history, not to a fixed section page —
   * so arriving from the home wall returns to the wall (in whichever view you
   * left it), and arriving from a section page returns there.
   *
   * The fallback matters: a detail page opened directly, or shared as a link,
   * has nothing to go back TO, and navigate(-1) would leave the site entirely.
   * `key === 'default'` is React Router's signal that this is the first entry
   * in the session, so that case falls back to the section page instead.
   */
  const goBack = () => {
    if (location.key === 'default') {
      navigate(`/${segments[0] || ''}`);
    } else {
      navigate(-1);
    }
  };

  const isAdmin = location.pathname.startsWith('/admin');

  // pass null on admin so the hook stays mounted (hooks must run every render)
  // but doesn't take over the document's scrolling
  const { scrollContainerRef, scrollContentRef } = useGSAPScrollSmooth(
    isAdmin ? null : getCurrentPage(),
    isAdmin ? null : location.pathname
  );

  // The admin app is a separate surface: its own left-nav shell, no marketing
  // chrome (top nav, footer, cursor dot) and no smooth-scroll container, which
  // would otherwise fight its fixed sidebar.
  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    );
  }

  return (
    /*
     * The first-load intro wraps everything, nav included: it flies its NL to
     * the nav's own logo, so it has to sit above it, and it covers the page
     * while the home wall is still fetching. It plays once per session and
     * lets pages hold it open — see components/LogoIntro.
     */
    <LogoIntro>
    <DetailTransitionProvider>
    <DetailBrandProvider>
    <div className="App bg-dark-950">
      <CursorDot />
      <TopNav
        currentPage={getCurrentPage()}
        navigateToPage={navigateToPage}
        showBack={isDetail}
        onBack={goBack}
      />
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
    </DetailBrandProvider>
    </DetailTransitionProvider>
    </LogoIntro>
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
