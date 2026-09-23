/* =============================================
   EduLearn - Main JavaScript
   ============================================= */

(function($) {
    'use strict';

    // ---- Preloader ----
    $(window).on('load', function() {
        $('.book_preload').fadeOut(500);
    });

    $(document).ready(function() {

        // ---- Sticky Menu ----
        var menuSticky = $('.menu-sticky');
        $(window).on('scroll', function() {
            if ($(this).scrollTop() > 200) {
                menuSticky.addClass('sticky');
            } else {
                menuSticky.removeClass('sticky');
            }
        });

        // ---- Mobile Menu Toggle ----
        $('.rs-menu-toggle').on('click', function() {
            $(this).siblings('.rs-menu').toggleClass('nav-expanded');
        });

        // ---- Mobile Dropdown Toggle ----
        $('.rs-menu .nav-menu .menu-item-has-children > a, .rs-menu .nav-menu .rs-mega-menu > a').on('click', function(e) {
            if ($(window).width() < 992) {
                e.preventDefault();
                $(this).siblings('.sub-menu, .mega-menu').slideToggle(300);
            }
        });

        // ---- Off Canvas Menu ----
        $('#nav-expander').on('click', function(e) {
            e.preventDefault();
            $('.right_menu_togle').addClass('nav-expanded');
            $('body').append('<div class="body-overlay"></div>');
        });

        $('#nav-close, .body-overlay').on('click', function() {
            $('.right_menu_togle').removeClass('nav-expanded');
            $('.body-overlay').remove();
        });

        $(document).on('click', '.body-overlay', function() {
            $('.right_menu_togle').removeClass('nav-expanded');
            $(this).remove();
        });

        // Off canvas sub-menu toggle
        $('.sidebarnav_menu .menu-item-has-children > a').on('click', function(e) {
            e.preventDefault();
            $(this).siblings('.list-unstyled').slideToggle(300);
        });

        // ---- Scroll Up ----
        $(window).on('scroll', function() {
            if ($(this).scrollTop() > 500) {
                $('#scrollUp').fadeIn();
            } else {
                $('#scrollUp').fadeOut();
            }
        });

        $('#scrollUp').on('click', function(e) {
            e.preventDefault();
            if (window.egLenis) {
                window.egLenis.scrollTo(0, { duration: 0.8 });
            } else {
                $('html, body').animate({ scrollTop: 0 }, 600);
            }
        });

        // ---- Owl Carousel Init ----
        $('.rs-carousel').each(function() {
            var $this = $(this);
            $this.owlCarousel({
                loop: $this.data('loop') || false,
                items: $this.data('md-device') || $this.data('items') || 3,
                margin: $this.data('margin') || 0,
                autoplay: $this.data('autoplay') || false,
                autoplayTimeout: $this.data('autoplay-timeout') || 5000,
                smartSpeed: $this.data('smart-speed') || 800,
                dots: $this.data('dots') !== undefined ? $this.data('dots') : true,
                nav: $this.data('nav') !== undefined ? $this.data('nav') : false,
                navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
                responsive: {
                    0: {
                        items: $this.data('mobile-device') || 1,
                        nav: $this.data('mobile-device-nav') || false,
                        dots: $this.data('mobile-device-dots') || false
                    },
                    768: {
                        items: $this.data('ipad-device') || 2,
                        nav: $this.data('ipad-device-nav') || false,
                        dots: $this.data('ipad-device-dots') || false
                    },
                    992: {
                        items: $this.data('md-device') || $this.data('items') || 3,
                        nav: $this.data('md-device-nav') || false,
                        dots: $this.data('md-device-dots') || false
                    }
                }
            });
        });

        // ---- Counter Up ----
        if ($.fn.counterUp) {
            $('.counter-number').counterUp({
                delay: 10,
                time: 1500
            });
        }

        // ---- WOW Animation ----
        if (typeof WOW !== 'undefined') {
            new WOW({
                boxClass: 'wow',
                animateClass: 'animated',
                offset: 0,
                mobile: false,
                live: true
            }).init();
        }

        // ---- Magnific Popup ----
        if ($.fn.magnificPopup) {
            // YouTube popup
            $('.popup-youtube').magnificPopup({
                type: 'iframe',
                mainClass: 'mfp-fade',
                removalDelay: 160,
                preloader: false,
                fixedContentPos: false
            });

            // Image popup
            $('.popup-image').magnificPopup({
                type: 'image',
                gallery: {
                    enabled: true
                }
            });
        }

        // ---- Isotope Filter ----
        if ($.fn.isotope) {
            var $grid = $('.grid').imagesLoaded(function() {
                $grid.isotope({
                    itemSelector: '.grid-item',
                    layoutMode: 'fitRows'
                });
            });

            $('.filter-menu button').on('click', function() {
                var filterValue = $(this).attr('data-filter');
                $grid.isotope({ filter: filterValue });
                $('.filter-menu button').removeClass('active');
                $(this).addClass('active');
            });
        }

        // ---- Smooth Scroll for anchor links ----
        $('a[href^="#"]').on('click', function(e) {
            var href = this.getAttribute('href');
            if (!href || href === '#' || href === '#!') return;
            try {
                var target = $(href);
                if (target.length) {
                    e.preventDefault();
                    if (window.egLenis) {
                        window.egLenis.scrollTo(target[0], { offset: -80, duration: 0.8 });
                    } else {
                        $('html, body').animate({
                            scrollTop: target.offset().top - 80
                        }, 600);
                    }
                }
            } catch (err) {}
        });

        // ---- Search Modal ----
        $('.rs-search').on('click', function(e) {
            e.preventDefault();
        });

        // ---- Bootstrap Accordion ---- 
        // Already handled by Bootstrap JS

        // ---- Tab functionality ----
        $('.nav-tabs .nav-link').on('click', function(e) {
            e.preventDefault();
            $(this).tab('show');
        });

        // ---- Quantity buttons (shop) ----
        $('.qty-btn.plus').on('click', function() {
            var $input = $(this).siblings('input');
            var val = parseInt($input.val()) || 1;
            $input.val(val + 1);
        });

        $('.qty-btn.minus').on('click', function() {
            var $input = $(this).siblings('input');
            var val = parseInt($input.val()) || 1;
            if (val > 1) $input.val(val - 1);
        });

    });

    // ---- Body Overlay Style ----
    $('<style>.body-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:99998;}</style>').appendTo('head');

})(jQuery);
