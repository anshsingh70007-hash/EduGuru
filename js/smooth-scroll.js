/**
 * EducationistGuru — Ultra-Responsive, Zero-Lag Smooth Scroll Engine
 * Powered by Lenis 1.1+
 * Eliminates input delay, jitter, and frame conflicts across all devices.
 */

(function () {
    'use strict';

    function loadScript(src, callback) {
        if (typeof Lenis !== 'undefined') {
            callback();
            return;
        }
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            existingScript.addEventListener('load', callback);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = callback;
        document.head.appendChild(script);
    }

    function initLenis() {
        if (typeof Lenis === 'undefined') return;

        // Prevent duplicate instances
        if (window.egLenis) {
            try { window.egLenis.destroy(); } catch (e) {}
        }

        // Optimized physics: Responsive, zero-latency wheel with silky momentum
        const lenis = new Lenis({
            lerp: 0.12,            // Responsive linear interpolation (no floaty lag or delayed reaction)
            wheelMultiplier: 1.0,  // Natural 1:1 speed
            touchMultiplier: 1.2,  // Responsive touch tracking
            smoothWheel: true,     // Butter-smooth desktop wheel
            syncTouch: false,      // Preserve native 120Hz momentum on touch screens
            autoResize: true,
            gestureOrientation: 'vertical',
            orientation: 'vertical'
        });

        window.egLenis = lenis;

        // Continuous high-precision RAF loop
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Bootstrap Modals & Offcanvas: Lock background scroll cleanly without glitches
        if (window.jQuery) {
            window.jQuery(document).on('show.bs.modal', function () {
                lenis.stop();
            });
            window.jQuery(document).on('hidden.bs.modal', function () {
                lenis.start();
            });
        }

        // Intercept all internal anchor clicks for butter-smooth navigation
        document.addEventListener('click', function (e) {
            const anchor = e.target.closest('a[href^="#"]');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href || href === '#' || href === '#!') return;

            // Check if it targets an element on this page
            try {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    lenis.scrollTo(target, {
                        offset: -85,
                        duration: 0.9,
                        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                    });
                }
            } catch (err) {
                // Invalid selector, pass through
            }
        });

        // Scroll to top button (#scrollUp) binding
        const scrollUpBtn = document.getElementById('scrollUp');
        if (scrollUpBtn) {
            scrollUpBtn.addEventListener('click', function (e) {
                e.preventDefault();
                lenis.scrollTo(0, {
                    duration: 0.8,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                });
            });
        }
    }

    function start() {
        // Prefer local vendored copy for instant offline loading, fallback to CDN
        loadScript('js/lenis.min.js', function () {
            if (typeof Lenis !== 'undefined') {
                initLenis();
            } else {
                loadScript('https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js', initLenis);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();

/* =============================================
   Scroll Reveal — IntersectionObserver for section animations
   ============================================= */
(function() {
  'use strict';
  if (!('IntersectionObserver' in window)) return;

  function initReveal() {
    var sections = document.querySelectorAll(
      '.sec-title, .services-item, .cource-item, .event-item, ' +
      '.rs-counter-list, .news-normal-block, .testimonial-item'
    );

    sections.forEach(function(el) {
      el.classList.add('eg-reveal');
    });

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('eg-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

    sections.forEach(function(el) {
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();

