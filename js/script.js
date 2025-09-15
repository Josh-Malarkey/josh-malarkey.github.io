// const PortfolioFilter = {
//     state: {
//         activeFilters: new Set(),
//         isotopeInstance: null
//     },

//     selectors: {
//         wrapper: '.isotopeWrapper',
//         item: '.isotopeItem',
//         portfolioItem: '.portfolio-item',
//         filterPill: '.folio-filter-pill',
//         clearButton: '#clear-folio-filters-btn'
//     },

//     animationOptions: {
//         duration: 1000,
//         easing: 'easeOutQuart',
//         queue: false
//     },

//     // Initialize the portfolio filter system
//     init() {
//         this.bindFilterHandlers();
//         this.initIsotopeGrid();
//     },

//     // Bind global window functions for filter controls
//     bindFilterHandlers() {
//         window.togglePortfolioFilter = (category) => this.toggleFilter(category);
//         window.clearPortfolioFilters = () => this.clearAllFilters();
//     },

//     // Set up Isotope grid with responsive columns
//     initIsotopeGrid() {
//         const $wrapper = $(this.selectors.wrapper);
//         if (!$wrapper.length) return;

//         const columnCount = parseInt($wrapper.attr('id')) || 1;
//         const getColumnWidth = () => $wrapper.width() / columnCount;

//         $wrapper.isotope({
//             itemSelector: this.selectors.item,
//             resizable: false,
//             masonry: { columnWidth: getColumnWidth() },
//             animationOptions: this.animationOptions,
//             filter: '*' // Show all items initially
//         });
        
//         this.state.isotopeInstance = $wrapper.data('isotope');

//         // Handle responsive layout on window resize
//         $(window).smartresize(() => {
//             $wrapper.isotope({
//                 masonry: { columnWidth: getColumnWidth() }
//             });
//         });
//     },

//     // Toggle a filter category on/off
//     toggleFilter(category) {
//         const isActive = this.state.activeFilters.has(category);
//         if (isActive) {
//             this.state.activeFilters.delete(category);
//         } else {
//             this.state.activeFilters.add(category);
//         }
        
//         this.updateFilterPill(category, !isActive);
//         this.applyFilters();
//         this.updateClearButtonVisibility();
//     },

//     // Remove all active filters
//     clearAllFilters() {
//         this.state.activeFilters.clear();
//         $(this.selectors.filterPill)
//             .removeClass('active')
//             .attr('aria-pressed', 'false');
//         this.applyFilters();
//         this.updateClearButtonVisibility();
//     },

//     // Apply current filters to the Isotope grid
//     applyFilters() {
//         if (!this.state.isotopeInstance) return;

//         let filterFunction;
//         console.log(this.state.activeFilters);
//         console.log('size: ', this.state.activeFilters.size);
        
//         if (this.state.activeFilters.size === 0) {
//             // Show all items when no filters are active
//             filterFunction = '*';
//         } else {
//             // Filter items based on active categories
//             filterFunction = (itemElement) => {
//                 const filters = this.extractItemFilters(itemElement);
//                 // Show item if it has at least one matching filter
//                 return filters.some(filter => this.state.activeFilters.has(filter));
//             };
//         }

//         $(this.selectors.wrapper).isotope({ 
//             filter: filterFunction,
//             animationOptions: this.animationOptions
//         });
//     },

//     // Extract filter categories from a portfolio item
//     extractItemFilters(element) {
//         const $element = $(element);
        
//         // Check if the element itself has data-filters
//         let filterString = $element.attr('data-filters');
//         console.log('filterString: ', filterString);
        
//         // If not, look for a child portfolio-item element
//         if (!filterString) {
//             const $portfolioItem = $element.find(this.selectors.portfolioItem);
//             if ($portfolioItem.length) {
//                 filterString = $portfolioItem.attr('data-filters');
//             }
//         }
        
//         // Parse and return filter array
//         return filterString ? filterString.split(',').map(f => f.trim()) : [];
//     },

//     // Update visual state of filter pill button
//     updateFilterPill(category, isActive) {
//         $(this.selectors.filterPill).each(function() {
//             if ($(this).text().trim() === category) {
//                 $(this)
//                     .toggleClass('active', isActive)
//                     .attr('aria-pressed', isActive);
//             }
//         });
//     },

//     // Show/hide the clear filters button
//     updateClearButtonVisibility() {
//         $(this.selectors.clearButton)
//             .toggleClass('hidden', this.state.activeFilters.size === 0);
//     }
// };
const PortfolioFilters = {
    activeFilters: [],
    $isotope: null,

    init() {
        this.initializeIsotope();
        this.bindEvents();
    },

    initializeIsotope() {
        this.$isotope = $('#isotopeWrapper').isotope({
            itemSelector: '.isotope-item',
            layoutMode: 'fitRows',
            animationOptions: {
                duration: 1000,
                easing: 'easeOutQuart',
                queue: false
            }
        });
    },

    bindEvents() {
        // Filter button click handler
        $('.folio-filter-pill').on('click', (e) => {
            this.handleFilterClick($(e.target));
        });

        // Clear filters button
        $('#clear-folio-filters-btn').on('click', () => {
            this.clearAllFilters();
        });
    },

    handleFilterClick($button) {
        const filter = $button.data('filter');
        
        $button.toggleClass('active');
        
        // Update active filters array
        if ($button.hasClass('active')) {
            if (!this.activeFilters.includes(filter)) {
                this.activeFilters.push(filter);
            }
        } else {
            this.activeFilters = this.activeFilters.filter(f => f !== filter);
        }
        
        // Apply filters with OR logic
        this.applyFilters();
        
        // Show/hide clear button
        this.toggleClearButton();
    },

    clearAllFilters() {
        this.activeFilters = [];
        $('.folio-filter-pill').removeClass('active');
        this.$isotope.isotope({ filter: '*' });
        this.toggleClearButton();
    },

    applyFilters() {
        if (this.activeFilters.length === 0) {
            // Show all items when no filters are active
            this.$isotope.isotope({ filter: '*' });
        } else {
            // Create filter string for OR logic
            const filterString = this.activeFilters.map(filter => `[data-filters*="${filter}"]`).join(', ');
            this.$isotope.isotope({ filter: filterString });
        }
    },

    toggleClearButton() {
        const $clearButton = $('#clearFilters');
        if (this.activeFilters.length > 0) {
            $clearButton.addClass('show');
        } else {
            $clearButton.removeClass('show');
        }
    }
};

const Navigation = {
    selectors: {
        mainNav: '#mainNav',
        firstNavItem: '#main-nav ul li:first-child',
        header: '.header',
        navbarCollapse: '.navbar-inverse .in',
        topLink: "a[href='#top']"
    },

    // Initialize navigation components
    init() {
        this.initOnePageNav();
        this.initSmoothScroll();
        this.initMobileNavCollapse();
    },

    // Set up one-page navigation with active state tracking
    initOnePageNav() {
        const $mainNav = $(this.selectors.mainNav);
        const isFirstItemActive = () => $(this.selectors.firstNavItem).hasClass('active');
        
        if (isFirstItemActive()) {
            $('#main-nav').css('background', 'none');
        }
        
        $mainNav.onePageNav({
            currentClass: 'active',
            changeHash: false,
            scrollSpeed: 950,
            scrollThreshold: 0.2,
            filter: '',
            easing: 'swing',
            end: () => this.updateHeaderBackground(isFirstItemActive()),
            scrollChange: () => this.updateHeaderBackground(isFirstItemActive())
        });
    },

    // Toggle header background based on active section
    updateHeaderBackground(isFirstActive) {
        $(this.selectors.header).toggleClass('addBg', !isFirstActive);
    },

    // Enable smooth scrolling for "back to top" link
    initSmoothScroll() {
        $(this.selectors.topLink).click(function() {
            $("html, body").animate({ scrollTop: 0 }, "slow");
            return false;
        });
    },

    // Auto-collapse mobile menu after clicking a link
    initMobileNavCollapse() {
        $('.navbar-inverse').on('click', 'li a', () => {
            $(this.selectors.navbarCollapse)
                .addClass('collapse')
                .removeClass('in')
                .css('height', '1px');
        });
    }
};

const ResponsiveBanner = {
    selectors: {
        container: '.banner-container',
        slider: '#da-slider'
    },

    // Initialize responsive banner height adjustment
    init() {
        this.updateHeight();
        $(window).resize(() => this.updateHeight());
    },

    // Match slider height to container height
    updateHeight() {
        const bannerHeight = $(this.selectors.container).height();
        $(this.selectors.slider).height(bannerHeight);
    }
};

const PortfolioApp = {
    // Initialize all portfolio components
    init() {
        PortfolioFilters.init();
        Navigation.init();
        ResponsiveBanner.init();
        this.initFancybox();
    },

    // Initialize Fancybox for image galleries
    initFancybox() {
        $(".fancybox").fancybox();
    }
};

// Start the application when DOM is ready
$(document).ready(() => PortfolioApp.init());
