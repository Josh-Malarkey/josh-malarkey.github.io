/*
 * Features:
 * - Resume section view tracking
 * - Portfolio section view tracking
 * - Portfolio Card click tracking (content-focused)
 * - CCPA/GDPR compliant without consent banners
 * 
 * Usage:
 * 1. Include this script after the GoatCounter script
 * 2. Add data-section="resume" to track resume views
 * 3. Add data-section="portfolio" to track portfolio views
 * 4. Add class="card-grid" to track portfolio views
 * 5. Ensure cards have the "card" class to track clicks
 */

class GoatCounterTracker {
    constructor(options = {}) {
        const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        // configuration options
        this.config = {
            debugMode: isLocalhost,
            statusElementId: options.statusElementId || 'trackingStatus',
            maxGoatCounterWaitAttempts: options.maxGoatCounterWaitAttempts || 50,
            // privacy-focused defaults
            respectDoNotTrack: options.respectDoNotTrack !== false,
            sectionVisibilityThreshold: options.sectionVisibilityThreshold || 0.1,
            sectionRootMargin: options.sectionRootMargin || '0px 0px 0% 0px',
            // section tracking timing
            sectionTrackingDelay: options.sectionTrackingDelay || 1000, // ms to wait before tracking
            ...options
        };

        // tracking state
        this.isGoatCounterReady = false;
        this.eventQueue = [];
        this.resumeViewed = false;
        this.portfolioViewed = false;
        this.sectionsTracked = new Set();
        this.intersectionObserver = null;

        // check privacy preferences before initializing
        if (this.shouldRespectDoNotTrack()) {
            this.log('Do Not Track detected - analytics disabled');
            return;
        }

        this.init();
    }

    shouldRespectDoNotTrack() {
        if (!this.config.respectDoNotTrack) return false;
        
        return navigator.doNotTrack === '1' || 
               navigator.msDoNotTrack === '1' || 
               window.doNotTrack === '1';
    }

    init() {
        this.log('Initializing CCPA/GDPR Compliant Tracker...');
        
        this.waitForGoatCounter()
            .then(() => {
                this.isGoatCounterReady = true;
                this.updateStatus('GoatCounter Ready');
                this.log('GoatCounter is ready, setting up compliant tracking...');
                
                // process any queued events
                this.processEventQueue();
                
                // setup tracking methods
                this.setupSectionViewTracking();
                this.setupCardClickTracking();
                
                this.log('All tracking methods initialized successfully');
            })
            .catch((error) => {
                this.updateStatus('GoatCounter Failed to Load');
                this.log('Failed to initialize GoatCounter:', error);
            });
    }

    async waitForGoatCounter(maxAttempts = this.config.maxGoatCounterWaitAttempts) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const checkGoatCounter = () => {
                if (window.goatcounter && typeof window.goatcounter.count === 'function') {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('GoatCounter not available after maximum attempts'));
                } else {
                    attempts++;
                    setTimeout(checkGoatCounter, 100);
                }
            };
            checkGoatCounter();
        });
    }

    updateStatus(message) {
        const statusElement = document.getElementById(this.config.statusElementId);
        if (statusElement) {
            statusElement.textContent = `Tracking Status: ${message}`;
        }
        this.log(`Status: ${message}`);
    }

    // debug logging
    log(...args) {
        if (this.config.debugMode) {
            console.log('[GoatCounter Tracker]', ...args);
        }
    }

    processEventQueue() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.sendEvent(event.name, event.value, event.data);
        }
    }

    setupSectionViewTracking() {
        // find all elements with data-section attributes
        const sectionElements = document.querySelectorAll('[data-section]');
        
        if (!sectionElements.length) {
            this.log('No elements with data-section attributes found');
            return;
        }

        // check if intersection observer is supported
        if (!window.IntersectionObserver) {
            this.log('IntersectionObserver not supported, falling back to immediate tracking');
            // fallback: track immediately visible sections
            sectionElements.forEach(element => {
                const sectionName = element.getAttribute('data-section');
                this.trackSectionView(sectionName);
            });
            return;
        }

        // create intersection observer for section tracking
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const sectionName = entry.target.getAttribute('data-section');
                        this.handleSectionIntersection(sectionName, entry.target);
                    }
                });
            },
            {
                root: null, // viewport
                rootMargin: this.config.sectionRootMargin,
                threshold: this.config.sectionVisibilityThreshold
            }
        );

        // observe all section elements
        sectionElements.forEach(element => {
            this.intersectionObserver.observe(element);
        });

        this.log(`Section view tracking initialized for ${sectionElements.length} sections`);
    }

    handleSectionIntersection(sectionName, element) {
        // prevent duplicate tracking
        if (this.sectionsTracked.has(sectionName)) {
            return;
        }

        this.log(`Section "${sectionName}" became visible`);

        // add delay to ensure user actually viewed the section
        setTimeout(() => {
            // check if element is still visible (user didn't just scroll past quickly)
            if (this.isElementStillVisible(element)) {
                this.trackSectionView(sectionName);
            }
        }, this.config.sectionTrackingDelay);
    }

    isElementStillVisible(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;

        return (
            rect.top < windowHeight &&
            rect.bottom > 0 &&
            rect.left < windowWidth &&
            rect.right > 0
        );
    }

    trackSectionView(sectionName) {
        // prevent duplicate tracking
        if (this.sectionsTracked.has(sectionName)) {
            return;
        }

        this.sectionsTracked.add(sectionName);

        // specific handling for resume and portfolio sections
        switch (sectionName.toLowerCase()) {
            case 'resume':
                this.trackResumeView();
                break;
            case 'portfolio':
                this.trackPortfolioView();
                break;
            default:
                // track any other sections generically
                this.sendEvent('section-view', sectionName);
                this.updateStatus(`Section Viewed: ${sectionName}`);
                break;
        }

        this.log(`Section "${sectionName}" view tracked`);
    }

    trackResumeView() {
        if (this.resumeViewed) {
            this.log('Resume already tracked, skipping duplicate');
            return;
        }

        this.resumeViewed = true;
        
        this.sendEvent('section-view', 'resume', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.split(' ')[0], // minimal UA info
            screenSize: `${screen.width}x${screen.height}`
        });
        
        this.updateStatus('Resume Viewed');
        this.log('Resume section view tracked');
    }

    trackPortfolioView() {
        if (this.portfolioViewed) {
            this.log('Portfolio already tracked, skipping duplicate');
            return;
        }

        this.portfolioViewed = true;
        
        // count portfolio items for context
        const portfolioCards = document.querySelectorAll('[data-section="portfolio"] .card, .card-grid .card');
        
        this.sendEvent('section-view', 'portfolio', {
            timestamp: new Date().toISOString(),
            portfolioItemCount: portfolioCards.length,
            userAgent: navigator.userAgent.split(' ')[0], // minimal UA info
            screenSize: `${screen.width}x${screen.height}`
        });
        
        this.updateStatus('Portfolio Viewed');
        this.log(`Portfolio section view tracked (${portfolioCards.length} items)`);
    }

    setupCardClickTracking() {
        const cards = document.querySelectorAll('.card');
        
        if (!cards.length) {
            this.log('No elements with .card class found');
            return;
        }

        cards.forEach((card, index) => {
            card.addEventListener('click', (e) => {
                const cardData = this.extractCardData(card, index);
                
                this.sendEvent('card-click', cardData.title, {
                    link: cardData.link,
                    position: cardData.position,
                    timestamp: new Date().toISOString()
                });
                
                this.updateStatus(`Card Click: ${cardData.title}`);
                
                // let the default action (link navigation) continue
            }, { passive: true });
        });

        this.log(`Card click tracking initialized for ${cards.length} cards`);
    }

    extractCardData(card, index) {
        const titleElement = card.querySelector('.card-title, h1, h2, h3, h4, h5, h6');
        const linkElement = card.querySelector('a');
        
        return {
            title: titleElement?.textContent?.trim() || `Card ${index + 1}`,
            link: linkElement?.href || 'no-link',
            position: index + 1
        };
    }

    sendEvent(eventName, eventValue, additionalData = {}) {
        // if goatcounter isn't ready, queue the event
        if (!this.isGoatCounterReady) {
            this.eventQueue.push({ name: eventName, value: eventValue, data: additionalData });
            this.log('GoatCounter not ready, queuing event:', eventName, eventValue);
            return;
        }

        try {
            // clean the event value for URL-safe path
            const cleanEventValue = String(eventValue).replace(/[^a-zA-Z0-9-._~]/g, '-');
            
            // CCPA/GDPR compliant event tracking - only functional data, no PII
            window.goatcounter.count({
                path: `${eventName}/${cleanEventValue}`,
                title: `${eventName}: ${eventValue}`,
                event: true
            });
            
            this.log('GoatCounter event tracked:', {
                event: eventName,
                value: eventValue,
                cleanValue: cleanEventValue,
                data: additionalData
            });
        } catch (error) {
            console.error('Error sending GoatCounter event:', error);
        }
    }

    // public method to manually track sections (for dynamic content)
    manuallyTrackSection(sectionName) {
        this.log(`Manually tracking section: ${sectionName}`);
        this.trackSectionView(sectionName);
    }

    // cleanup method
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        this.log('Tracker destroyed and cleaned up');
    }
}

// auto-initialize when DOM is ready
function initializeGoatCounterTracking(options = {}) {
    if (typeof window !== 'undefined') {
        const tracker = new GoatCounterTracker(options);
        
        // make tracker globally accessible for custom tracking
        window.goatCounterTracker = tracker;
        
        return tracker;
    }
}

// initialize automatically when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeGoatCounterTracking();
    });
} else {
    initializeGoatCounterTracking();
}

// export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoatCounterTracker, initializeGoatCounterTracking };
}