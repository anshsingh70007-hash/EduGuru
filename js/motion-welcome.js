/* ==========================================================================
   EducationistGuru — Pure Motion Graphics Welcome Controller
   Choreography: Staggered Kinetic Typography, Vector SVG Drawing, Quintic Curtain Exit
   Failsafe: Guaranteed dismissal within 1.5s with instant click-to-skip
   ========================================================================== */

(function () {
    'use strict';

    // 1. Instantly eradicate any legacy preloader so it never covers the screen
    function removeLegacyPreloaders() {
        const preloaders = document.querySelectorAll('.book_preload, #loading, .preloader');
        preloaders.forEach(el => {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            setTimeout(() => { try { el.remove(); } catch (e) {} }, 100);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeLegacyPreloaders);
    } else {
        removeLegacyPreloaders();
    }

    // 2. Motion Graphics Welcome Screen Lifecycle
    const welcomeEl = document.getElementById('eg-motion-welcome');
    if (!welcomeEl) return;

    const counterEl = document.getElementById('eg-welcome-counter');
    const progressBar = document.getElementById('eg-progress-bar');
    let dismissed = false;

    function dismissWelcomeScreen() {
        if (dismissed) return;
        dismissed = true;

        if (welcomeEl) {
            welcomeEl.classList.add('eg-exit');
        }

        try {
            sessionStorage.setItem('eg_welcomed', 'true');
        } catch (e) {}

        // Resume smooth scroll if initialized
        if (window.egLenis) {
            try { window.egLenis.start(); } catch (e) {}
        }

        // Remove cleanly from DOM after CSS exit transition
        setTimeout(() => {
            if (welcomeEl && welcomeEl.parentNode) {
                welcomeEl.remove();
            }
        }, 800);
    }

    // Accessibility check: Skip immediately if reduced motion is requested
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        dismissWelcomeScreen();
        return;
    }

    // Stop background scrolling while welcome animation runs
    if (window.egLenis) {
        try { window.egLenis.stop(); } catch (e) {}
    }

    // Allow instant click / tap anywhere to skip immediately
    welcomeEl.addEventListener('click', dismissWelcomeScreen);

    // Hard Failsafe: Under NO CIRCUMSTANCES will the loading screen remain after 1.5s
    const failsafeTimer = setTimeout(dismissWelcomeScreen, 1500);

    // Dynamic Counter & Progress Bar Animation
    let progress = 0;
    const startTime = performance.now();
    const totalDuration = 1100; // 1.1s smooth timeline

    function tick(now) {
        if (dismissed) return;

        const elapsed = now - startTime;
        const linearRatio = Math.min(elapsed / totalDuration, 1);

        // Quintic Ease Out curve
        const eased = 1 - Math.pow(1 - linearRatio, 4);
        progress = Math.min(Math.floor(eased * 100), 100);

        if (counterEl) {
            counterEl.textContent = progress < 10 ? '0' + progress : String(progress);
        }
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }

        if (linearRatio < 1) {
            requestAnimationFrame(tick);
        } else {
            clearTimeout(failsafeTimer);
            dismissWelcomeScreen();
        }
    }

    requestAnimationFrame(tick);
})();
