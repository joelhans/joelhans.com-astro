import type {
  TransitionBeforePreparationEvent,
  TransitionBeforeSwapEvent,
} from 'astro:transitions/client';

type Mode = 'both' | 'fiction' | 'tech';
const isPath = (value: unknown): value is 'fiction' | 'tech' =>
  value === 'fiction' || value === 'tech';

function syncMode(mode: Mode) {
  document.documentElement.dataset.mode = mode;
  if (mode !== 'both') {
    try { localStorage.setItem('mode', mode); } catch {}
  }
  document.querySelectorAll<HTMLAnchorElement>('[data-follow-mode]').forEach(link => {
    const url = new URL(link.href);
    if (mode === 'both') url.searchParams.delete('mode');
    else url.searchParams.set('mode', mode);
    link.href = url.href;
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-set-mode]').forEach(link => {
    const selected = link.dataset.setMode === mode;
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  // Preserve Astro's scroll/index state and the filter for URLs without a query.
  if (typeof history.state?.index === 'number') {
    history.replaceState({ ...history.state, siteMode: mode }, '');
  }
}

function destinationMode(event: TransitionBeforeSwapEvent): Mode {
  const fixed = event.newDocument.querySelector('meta[name="site-page-mode"]')?.getAttribute('content');
  if (fixed === 'both' || isPath(fixed)) return fixed;
  const requested = event.to.searchParams.get('mode');
  if (isPath(requested)) return requested;
  if (event.navigationType === 'traverse' && isPath(history.state?.siteMode)) return history.state.siteMode;
  try {
    const saved = localStorage.getItem('mode');
    if (isPath(saved)) return saved;
  } catch {}
  return 'fiction';
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const animations = new Set<Animation>();
let navigationId = 0;
let navigationPending = false;

function animate(element: Element, frames: Keyframe[], duration: number, hold = false) {
  const animation = element.animate(frames, {
    duration,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    fill: 'both',
  });
  animations.add(animation);
  return animation.finished.catch(() => {}).finally(() => {
    if (!hold) {
      animation.cancel();
      animations.delete(animation);
    }
  });
}

function cancelMotion() {
  animations.forEach(animation => animation.cancel());
  animations.clear();
}

function revealContent(mode: Mode, drawMark: boolean) {
  if (reducedMotion.matches) return;
  const main = document.querySelector('main');
  if (main) void animate(main, [
    { opacity: 0, filter: 'blur(0.8px)' },
    { opacity: 1, filter: 'blur(0px)' },
  ], 260);
  const path = document.querySelector<SVGPathElement>(`[data-nav-mark="${mode}"] path`);
  if (drawMark && path) {
    const length = path.getTotalLength();
    void animate(path, [
      { strokeDasharray: `${length}`, strokeDashoffset: length },
      { strokeDasharray: `${length}`, strokeDashoffset: 0 },
    ], 480);
  }
}

// Stop redundant link clicks before Astro's router handles them. Comparing the
// full URL keeps query-based mode switches and in-page anchors working normally.
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest<HTMLAnchorElement>('a[href]');
  if (!link || link.hasAttribute('download') || link.hasAttribute('data-astro-reload')) return;
  if (link.target && link.target !== '_self') return;
  // During navigation, the current link can cancel a pending switch away.
  if (link.href === location.href && !navigationPending) event.preventDefault();
}, { capture: true });

// Keep the current page readable while Astro fetches the next one. Fade only
// after it is ready, and let the router cancel superseded clicks and history moves.
document.addEventListener('astro:before-preparation', event => {
  const navigation = event as TransitionBeforePreparationEvent;
  const id = ++navigationId;
  navigationPending = true;
  cancelMotion();
  navigation.signal.addEventListener('abort', () => {
    if (id === navigationId) {
      navigationPending = false;
      cancelMotion();
    }
  }, { once: true });
  const load = navigation.loader;
  navigation.loader = async () => {
    await load();
    if (navigation.signal.aborted || navigation.defaultPrevented || reducedMotion.matches) return;
    const main = document.querySelector('main');
    if (main) await animate(main, [
      { opacity: 1, filter: 'blur(0px)' },
      { opacity: 0, filter: 'blur(0.8px)' },
    ], 120, true);
  };
});

document.addEventListener('astro:before-swap', event => {
  const navigation = event as TransitionBeforeSwapEvent;
  const previousMode = document.documentElement.dataset.mode;
  const background = getComputedStyle(document.body).backgroundColor;
  const mode = destinationMode(navigation);
  // Resolve the destination before it can paint, including neutral home/contact.
  navigation.newDocument.documentElement.dataset.mode = mode;
  // Our live fades replace the browser's default full-screen snapshot animation.
  void navigation.viewTransition.ready.catch(() => {});
  navigation.viewTransition.skipTransition();
  const swap = navigation.swap;
  navigation.swap = () => {
    cancelMotion();
    swap();
    document.documentElement.dataset.mode = mode;
    if (!reducedMotion.matches && previousMode !== mode) {
      void animate(document.body, [
        { backgroundColor: background },
        { backgroundColor: getComputedStyle(document.body).backgroundColor },
      ], 420);
    }
    revealContent(mode, previousMode !== mode);
    // Keep keyboard focus on the switch when the header is replaced.
    if (navigation.sourceElement?.hasAttribute('data-set-mode')) {
      document.querySelector<HTMLAnchorElement>(`[data-set-mode="${mode}"]`)?.focus({ preventScroll: true });
    }
  };
});

document.addEventListener('astro:after-swap', () => {
  navigationPending = false;
  syncMode(document.documentElement.dataset.mode as Mode);
});
document.addEventListener('astro:page-load', () => {
  syncMode(document.documentElement.dataset.mode as Mode);
});

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) cancelMotion();
});

syncMode(document.documentElement.dataset.mode as Mode);
