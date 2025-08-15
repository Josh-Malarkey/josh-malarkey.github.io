// Custom Script
// Developed by: Samson.Onna
// Edited by: Josh Malarkey
var customScripts = {
    profile: function () {
        // portfolio
        if ($('.isotopeWrapper').length) {
            var $container = $('.isotopeWrapper');
            var $resize = $('.isotopeWrapper').attr('id');
            // initialize isotope
            $container.isotope({
                itemSelector: '.isotopeItem',
                resizable: false, // disable normal resizing
                masonry: {
                    columnWidth: $container.width() / $resize
                }
            });
            $("a[href='#top']").click(function () {
                $("html, body").animate({ scrollTop: 0 }, "slow");
                return false;
            });
            $('.navbar-inverse').on('click', 'li a', function () {
                $('.navbar-inverse .in').addClass('collapse').removeClass('in').css('height', '1px');
            });
            $('#filter a').click(function () {
                $('#filter a').removeClass('current');
                $(this).addClass('current');
                var selector = $(this).attr('data-filter');
                $container.isotope({
                    filter: selector,
                    animationOptions: {
                        duration: 1000,
                        easing: 'easeOutQuart',
                        queue: false
                    }
                });
                return false;
            });
            $(window).smartresize(function () {
                $container.isotope({
                    // update columnWidth to a percentage of container width
                    masonry: {
                        columnWidth: $container.width() / $resize
                    }
                });
            });
        }
    },
    fancybox: function () {
        // fancybox
        $(".fancybox").fancybox();
    },
    onePageNav: function () {

        		if($('#main-nav ul li:first-child').hasClass('active')){
					$('#main-nav').css('background','none');
		}
        $('#mainNav').onePageNav({        
            currentClass: 'active',
            changeHash: false,
            scrollSpeed: 950,
            scrollThreshold: 0.2,
            filter: '',
            easing: 'swing',
            begin: function () {
                //I get fired when the animation is starting
            },
            end: function () {
                //I get fired when the animation is ending
				if(!$('#main-nav ul li:first-child').hasClass('active')){
					$('.header').addClass('addBg');					
				}else{
                    $('.header').removeClass('addBg');
				}
				
            },
            scrollChange: function ($currentListItem) {
                //I get fired when you enter a section and I pass the list item of the section
				if(!$('#main-nav ul li:first-child').hasClass('active')){
					$('.header').addClass('addBg');
                    console.log($currentListItem.selector)
				}else{
						$('.header').removeClass('addBg');
				}
            }
        });
    },
    bannerHeight: function () {
        var bHeight = $(".banner-container").height();
        $('#da-slider').height(bHeight);
        $(window).resize(function () {
            var bHeight = $(".banner-container").height();
            $('#da-slider').height(bHeight);
        });
    },
    initCircleObserver: function () {
        // observer that looks for circular skill charts to animate upon the objects intersecting with the view window
        var observer = new IntersectionObserver(function(entries) {
            var circles = document.querySelectorAll('.circle');
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // add the circle 'progress' animation if we intersect with the chart wrapper
                    circles.forEach(cir=> {
                        cir.classList.add('circle-progress');
                    });
                    return;
                }
                // otherwise remove the class if we're not interesecting
                circles.forEach(cir=> {
                    cir.classList.remove('circle-progress');
                })
            });
        });
        // observer object observing for the 'circular-chart' class to come into view
        observer.observe(document.querySelector('.chart-wrapper'));
    },
    init: function () {
        customScripts.onePageNav();
        customScripts.profile();
        customScripts.fancybox();
        customScripts.slider();
        customScripts.owlSlider();
        customScripts.bannerHeight();
        customScripts.initCircleObserver();
    }
}

$('document').ready(function () {
    customScripts.init();
});
