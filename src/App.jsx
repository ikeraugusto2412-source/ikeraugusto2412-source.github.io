import { useEffect, useRef, lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import Preloader from './components/Preloader'
import { Toaster } from 'sileo'
import useUiSounds from './audio/useUiSounds'
import ErrorBoundary from './components/ErrorBoundary'
import Seo from './components/Seo'
import { splitLang } from './lib/i18nPath'
import './lib/analytics'

// Secondary routes are code-split so the home page only ships what it needs
const About = lazy(() => import('./pages/About'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Contact = lazy(() => import('./pages/Contact'))
const Works = lazy(() => import('./pages/Works'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Experiments and component showcases: only in `npm run dev`, never shipped in the build
const DEV = import.meta.env.DEV
const LensExperiment = DEV ? lazy(() => import('./pages/LensExperiment')) : null
const PortfolioCategory = DEV ? lazy(() => import('./pages/PortfolioCategory')) : null
const FolderShowcase = DEV ? lazy(() => import('./pages/FolderShowcase')) : null
const AppleSwitchShowcase = DEV ? lazy(() => import('./pages/AppleSwitchShowcase')) : null
const LabShowcase = DEV ? lazy(() => import('./pages/LabShowcase')) : null
const AvatarPage = DEV ? lazy(() => import('./pages/AvatarPage')) : null

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
      
      const isHome = (p) => p != null && splitLang(p).path === '/';
      if (href && !href.startsWith('/#') && isHome(href) && isHome(window.location.pathname)) {
        e.preventDefault();
        lenis.scrollTo(0, { duration: 1.2 });
        return;
      }

      if (href && href.startsWith('/#') && isHome(window.location.pathname)) {
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

    // Components ask for a scroll (e.g. the gallery ruler jumping to a photo) through an event,
    // so it goes through Lenis instead of fighting it. detail: { target, offset, immediate }
    const onScrollRequest = (e) => {
      const { target, offset = 0, immediate = false } = e.detail ?? {};
      if (target != null) lenis.scrollTo(target, { offset, immediate, duration: 0.9 });
    };
    window.addEventListener('scrollrequest', onScrollRequest);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('scrolllockchange', onScrollLock);
      window.removeEventListener('scrollrequest', onScrollRequest);
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
      <Seo />
      <Preloader />
      <Navbar />
      <ErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={null}>
      <AnimatePresence mode="wait" onExitComplete={resetScroll}>
        {/* Keyed without the language prefix: switching EN/ES swaps the texts in place
            instead of replaying the page transition */}
        <Routes location={location} key={splitLang(location.pathname).path}>
          {['', '/es'].flatMap((prefix) => [
            <Route key={`${prefix}home`} path={prefix || '/'} element={<Home />} />,
            <Route key={`${prefix}works`} path={`${prefix}/works`} element={<Works />} />,
            <Route key={`${prefix}about`} path={`${prefix}/about`} element={<About />} />,
            <Route key={`${prefix}project`} path={`${prefix}/project/:id`} element={<ProjectDetail />} />,
            <Route key={`${prefix}contact`} path={`${prefix}/contact`} element={<Contact />} />,
          ])}
          {DEV && <Route path="/lens" element={<LensExperiment />} />}
          {DEV && <Route path="/portfolio/:type" element={<PortfolioCategory />} />}
          {DEV && <Route path="/folder" element={<FolderShowcase />} />}
          {DEV && <Route path="/switch" element={<AppleSwitchShowcase />} />}
          {DEV && <Route path="/lab" element={<LabShowcase />} />}
          {DEV && <Route path="/demo" element={<LabShowcase />} />}
          {DEV && <Route path="/avatar" element={<AvatarPage />} />}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      </Suspense>
      </ErrorBoundary>
    </MotionConfig>
  )
}

export default App
