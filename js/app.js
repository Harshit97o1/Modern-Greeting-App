/**
 * ============================================================
 *  Modern Greeting App — Application Logic
 *  Pure vanilla ES6+ • No external libraries
 * ============================================================
 */

(() => {
  'use strict';

  // ── DOM References ──────────────────────────────────────────
  const nameInput = document.getElementById('name-input');
  const greetBtn = document.getElementById('greet-btn');
  const greetingOut = document.getElementById('greeting-output');
  const animCanvas = document.getElementById('animation-canvas');

  // ── State ───────────────────────────────────────────────────
  let animationRunning = false; // Prevents overlapping animations

  // ── Utility Helpers ─────────────────────────────────────────

  /** Returns a random number between min (inclusive) and max (exclusive). */
  const rand = (min, max) => Math.random() * (max - min) + min;

  /** Returns a random integer between min and max (both inclusive). */
  const randInt = (min, max) => Math.floor(rand(min, max + 1));

  /** Picks a random item from an array. */
  const pick = (arr) => arr[randInt(0, arr.length - 1)];

  /** Removes all children of an element. */
  const clearCanvas = () => { animCanvas.innerHTML = ''; };

  // ── Curated Color Palettes ──────────────────────────────────
  const CONFETTI_COLORS = [
    '#7f5af0', '#e056a0', '#56c8e0', '#f0c956',
    '#2cb67d', '#ff6b6b', '#ffd93d', '#6c63ff',
    '#ff9a76', '#a0e7e5',
  ];

  const POPPER_COLORS = [
    '#ff6b6b', '#ffd93d', '#6c63ff', '#2cb67d',
    '#e056a0', '#f0c956', '#56c8e0', '#ff9a76',
  ];

  // Glow palette — high-alpha so they're visible on the dark background
  const GLOW_COLORS = [
    { inner: 'rgba(100, 150, 255, 1)', outer: 'rgba(80, 120, 255, 0.5)' },  // neon blue
    { inner: 'rgba(170, 110, 255, 1)', outer: 'rgba(140, 90, 240, 0.45)' },  // violet
    { inner: 'rgba(255, 220, 130, 0.95)', outer: 'rgba(255, 200, 90, 0.4)' },  // soft gold
    { inner: 'rgba(255, 255, 255, 1)', outer: 'rgba(210, 220, 255, 0.45)' },  // white glow
    { inner: 'rgba(130, 210, 255, 1)', outer: 'rgba(100, 180, 240, 0.45)' },  // ice blue
    { inner: 'rgba(210, 140, 255, 1)', outer: 'rgba(190, 110, 255, 0.4)' },  // lavender
  ];

  // ── Animation 1: Confetti Fall ──────────────────────────────
  /**
   * Creates a shower of colorful confetti pieces that fall
   * from the top of the viewport with random rotation.
   */
  const triggerConfetti = () => {
    const PIECE_COUNT = 80;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < PIECE_COUNT; i++) {
      const el = document.createElement('div');
      el.classList.add('confetti-piece');

      const size = rand(6, 14);
      const left = rand(0, 100);
      const dur = rand(2, 4.5);
      const delay = rand(0, 1.2);
      const color = pick(CONFETTI_COLORS);
      const shape = pick(['square', 'circle', 'strip']);

      el.style.cssText = `
        left: ${left}%;
        width: ${size}px;
        height: ${shape === 'strip' ? size * 2.5 : size}px;
        background: ${color};
        border-radius: ${shape === 'circle' ? '50%' : '2px'};
        animation-duration: ${dur}s;
        animation-delay: ${delay}s;
        opacity: 0;
      `;

      fragment.appendChild(el);
    }

    animCanvas.appendChild(fragment);

    // Self-cleanup after the longest possible duration
    const maxLife = 6000;
    setTimeout(() => {
      clearCanvas();
      animationRunning = false;
    }, maxLife);
  };

  // ── Animation 2: Party Popper Burst ─────────────────────────
  /**
   * Simulates two party popper bursts from the bottom corners
   * with particles radiating outward.
   */
  const triggerPopper = () => {
    const PARTICLE_COUNT = 50;
    const fragment = document.createDocumentFragment();

    // Two origins: bottom-left and bottom-right
    const origins = [
      { x: 10, y: 90 },
      { x: 90, y: 90 },
    ];

    origins.forEach((origin) => {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const el = document.createElement('div');
        el.classList.add('popper-particle');

        const angle = rand(-Math.PI * 0.9, -Math.PI * 0.1); // Upward arc
        const dist = rand(120, 500);
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const dur = rand(0.8, 1.8);
        const delay = rand(0, 0.3);
        const size = rand(5, 12);
        const color = pick(POPPER_COLORS);
        const shape = pick(['circle', 'square']);

        el.style.cssText = `
          left: ${origin.x}%;
          top: ${origin.y}%;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: ${shape === 'circle' ? '50%' : '2px'};
          animation-duration: ${dur}s;
          animation-delay: ${delay}s;
          --tx: ${tx}px;
          --ty: ${ty}px;
        `;

        // Override the keyframe destination via inline custom properties
        el.animate(
          [
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0.3)`, opacity: 0 },
          ],
          {
            duration: dur * 1000,
            delay: delay * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards',
          }
        );

        fragment.appendChild(el);
      }
    });

    animCanvas.appendChild(fragment);

    const maxLife = 2500;
    setTimeout(() => {
      clearCanvas();
      animationRunning = false;
    }, maxLife);
  };

  // ── Animation 3: Cinematic Glowing Radial Burst ──────────────
  /**
   * Creates a layered, cinematic radial burst from the center.
   *
   * Previous bugs fixed:
   *  1. CSS `animation: glowPulse ease-out forwards` (no duration)
   *     defaulted to 0s, snapping opacity→0 instantly — elements
   *     were invisible before the JS Web Animations API even ran.
   *     FIX: Removed all CSS animation declarations; JS drives everything.
   *  2. Excessive blur (18→38px) made orbs invisible on dark bg.
   *     FIX: Reduced blur range to 4→18px.
   *  3. Color alpha too low (0.18–0.25 outer) → nearly transparent.
   *     FIX: Boosted to 0.4–0.5.
   *  4. Orb sizes too small (100–280px) for full-viewport effect.
   *     FIX: Increased to 180–420px.
   *  5. Cleanup timeout (2800ms) was marginal.
   *     FIX: Extended to 3200ms with safety headroom.
   */
  const triggerGlow = () => {
    const ORB_COUNT = 10;
    const RING_COUNT = 5;
    const fragment = document.createDocumentFragment();

    // Viewport center (px)
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    // ── Layer 1: Radial-gradient glow orbs ──────────────────
    for (let i = 0; i < ORB_COUNT; i++) {
      const el = document.createElement('div');
      el.classList.add('radial-glow');

      const palette = pick(GLOW_COLORS);
      const size = rand(180, 420);       // bigger = more visible
      const offX = rand(-120, 120);
      const offY = rand(-120, 120);
      const dur = rand(900, 1200);      // ms
      const delay = i * 70;              // stagger for wave feel

      // Layered radial-gradient: bright core → soft mid → transparent edge
      el.style.cssText = `
        left:   ${cx + offX - size / 2}px;
        top:    ${cy + offY - size / 2}px;
        width:  ${size}px;
        height: ${size}px;
        background: radial-gradient(
          circle,
          ${palette.inner} 0%,
          ${palette.outer} 40%,
          transparent 70%
        );
      `;

      // Web Animations API — sole animation driver (no CSS conflict)
      el.animate(
        [
          { transform: 'scale(0)', opacity: 0, filter: 'blur(4px) brightness(1)' },
          { transform: 'scale(0.5)', opacity: 1, filter: 'blur(6px) brightness(1.5)', offset: 0.2 },
          { transform: 'scale(0.85)', opacity: 0.85, filter: 'blur(8px) brightness(1.6)', offset: 0.4 },
          { transform: 'scale(1.15)', opacity: 0.45, filter: 'blur(12px) brightness(1.2)', offset: 0.7 },
          { transform: 'scale(1.5)', opacity: 0, filter: 'blur(18px) brightness(0.9)' },
        ],
        {
          duration: dur,
          delay,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        }
      );

      fragment.appendChild(el);
    }

    // ── Layer 2: Concentric expanding rings ─────────────────
    for (let i = 0; i < RING_COUNT; i++) {
      const ring = document.createElement('div');
      ring.classList.add('radial-glow-ring');

      const ringSize = rand(80, 180);
      const dur = rand(1000, 1200);
      const delay = i * 110;
      const palette = pick(GLOW_COLORS);

      ring.style.cssText = `
        left:   ${cx - ringSize / 2}px;
        top:    ${cy - ringSize / 2}px;
        width:  ${ringSize}px;
        height: ${ringSize}px;
        border-color: ${palette.outer};
      `;

      ring.animate(
        [
          { transform: 'scale(0)', opacity: 0.7, borderWidth: '3px' },
          { transform: 'scale(1.4)', opacity: 0.4, borderWidth: '2px', offset: 0.45 },
          { transform: 'scale(3)', opacity: 0, borderWidth: '0.5px' },
        ],
        {
          duration: dur,
          delay,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        }
      );

      fragment.appendChild(ring);
    }

    animCanvas.appendChild(fragment);

    // Cleanup: last orb  = 9*70 + 1200 = 1830ms
    //          last ring = 4*110 + 1200 = 1640ms
    //          safety margin = +400ms
    const maxLife = 3200;
    setTimeout(() => {
      clearCanvas();
      animationRunning = false;
    }, maxLife);
  };

  // ── Animation Dispatcher ────────────────────────────────────
  /** Array of available animation functions. */
  const animations = [triggerConfetti, triggerPopper, triggerGlow];

  /**
   * Selects and runs exactly one random animation.
   * Prevents overlapping by checking the running flag.
   */
  const playRandomAnimation = () => {
    if (animationRunning) return;
    animationRunning = true;

    // Clear any leftover DOM elements from previous runs
    clearCanvas();

    const chosen = pick(animations);
    chosen();
  };

  // ── Greeting Logic ──────────────────────────────────────────
  /**
   * Displays the greeting message with a slide-up + fade-in
   * micro-interaction, then fires a background animation.
   */
  const handleGreet = () => {
    const name = nameInput.value.trim();
    const message = name ? `Hello ${name}` : 'Hello';

    // Reset animation state so it replays on every click
    greetingOut.classList.remove('visible');

    // Force reflow to restart the CSS transition
    void greetingOut.offsetWidth;

    greetingOut.textContent = message;
    greetingOut.classList.add('visible');

    // Trigger one random background animation
    playRandomAnimation();
  };

  // ── Button Ripple Tracker ───────────────────────────────────
  /**
   * Tracks the mouse position over the button to position
   * the radial-gradient ripple highlight.
   */
  const trackRipple = (e) => {
    const rect = greetBtn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    greetBtn.style.setProperty('--x', `${x}%`);
    greetBtn.style.setProperty('--y', `${y}%`);
  };

  // ── Event Listeners ─────────────────────────────────────────
  greetBtn.addEventListener('click', handleGreet);
  greetBtn.addEventListener('mousemove', trackRipple);

  // Allow "Enter" key to trigger greeting
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGreet();
    }
  });
})();
