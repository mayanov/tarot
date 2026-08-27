import React from 'react';

// Dense film grain used across the mesh-gradient backgrounds.
const GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='1.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.95'/%3E%3C/svg%3E\")";

// Each variant is a distinct aura / mesh gradient. LIGHT variants keep a warm
// light base (low-opacity colour blobs) so dark ink text stays readable; DARK
// variants are saturated for light text.
const MESHES: Record<string, string> = {
    // ---- Dark glass cards — hazy tinted panels for the sunset theme (light text) ----
    warm: `
        radial-gradient(95% 100% at 12% 6%, rgba(228,116,35,0.28) 0%, rgba(228,116,35,0) 66%),
        linear-gradient(155deg, rgba(32,19,26,0.58) 0%, rgba(23,15,22,0.64) 100%)`,
    plum: `
        radial-gradient(95% 100% at 12% 6%, rgba(142,92,134,0.30) 0%, rgba(142,92,134,0) 66%),
        linear-gradient(160deg, rgba(26,16,30,0.60) 0%, rgba(20,13,24,0.64) 100%)`,
    blue: `
        radial-gradient(95% 100% at 12% 6%, rgba(41,82,123,0.36) 0%, rgba(41,82,123,0) 66%),
        linear-gradient(160deg, rgba(18,20,34,0.60) 0%, rgba(16,15,26,0.64) 100%)`,
    sage: `
        radial-gradient(95% 100% at 12% 6%, rgba(79,142,98,0.30) 0%, rgba(79,142,98,0) 66%),
        linear-gradient(160deg, rgba(18,26,22,0.58) 0%, rgba(15,20,18,0.64) 100%)`,
    mocha: `
        radial-gradient(95% 100% at 12% 6%, rgba(194,94,20,0.24) 0%, rgba(194,94,20,0) 66%),
        linear-gradient(160deg, rgba(30,20,24,0.58) 0%, rgba(22,15,20,0.64) 100%)`,

    // ---- Transparent — lets the fixed sunset field show through (site-wide continuity) ----
    neutral: 'transparent',

    // ---- Category panels — dark translucent glass, one hue each (glow reads over the sunset) ----
    catCoral: `
        radial-gradient(95% 100% at 12% 6%, rgba(228,116,35,0.30) 0%, rgba(228,116,35,0) 66%),
        radial-gradient(80% 82% at 92% 96%, rgba(240,161,92,0.14) 0%, rgba(240,161,92,0) 64%),
        linear-gradient(150deg, rgba(30,18,26,0.60) 0%, rgba(22,14,22,0.66) 100%)`,
    catPlum: `
        radial-gradient(95% 100% at 12% 6%, rgba(142,92,134,0.34) 0%, rgba(142,92,134,0) 66%),
        radial-gradient(80% 82% at 92% 96%, rgba(57,35,78,0.22) 0%, rgba(57,35,78,0) 64%),
        linear-gradient(150deg, rgba(26,16,30,0.62) 0%, rgba(20,13,24,0.66) 100%)`,
    catBlue: `
        radial-gradient(95% 100% at 12% 6%, rgba(41,82,123,0.40) 0%, rgba(41,82,123,0) 66%),
        radial-gradient(80% 82% at 92% 96%, rgba(79,142,98,0.14) 0%, rgba(79,142,98,0) 64%),
        linear-gradient(150deg, rgba(18,20,34,0.62) 0%, rgba(16,15,26,0.66) 100%)`,
    catSage: `
        radial-gradient(95% 100% at 12% 6%, rgba(79,142,98,0.34) 0%, rgba(79,142,98,0) 66%),
        radial-gradient(80% 82% at 92% 96%, rgba(208,128,60,0.14) 0%, rgba(208,128,60,0) 64%),
        linear-gradient(150deg, rgba(18,26,22,0.60) 0%, rgba(15,20,18,0.66) 100%)`,

    // ---- Dark bands — a soft translucent darkening over the fixed sunset (keeps depth, keeps continuity) ----
    plumDark: `
        radial-gradient(80% 90% at 20% 20%, rgba(20,14,34,0.55) 0%, rgba(20,14,34,0.30) 60%, rgba(20,14,34,0.42) 100%)`,
    ember: `
        radial-gradient(70% 80% at 16% 24%, rgba(228,116,35,0.14) 0%, rgba(228,116,35,0) 60%),
        linear-gradient(150deg, rgba(24,16,36,0.42) 0%, rgba(24,16,36,0.30) 100%)`,
    dusk: `
        linear-gradient(180deg, rgba(18,12,26,0.30) 0%, rgba(14,10,22,0.62) 100%)`,
};

interface GrainyMeshProps {
    variant: keyof typeof MESHES;
    grain?: number;   // grain overlay opacity
    grainScale?: number;
}

// Full-bleed grainy mesh gradient for a `relative overflow-hidden isolate`
// container. Renders two -z-10 layers, so section content stays on top.
const GrainyMesh: React.FC<GrainyMeshProps> = ({ variant, grain = 0.22, grainScale = 160 }) => (
    <>
        <div className="absolute inset-0 -z-10" style={{ background: MESHES[variant] }} />
        {/* overlay grain — texture over the panel/field */}
        <div
            className="absolute inset-0 -z-10 mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: GRAIN, backgroundSize: `${grainScale}px ${grainScale}px`, opacity: grain }}
        />
    </>
);

export default GrainyMesh;
