/**
 * GoatCounter Advanced Tracking Implementation
 * 
 * Features:
 * - Scroll depth tracking (25%, 50%, 75%, 90%, 100%)
 * - Section visibility tracking using Intersection Observer
 * - Card click tracking with detailed metadata
 * 
 * Usage:
 * 1. Include this script after the GoatCounter script
 * 2. Add data-section="section-name" to sections you want to track
 * 3. Ensure cards have the "card" class
 */

class GoatCounterTracker {
    constructor(options = {}) {
        const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        // Configuration options
        this.config = {
            scrollDepthThresholds: options.scrollDepthThresholds || [25, 50, 75, 90, 100],
            sectionVisibilityThreshold: options.sectionVisibilityThreshold || 0.1,
            sectionRootMargin: options.sectionRootMargin || '0px 0px 0px 0px',
            // debugMode: options.debugMode || false,
            debugMode: isLocalhost,
            statusElementId: options.statusElementId || 'trackingStatus',
            maxGoatCounterWaitAttempts: options.maxGoatCounterWaitAttempts || 50,
            ...options
        };

        // Tracking state
        this.scrollDepthTracked = new Set();
        this.sectionsTracked = new Set();
        this.isGoatCounterReady = false;
        this.eventQueue = [];

        this.init();
    }

    /**
     * Initialize the tracker
     */
    init() {
        this.log('Initializing GoatCounter Tracker...');
        
        this.waitForGoatCounter()
            .then(() => {
                this.isGoatCounterReady = true;
                this.updateStatus('GoatCounter Ready');
                this.log('GoatCounter is ready, setting up tracking...');
                
                // Process any queued events
                this.processEventQueue();
                
                // Setup tracking methods
                this.setupScrollDepthTracking();
                this.setupSectionVisibilityTracking();
                this.setupCardClickTracking();
                
                this.log('All tracking methods initialized successfully');
            })
            .catch((error) => {
                this.updateStatus('GoatCounter Failed to Load');
                this.log('Failed to initialize GoatCounter:', error);
            });
    }

    /**
     * Wait for GoatCounter to be available
     */
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

    /**
     * Update status display (if status element exists)
     */
    updateStatus(message) {
        const statusElement = document.getElementById(this.config.statusElementId);
        if (statusElement) {
            statusElement.textContent = `Tracking Status: ${message}`;
        }
        this.log(`Status: ${message}`);
    }

    /**
     * Debug logging
     */
    log(...args) {
        if (this.config.debugMode) {
            console.log('[GoatCounter Tracker]', ...args);
        }
    }

    /**
     * Process queued events when GoatCounter becomes ready
     */
    processEventQueue() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.sendEvent(event.name, event.value, event.data);
        }
    }

    /**
     * Setup scroll depth tracking
     */
    setupScrollDepthTracking() {
        let ticking = false;
        
        const trackScrollDepth = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const docHeight = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
            );
            const winHeight = window.innerHeight;
            const scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);

            this.config.scrollDepthThresholds.forEach(threshold => {
                if (scrollPercent >= threshold && !this.scrollDepthTracked.has(threshold)) {
                    this.scrollDepthTracked.add(threshold);
                    this.sendEvent('scroll-depth', `${threshold}%`, { 
                        actualPercent: scrollPercent 
                    });
                    this.updateStatus(`Scroll: ${threshold}%`);
                }
            });

            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(trackScrollDepth);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        
        // Initial check in case user starts mid-page
        setTimeout(trackScrollDepth, 100);
        
        this.log('Scroll depth tracking initialized');
    }

    /**
     * Setup section visibility tracking using Intersection Observer
     */
    setupSectionVisibilityTracking() {
        // Use more specific selector and check for elements
        const sections = document.querySelectorAll('[data-section]');
        
        this.log(`Found ${sections.length} elements with data-section attribute`);
        
        if (!sections.length) {
            this.log('No sections with data-section attribute found');
            return;
        }

        // Log all found sections for debugging
        sections.forEach((section, index) => {
            this.log(`Section ${index + 1}: data-section="${section.dataset.section}", id="${section.id || 'no-id'}"`);
        });

        const observerOptions = {
            root: null, // Use viewport as root
            threshold: this.config.sectionVisibilityThreshold,
            rootMargin: this.config.sectionRootMargin
        };

        const sectionObserver = new IntersectionObserver((entries) => {
            this.log(`Intersection Observer triggered for ${entries.length} entries`);
            
            entries.forEach(entry => {
                const sectionName = entry.target.dataset.section;
                const sectionId = entry.target.id || 'unnamed-section';
                
                this.log(`Section "${sectionName}" intersection:`, {
                    isIntersecting: entry.isIntersecting,
                    intersectionRatio: entry.intersectionRatio.toFixed(3),
                    boundingRect: {
                        top: Math.round(entry.boundingClientRect.top),
                        bottom: Math.round(entry.boundingClientRect.bottom)
                    }
                });
                
                if (entry.isIntersecting) {
                    // Use a unique key that includes both section name and element ID to handle duplicates
                    const uniqueKey = `${sectionName}-${sectionId}`;
                    
                    if (!this.sectionsTracked.has(uniqueKey)) {
                        this.sectionsTracked.add(uniqueKey);
                        this.sendEvent('section-view', sectionName, {
                            elementId: sectionId,
                            intersectionRatio: entry.intersectionRatio,
                            uniqueKey: uniqueKey
                        });
                        this.updateStatus(`Section: ${sectionName}`);
                        this.log(`✅ Tracked section view: ${sectionName} (${uniqueKey})`);
                    } else {
                        this.log(`⏭️ Section already tracked: ${sectionName} (${uniqueKey})`);
                    }
                }
            });
        }, observerOptions);

        // Observe each section individually
        sections.forEach((section, index) => {
            try {
                sectionObserver.observe(section);
                this.log(`✅ Observing section ${index + 1}: ${section.dataset.section}`);
            } catch (error) {
                this.log(`❌ Error observing section ${index + 1}:`, error);
            }
        });

        this.log(`Section visibility tracking initialized for ${sections.length} sections`);
        
        // Store reference to observer for potential cleanup
        this.sectionObserver = sectionObserver;
    }

    /**
     * Setup card click tracking
     */
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
                    category: cardData.category,
                    position: cardData.position,
                    section: cardData.section,
                    hasImage: cardData.hasImage
                });
                
                this.updateStatus(`Card Click: ${cardData.title}`);
                
                // Let the default action (link navigation) continue
            }, { passive: true });
        });

        this.log(`Card click tracking initialized for ${cards.length} cards`);
    }

    /**
     * Extract data from a card element
     */
    extractCardData(card, index) {
        const titleElement = card.querySelector('.card-title, h1, h2, h3, h4, h5, h6');
        const linkElement = card.querySelector('a');
        const categoryElement = card.querySelector('.category-pill, .category');
        const imageElement = card.querySelector('.card-image, img');
        
        // Find the section this card belongs to
        const closestSection = card.closest('[data-section]');
        
        return {
            title: titleElement?.textContent?.trim() || `Card ${index + 1}`,
            link: linkElement?.href || 'no-link',
            category: categoryElement?.textContent?.trim() || 'uncategorized',
            position: index + 1,
            section: closestSection?.dataset.section || 'unknown-section',
            hasImage: !!imageElement
        };
    }

    /**
     * Send event to GoatCounter
     */
    sendEvent(eventName, eventValue, additionalData = {}) {
        // If GoatCounter isn't ready, queue the event
        if (!this.isGoatCounterReady) {
            this.eventQueue.push({ name: eventName, value: eventValue, data: additionalData });
            this.log('GoatCounter not ready, queuing event:', eventName, eventValue);
            return;
        }

        try {
            // Clean the event value for URL-safe path
            const cleanEventValue = String(eventValue).replace(/[^a-zA-Z0-9-._~]/g, '-');
            
            // GoatCounter event tracking
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

    /**
     * Public method to manually track custom events
     */
    trackCustomEvent(eventName, eventValue, additionalData = {}) {
        this.sendEvent(eventName, eventValue, additionalData);
    }

    /**
     * Public method to get current tracking state
     */
    getTrackingState() {
        return {
            isReady: this.isGoatCounterReady,
            scrollDepthTracked: Array.from(this.scrollDepthTracked),
            sectionsTracked: Array.from(this.sectionsTracked),
            queuedEvents: this.eventQueue.length,
            sectionsFound: document.querySelectorAll('[data-section]').length,
            cardsFound: document.querySelectorAll('.card').length
        };
    }

    /**
     * Public method to reset tracking state (useful for testing)
     */
    resetTrackingState() {
        this.scrollDepthTracked.clear();
        this.sectionsTracked.clear();
        this.log('Tracking state reset');
    }

    /**
     * Public method to manually trigger section detection
     */
    recheckSections() {
        if (this.sectionObserver) {
            this.sectionObserver.disconnect();
        }
        this.setupSectionVisibilityTracking();
        this.log('Section tracking reinitialized');
    }

    /**
     * Cleanup method
     */
    destroy() {
        if (this.sectionObserver) {
            this.sectionObserver.disconnect();
        }
        // Remove event listeners would go here if we stored references
        this.log('GoatCounter tracker destroyed');
    }
}

// Auto-initialize when DOM is ready
function initializeGoatCounterTracking(options = {}) {
    if (typeof window !== 'undefined') {
        const tracker = new GoatCounterTracker(options);
        
        // Make tracker globally accessible for custom tracking
        window.goatCounterTracker = tracker;
        
        return tracker;
    }
}

// Initialize automatically when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeGoatCounterTracking();
    });
} else {
    initializeGoatCounterTracking();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoatCounterTracker, initializeGoatCounterTracking };
}