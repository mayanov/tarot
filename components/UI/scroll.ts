import Lenis from 'lenis';
import { useEffect, RefObject } from 'react';

let lenis: Lenis | null = null;

// Initialise buttery inertia scrolling once, and keep the rAF loop running.
export function initLenis(): Lenis {
    if (lenis) return lenis;
    lenis = new Lenis({
        lerp: 0.09,
        wheelMultiplier: 1,
        smoothWheel: true,
        touchMultiplier: 1.6,
    });
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

export function getLenis(): Lenis | null {
    return lenis;
}

// Smoothly scroll to an absolute Y (falls back to native if Lenis is absent).
export function smoothScrollTo(top: number) {
    if (lenis) lenis.scrollTo(top, { duration: 1.1 });
    else window.scrollTo({ top, behavior: 'smooth' });
}

// Scroll-linked parallax: translate an element by its distance from the viewport
// centre × speed. Negative speed = moves against scroll (feels deeper). Runs off the
// (Lenis-driven) scroll event via rAF, and respects reduced-motion.
export function useParallax(ref: RefObject<HTMLElement>, speed = 0.15) {
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        let raf = 0;
        const update = () => {
            const el = ref.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const dist = (rect.top + rect.height / 2) - window.innerHeight / 2;
            el.style.transform = `translate3d(0, ${(dist * speed).toFixed(1)}px, 0)`;
        };
        const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            cancelAnimationFrame(raf);
        };
    }, [ref, speed]);
}

// Smoothly scroll to an element id, leaving room for the fixed header.
export function smoothScrollToId(id: string, offset = 80) {
    const el = document.getElementById(id);
    if (!el) return false;
    if (lenis) {
        lenis.scrollTo(el, { offset: -offset, duration: 1.2 });
    } else {
        const y = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
    return true;
}
