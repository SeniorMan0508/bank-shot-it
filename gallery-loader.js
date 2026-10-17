/**
 * Bank Shot It - Dynamic Gallery Loader & Lightbox Controller
 * Connects frontend gallery pages (Birthday, Wedding, Concert, Lifestyle, Home) to the Gallery Store.
 */

(function () {
    let currentCategory = 'all';
    let currentPhotos = [];
    let currentLightboxIndex = 0;
    let lightboxEl = null;

    // Detect category from URL or data attribute
    function detectCategory() {
        const path = window.location.pathname.toLowerCase();
        const bodyCat = document.body.dataset.category;
        if (bodyCat) return bodyCat.toLowerCase();

        if (path.includes('birthday')) return 'birthday';
        if (path.includes('wedding')) return 'wedding';
        if (path.includes('concert')) return 'concert';
        if (path.includes('portfolio')) return 'lifestyle';
        if (path.includes('index') || path.endsWith('/') || path.endsWith('\\') || path === '') return 'home';

        return 'lifestyle'; // default gallery
    }

    // Initialize Lightbox Modal DOM
    function setupLightboxDOM() {
        if (document.getElementById('bankshot-lightbox')) {
            lightboxEl = document.getElementById('bankshot-lightbox');
            return;
        }

        lightboxEl = document.createElement('div');
        lightboxEl.id = 'bankshot-lightbox';
        lightboxEl.className = 'lightbox-modal';
        lightboxEl.setAttribute('role', 'dialog');
        lightboxEl.setAttribute('aria-modal', 'true');
        lightboxEl.innerHTML = `
            <button class="lightbox-close-btn" id="lightbox-close" aria-label="Close Lightbox">&times;</button>
            <button class="lightbox-arrow lightbox-prev" id="lightbox-prev" aria-label="Previous Photo">&#10094;</button>
            <button class="lightbox-arrow lightbox-next" id="lightbox-next" aria-label="Next Photo">&#10095;</button>
            <div class="lightbox-stage">
                <img id="lightbox-img" src="" alt="Full preview" />
            </div>
            <div class="lightbox-caption">
                <h4 id="lightbox-title">Photo Preview</h4>
                <span id="lightbox-counter">1 of 1</span>
            </div>
        `;
        document.body.appendChild(lightboxEl);

        // Bind events
        document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
        document.getElementById('lightbox-prev').addEventListener('click', prevLightbox);
        document.getElementById('lightbox-next').addEventListener('click', nextLightbox);

        lightboxEl.addEventListener('click', (e) => {
            if (e.target === lightboxEl || e.target.classList.contains('lightbox-stage')) {
                closeLightbox();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (!lightboxEl.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') prevLightbox();
            if (e.key === 'ArrowRight') nextLightbox();
        });
    }

    function openLightbox(index) {
        if (!currentPhotos.length) return;
        currentLightboxIndex = (index + currentPhotos.length) % currentPhotos.length;
        const photo = currentPhotos[currentLightboxIndex];

        const imgEl = document.getElementById('lightbox-img');
        const titleEl = document.getElementById('lightbox-title');
        const counterEl = document.getElementById('lightbox-counter');

        imgEl.src = photo.url;
        imgEl.alt = photo.title || 'Bank Shot It Photo';
        titleEl.textContent = photo.title || `${currentCategory.toUpperCase()} Photo`;
        counterEl.textContent = `${currentLightboxIndex + 1} of ${currentPhotos.length} • ${currentCategory.toUpperCase()}`;

        lightboxEl.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightboxEl) return;
        lightboxEl.classList.remove('active');
        document.body.style.overflow = '';
    }

    function prevLightbox() {
        openLightbox(currentLightboxIndex - 1);
    }

    function nextLightbox() {
        openLightbox(currentLightboxIndex + 1);
    }

    // Render Gallery
    async function renderCategoryGallery() {
        if (!window.BankShotGallery) {
            console.warn('BankShotGallery store not found');
            return;
        }

        currentCategory = detectCategory();

        // Target container
        let container = document.querySelector('.portfolio') || document.querySelector('.dynamic-gallery-grid');
        const isHomePage = currentCategory === 'home' || document.querySelector('.pic1');

        if (isHomePage) {
            container = document.querySelector('.pic1');
        }

        if (!container) return;

        // Ensure container has modern grid styles
        if (!isHomePage && !container.classList.contains('dynamic-gallery-grid')) {
            container.classList.add('dynamic-gallery-grid');
        }

        try {
            currentPhotos = await window.BankShotGallery.getByCategory(currentCategory);
        } catch (e) {
            console.error('Failed to load gallery items:', e);
            return;
        }

        // Update photo count badge in header if element exists
        const countBadge = document.getElementById('category-count-badge');
        if (countBadge) {
            countBadge.textContent = `${currentPhotos.length} Photos`;
        }

        // Handle Home Page Special Render (4 highlight photos)
        if (isHomePage) {
            container.innerHTML = '';
            const displayList = currentPhotos.slice(0, 4);
            displayList.forEach((photo, idx) => {
                const item = document.createElement('div');
                item.className = 'faq1 gallery-card-home';
                item.style.cursor = 'pointer';
                item.innerHTML = `
                    <img src="${photo.url}" alt="${photo.title || 'Bank Shot It'}" loading="lazy" style="border-radius:10px; transition: transform 0.4s ease;" />
                `;
                item.addEventListener('click', () => openLightbox(idx));
                container.appendChild(item);
            });
            return;
        }

        // Handle Standard Category Gallery Pages
        container.innerHTML = '';

        if (!currentPhotos.length) {
            container.innerHTML = `
                <div class="gallery-empty-state">
                    <div class="empty-icon">&#128247;</div>
                    <h3>New Photos Coming Soon</h3>
                    <p>Check back shortly for newly added photos in this category.</p>
                </div>
            `;
            return;
        }

        currentPhotos.forEach((photo, idx) => {
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.setAttribute('data-id', photo.id);
            card.setAttribute('tabindex', '0');
            card.innerHTML = `
                <img src="${photo.url}" alt="${photo.title || 'Bank Shot Photo'}" loading="lazy" />
                <div class="card-zoom-icon">&#128269;</div>
                <div class="gallery-card-overlay">
                    <div class="card-title">${photo.title || 'Bank Shot Shot'}</div>
                    <div class="card-tag"><span>&#128248;</span> ${photo.category.toUpperCase()}</div>
                </div>
            `;

            card.addEventListener('click', () => openLightbox(idx));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(idx);
                }
            });

            container.appendChild(card);
        });
    }

    // Secret shortcut for the owner (Ctrl+Shift+A) to open admin dashboard privately
    function setupSecretAdminShortcut() {
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
                window.location.href = 'admin.html';
            }
        });
    }

    // Highlight active nav tab if category gallery navigation exists
    function highlightActiveNav() {
        const cat = detectCategory();
        const navLinks = document.querySelectorAll('nav ul li a, .gallery-nav-bar li a');
        navLinks.forEach(link => {
            const href = (link.getAttribute('href') || '').toLowerCase();
            const li = link.closest('li');
            if (!li) return;

            if (cat === 'birthday' && href.includes('birthday')) {
                li.classList.add('active');
            } else if (cat === 'wedding' && href.includes('wedding')) {
                li.classList.add('active');
            } else if (cat === 'concert' && href.includes('concert')) {
                li.classList.add('active');
            } else if (cat === 'lifestyle' && (href.includes('portfolio') || href.includes('lifestyle'))) {
                li.classList.add('active');
            } else if (cat === 'home' && href.includes('index')) {
                li.classList.add('active');
            }
        });
    }

    // Initialize on DOM Ready
    function init() {
        setupLightboxDOM();
        renderCategoryGallery();
        highlightActiveNav();
        setupSecretAdminShortcut();

        // Listen for live database updates from Admin Dashboard
        window.addEventListener('bankshot:gallery-changed', () => {
            renderCategoryGallery();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
