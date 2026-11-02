import Lenis from 'lenis';

let lenis: Lenis | null = null;

// Initialise buttery inertia scrolling once, and keep the rAF loop running.
export function initLenis(): Lenis {
    if (lenis) return lenis;
    // Always start a fresh load at the top (don't let the browser restore the
    // previous scroll position on refresh).
    if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    lenis = new Lenis({
        lerp: 0.09,
        wheelMultiplier: 1,
        smoothWheel: true,
        touchMultiplier: 1.6,
    });
    lenis.scrollTo(0, { immediate: true });
    const raf = (time: number) => {
        lenis?.raf(time);
        requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    return lenis;
}

export function destroyLenis() {
    lenis?.destroy();
    lenis = null;
}

// On a phone the page scrolls on its own thread, ahead of any script: motion tied to
// the scroll from a scroll listener lags a frame or more behind and judders. There,
// scroll-linked motion is handed to the browser (CSS scroll-driven animations, which
// run with the scroll), or left out where the browser can't.
export const touchScreen = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
export const cssScrollTimeline = () => typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()');

// Pause / resume inertia scrolling — used to fully lock the page behind a modal.
export function stopLenis() { lenis?.stop(); }
export function startLenis() { lenis?.start(); }

// Page lock for overlays, counted so two overlays that overlap during a hand-off
// (the pricelist card reveal and the booking form) don't unlock each other.
let pageLocks = 0;
export function lockPage() {
    if (pageLocks++ > 0) return;
    stopLenis();
    document.body.style.overflow = 'hidden';
}
export function unlockPage() {
    if (pageLocks === 0 || --pageLocks > 0) return;
    startLenis();
    document.body.style.overflow = '';
}

// Smoothly scroll to an absolute Y (falls back to native if Lenis is absent).
export function smoothScrollTo(top: number) {
    if (lenis) lenis.scrollTo(top, { duration: 1.1, force: true }); // force: also while an overlay has Lenis stopped
    else window.scrollTo({ top, behavior: 'smooth' });
}

// Global parallax: every element with [data-parallax] drifts vertically by its
// distance from the viewport centre × the speed in that attribute, so backgrounds
// move at a different pace than the content. Add data-parallax-scale to keep a zoom
// (needed so an oversized layer never reveals its edges while drifting). One shared
// rAF loop scans the live DOM each frame, so lazy-mounted sections are picked up.
let parallaxCleanup: (() => void) | null = null;

export function initParallax() {
    if (parallaxCleanup) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
        raf = 0;
        const vh = window.innerHeight;
        // Two passes: read every rect first, THEN write every transform. Interleaving
        // getBoundingClientRect() with style writes forces a layout recalc on each
        // element — a thrash that stutters scrolling. Batching keeps it to one layout.
        const els = document.querySelectorAll<HTMLElement>('[data-parallax]');
        const writes: Array<[HTMLElement, string]> = [];
        els.forEach((el) => {
            const speed = parseFloat(el.dataset.parallax || '0');
            if (!speed) return;
            const r = el.getBoundingClientRect();
            const offset = (vh / 2 - (r.top + r.height / 2)) * speed;
            const scale = el.dataset.parallaxScale;
            writes.push([el, `translate3d(0, ${offset.toFixed(1)}px, 0)` + (scale ? ` scale(${scale})` : '')]);
        });
        for (const [el, t] of writes) el.style.transform = t;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    parallaxCleanup = () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        if (raf) cancelAnimationFrame(raf);
    };
}

export function destroyParallax() {
    parallaxCleanup?.();
    parallaxCleanup = null;
}

// Smoothly scroll to an element id, leaving room for the fixed header.
export function smoothScrollToId(id: string, offset = 80) {
    const el = document.getElementById(id);
    if (!el) return false;
    if (lenis) {
        lenis.scrollTo(el, { offset: -offset, duration: 1.2, force: true });
    } else {
        const y = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
    return true;
}
