const DEFAULT_INTERVAL = 6000;

export function createAutoplay({
  root,
  advance,
  toggle,
  live,
  intervalMs = DEFAULT_INTERVAL,
  documentRef = document,
  windowRef = window,
  setTimeoutFn = windowRef.setTimeout.bind(windowRef),
  clearTimeoutFn = windowRef.clearTimeout.bind(windowRef),
  matchMediaFn = windowRef.matchMedia?.bind(windowRef),
  IntersectionObserverCtor = windowRef.IntersectionObserver,
  MutationObserverCtor = windowRef.MutationObserver,
} = {}) {
  let timer = null;
  let disposed = false;
  let manualPaused = false;
  let explicitPlay = false;
  let pointerBlocked = false;
  let focusBlocked = false;
  let hidden = documentRef.visibilityState === 'hidden';
  let visible = !IntersectionObserverCtor;
  let dialogBlocked = false;
  let reduced = Boolean(matchMediaFn?.('(prefers-reduced-motion: reduce)')?.matches);
  let focusOverride = false;
  const mediaQuery = matchMediaFn?.('(prefers-reduced-motion: reduce)');

  const setLiveMode = (running) => live?.setAttribute('aria-live', running ? 'off' : 'polite');
  const controlPaused = () => manualPaused || (reduced && !explicitPlay);
  const updateToggle = () => {
    if (!toggle) return;
    const paused = controlPaused();
    toggle.textContent = paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    toggle.setAttribute('aria-pressed', String(paused));
  };
  const dialogIsOpen = () => Boolean(documentRef.querySelector?.('dialog[open]'));
  const canRun = () => !disposed && !manualPaused && !hidden && visible && !pointerBlocked && !dialogBlocked
    && (!focusBlocked || focusOverride) && (explicitPlay || !reduced) && root?.isConnected !== false;
  const clearTimer = () => {
    if (timer != null) clearTimeoutFn(timer);
    timer = null;
  };
  const schedule = () => {
    clearTimer();
    if (!canRun()) { setLiveMode(false); return; }
    setLiveMode(true);
    timer = setTimeoutFn(() => {
      timer = null;
      if (!canRun()) { setLiveMode(false); return; }
      setLiveMode(true);
      advance();
      schedule();
    }, intervalMs);
  };
  const refresh = () => {
    dialogBlocked = dialogIsOpen();
    if (!canRun()) { clearTimer(); setLiveMode(false); }
    else if (timer == null) schedule();
    updateToggle();
  };
  const manualInteraction = () => {
    clearTimer();
    setLiveMode(false);
    if (manualPaused || !canRun()) { updateToggle(); return; }
    setLiveMode(false);
    timer = setTimeoutFn(() => {
      timer = null;
      if (!canRun()) { setLiveMode(false); return; }
      setLiveMode(true);
      advance();
      schedule();
    }, intervalMs);
    updateToggle();
  };
  const pauseManually = () => { manualPaused = true; explicitPlay = false; focusOverride = false; clearTimer(); setLiveMode(false); updateToggle(); };
  const play = () => { manualPaused = false; explicitPlay = true; focusOverride = true; refresh(); };
  const onToggle = () => (manualPaused || (reduced && !explicitPlay) ? play() : pauseManually());
  const onPointerOver = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    if (event.relatedTarget && root.contains(event.relatedTarget)) return;
    pointerBlocked = true; refresh();
  };
  const onPointerOut = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    if (event.relatedTarget && root.contains(event.relatedTarget)) return;
    pointerBlocked = false; refresh();
  };
  const onFocusIn = (event) => {
    if (event.target === toggle && focusOverride) return;
    focusOverride = false;
    focusBlocked = true;
    refresh();
  };
  const onFocusOut = (event) => {
    if (event.relatedTarget && root.contains(event.relatedTarget)) return;
    focusBlocked = false;
    focusOverride = false;
    refresh();
  };
  const onVisibility = () => { hidden = documentRef.visibilityState === 'hidden'; refresh(); };
  const onReducedMotion = (event) => { reduced = event.matches; if (reduced) { explicitPlay = false; clearTimer(); } refresh(); };
  const onPageHide = (event) => { clearTimer(); if (!event.persisted) dispose(); };
  const onPageShow = () => { if (!disposed) refresh(); };

  root.addEventListener('pointerover', onPointerOver);
  root.addEventListener('pointerout', onPointerOut);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  toggle?.addEventListener('click', onToggle);
  documentRef.addEventListener('visibilitychange', onVisibility);
  windowRef.addEventListener('pagehide', onPageHide);
  windowRef.addEventListener('pageshow', onPageShow);
  mediaQuery?.addEventListener?.('change', onReducedMotion);

  const intersection = IntersectionObserverCtor ? new IntersectionObserverCtor((entries) => {
    visible = Boolean(entries[0]?.isIntersecting && entries[0].intersectionRatio > 0);
    refresh();
  }, { threshold: 0.01 }) : null;
  intersection?.observe(root);
  const mutations = MutationObserverCtor ? new MutationObserverCtor(refresh) : null;
  mutations?.observe(documentRef.body, { subtree: true, attributes: true, attributeFilter: ['open'] });

  function dispose() {
    if (disposed) return;
    disposed = true;
    clearTimer();
    intersection?.disconnect();
    mutations?.disconnect();
    root.removeEventListener('pointerover', onPointerOver);
    root.removeEventListener('pointerout', onPointerOut);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    toggle?.removeEventListener('click', onToggle);
    documentRef.removeEventListener('visibilitychange', onVisibility);
    windowRef.removeEventListener('pagehide', onPageHide);
    windowRef.removeEventListener('pageshow', onPageShow);
    mediaQuery?.removeEventListener?.('change', onReducedMotion);
  }

  updateToggle();
  refresh();
  return {
    manualInteraction,
    pause: pauseManually,
    play,
    dispose,
    get manualPaused() { return manualPaused; },
    get running() { return timer != null; },
  };
}
