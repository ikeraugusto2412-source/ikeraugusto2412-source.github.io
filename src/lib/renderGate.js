/**
 * Render gate for canvas / WebGL loops: reports whether the element is on screen AND the tab
 * is visible, so rAF loops can stop instead of burning battery on phones.
 *
 *   const gate = createRenderGate(container, (active) => { if (active) restartLoop(); });
 *   // in the loop: if (!gate.active) { stop; return; }
 *   gate.dispose();
 */
export function createRenderGate(element, onChange) {
  const state = { inView: true, pageVisible: document.visibilityState !== 'hidden' };
  const gate = {
    get active() {
      return state.inView && state.pageVisible;
    },
    dispose,
  };

  let last = gate.active;
  const emit = () => {
    const now = gate.active;
    if (now !== last) {
      last = now;
      onChange?.(now);
    }
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      state.inView = entry.isIntersecting;
      emit();
    },
    { rootMargin: '100px 0px' },
  );
  io.observe(element);

  const onVisibility = () => {
    state.pageVisible = document.visibilityState !== 'hidden';
    emit();
  };
  document.addEventListener('visibilitychange', onVisibility);

  function dispose() {
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
  }

  return gate;
}

/** Phones and small tablets get a lighter WebGL setup. */
export function isLowPowerViewport() {
  return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
}
