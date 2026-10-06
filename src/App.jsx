import { useEffect, useRef, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import Preloader from './components/Preloader'
import { Toaster } from 'sileo'
import useUiSounds from './audio/useUiSounds'

// Secondary routes are code-split so the home page only ships what it needs
const About = lazy(() => import('./pages/About'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const LensExperiment = lazy(() => import('./pages/LensExperiment'))
const PortfolioCategory = lazy(() => import('./pages/PortfolioCategory'))
const Contact = lazy(() => import('./pages/Contact'))
const Works = lazy(() => import('./pages/Works'))
const FolderShowcase = lazy(() => import('./pages/FolderShowcase'))
const AppleSwitchShowcase = lazy(() => import('./pages/AppleSwitchShowcase'))
const LabShowcase = lazy(() => import('./pages/LabShowcase'))
const AvatarPage = lazy(() => import('./pages/AvatarPage'))
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  const location = useLocation();
  const lenisRef = useRef(null);
  useUiSounds();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis
    // We reset scroll ourselves between routes; stop the browser restoring old offsets
    window.history.scrollRestoration = 'manual'

    let rafId
    function raf(time) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    const handleAnchorClick = (e) => {
      const target = e.target.closest('a');
      if (!target) return;
      
      const href = target.getAttribute('href');
      
      if (href === '/' && window.location.pathname === '/') {
        e.preventDefault();
        lenis.scrollTo(0, { duration: 1.2 });
        return;
      }

      if (href && href.startsWith('/#') && window.location.pathname === '/') {
        const id = href.substring(2);
        const element = document.getElementById(id);
        if (element) {
          e.preventDefault();
          lenis.scrollTo(element, { offset: -100 });
        }
      }
    };
    
    document.addEventListener('click', handleAnchorClick);

    // Menu / lightbox / Home lock the page: pause Lenis so the wheel can't scroll underneath
    const onScrollLock = (e) => (e.detail.locked ? lenis.stop() : lenis.start());
    window.addEventListener('scrolllockchange', onScrollLock);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('scrolllockchange', onScrollLock);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    }
  }, []);

  // Runs between the old page's exit and the new page's enter, so the jump is invisible
  const resetScroll = () => {
    lenisRef.current?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
  }

  return (
    <MotionConfig reducedMotion="user">
      <Toaster
        position="bottom-center"
        styles={{
          toast: {
            fontFamily: 'var(--font-body, Inter, sans-serif)',
          },
        }}
      />
      <Preloader />
      <Navbar />
      <Suspense fallback={null}>
      <AnimatePresence mode="wait" onExitComplete={resetScroll}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/works" element={<Works />} />
          <Route path="/about" element={<About />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/lens" element={<LensExperiment />} />
          <Route path="/portfolio/:type" element={<PortfolioCategory />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/folder" element={<FolderShowcase />} />
          <Route path="/switch" element={<AppleSwitchShowcase />} />
          <Route path="/lab" element={<LabShowcase />} />
          <Route path="/demo" element={<LabShowcase />} />
          <Route path="/avatar" element={<AvatarPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      </Suspense>
    </MotionConfig>
  )
}

export default App
