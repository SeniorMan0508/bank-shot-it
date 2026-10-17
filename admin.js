/**
 * Bank Shot It - Admin Studio Controller
 * Handles photo uploads, categorized assignments, image removal, compression, and PIN security.
 */

(function () {
    // State
    let allPhotos = [];
    let currentFilter = 'all';
    let searchQuery = '';
    let selectedFilesToUpload = []; // Array of { file, dataUrl, title }
    let deleteTargetId = null;
    let moveTargetId = null;

    // Default PIN is 1234 (can be changed in settings)
    const DEFAULT_PIN = '1234';

    function getAdminPin() {
        return localStorage.getItem('bankshot_admin_pin') || DEFAULT_PIN;
    }

    // Check Authentication
    function checkAuth() {
        const isAuth = sessionStorage.getItem('bankshot_admin_logged_in') === 'true';
        const gate = document.getElementById('pin-gate-modal');
        if (!isAuth) {
            gate.classList.add('active');
            document.getElementById('pin-input').focus();
        } else {
            gate.classList.remove('active');
            initDashboard();
        }
    }

    function setupAuthEvents() {
        const pinInput = document.getElementById('pin-input');
        const pinSubmitBtn = document.getElementById('pin-submit-btn');
        const pinError = document.getElementById('pin-error');
        const logoutBtn = document.getElementById('admin-logout-btn');

        function verifyPin() {
            const entered = (pinInput.value || '').trim();
            if (entered === getAdminPin()) {
                sessionStorage.setItem('bankshot_admin_logged_in', 'true');
                document.getElementById('pin-gate-modal').classList.remove('active');
                pinError.style.display = 'none';
                pinInput.value = '';
                showToast('Welcome Back', 'Admin Studio access granted.');
                initDashboard();
            } else {
                pinError.style.display = 'block';
                pinInput.value = '';
                pinInput.focus();
            }
        }

        pinSubmitBtn.addEventListener('click', verifyPin);
        pinInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verifyPin();
        });

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                sessionStorage.removeItem('bankshot_admin_logged_in');
                location.reload();
            });
        }
    }

    // Toast Notification System
    function showToast(title, message, isDanger = false) {
        const toast = document.getElementById('admin-toast');
        const titleEl = document.getElementById('toast-title');
        const msgEl = document.getElementById('toast-msg');
        const iconEl = document.getElementById('toast-icon');

        titleEl.textContent = title;
        msgEl.textContent = message;
        iconEl.innerHTML = isDanger ? '&#9888;' : '&#10004;';
        toast.style.borderColor = isDanger ? 'var(--danger)' : 'var(--border-gold)';

        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3500);
    }

    // Compression utility using HTML5 Canvas to keep IndexedDB light and fast
    function compressImageFile(file, maxWidth = 1920, maxHeight = 1920, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxHeight) {
                        if (width / height > maxWidth / maxHeight) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        } else {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedDataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    // Setup Category Radio Chips & Dropdown Sync
    function setupCategoryControls() {
        const categorySelect = document.getElementById('photo-category-select');
        const chips = document.querySelectorAll('.category-chip');

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const cat = chip.dataset.category;
                categorySelect.value = cat;
                updateSelectedCategoryDisplay(cat);
            });
        });

        categorySelect.addEventListener('change', () => {
            const cat = categorySelect.value;
            chips.forEach(c => {
                if (c.dataset.category === cat) {
                    c.classList.add('active');
                } else {
                    c.classList.remove('active');
                }
            });
            updateSelectedCategoryDisplay(cat);
        });
    }

    function updateSelectedCategoryDisplay(cat) {
        const btnText = document.getElementById('submit-btn-text');
        const catMap = {
            birthday: 'Birthday Gallery (Birthday.html)',
            wedding: 'Wedding Gallery (Wedding.html)',
            concert: 'Concert Gallery (Concert.html)',
            lifestyle: 'Lifestyle Gallery (Portfolio.html)',
            home: 'Home Highlights (index.html)'
        };
        if (btnText) {
            btnText.textContent = `Publish to ${catMap[cat] || cat}`;
        }
    }

    // Setup Upload Switcher (File vs URL) & Dropzone
    function setupUploadModes() {
        const tabFile = document.getElementById('tab-upload-file');
        const tabUrl = document.getElementById('tab-upload-url');
        const modeFile = document.getElementById('upload-mode-file');
        const modeUrl = document.getElementById('upload-mode-url');

        tabFile.addEventListener('click', () => {
            tabFile.classList.add('active');
            tabUrl.classList.remove('active');
            modeFile.style.display = 'block';
            modeUrl.style.display = 'none';
        });

        tabUrl.addEventListener('click', () => {
            tabUrl.classList.add('active');
            tabFile.classList.remove('active');
            modeFile.style.display = 'none';
            modeUrl.style.display = 'block';
        });

        // Dropzone interactions
        const dropzone = document.getElementById('file-dropzone');
        const fileInput = document.getElementById('file-input');
        const previewBox = document.getElementById('preview-box');
        const previewImg = document.getElementById('preview-img');
        const previewMeta = document.getElementById('preview-meta');
        const removePreviewBtn = document.getElementById('preview-remove');

        ['dragenter', 'dragover'].forEach(name => {
            dropzone.addEventListener(name, (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(name => {
            dropzone.addEventListener(name, (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files.length) {
                handleFilesSelected(Array.from(e.dataTransfer.files));
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files.length) {
                handleFilesSelected(Array.from(fileInput.files));
            }
        });

        removePreviewBtn.addEventListener('click', () => {
            selectedFilesToUpload = [];
            fileInput.value = '';
            previewBox.classList.remove('active');
        });

        // URL input live preview
        const urlInput = document.getElementById('photo-url-input');
        urlInput.addEventListener('input', () => {
            const url = urlInput.value.trim();
            if (url) {
                previewImg.src = url;
                previewMeta.textContent = 'Remote Web URL';
                previewBox.classList.add('active');
            } else {
                previewBox.classList.remove('active');
            }
        });
    }

    async function handleFilesSelected(files) {
        selectedFilesToUpload = [];
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (!imageFiles.length) {
            showToast('Invalid File', 'Please select valid image files (JPG, PNG, WebP).', true);
            return;
        }

        const previewBox = document.getElementById('preview-box');
        const previewImg = document.getElementById('preview-img');
        const previewMeta = document.getElementById('preview-meta');

        // Process first file for immediate preview
        const firstFile = imageFiles[0];
        try {
            previewMeta.textContent = 'Optimizing photo...';
            previewBox.classList.add('active');

            const compressed = await compressImageFile(firstFile);
            previewImg.src = compressed;

            if (imageFiles.length === 1) {
                previewMeta.textContent = `${firstFile.name} (${Math.round(firstFile.size / 1024)} KB)`;
                selectedFilesToUpload.push({
                    file: firstFile,
                    dataUrl: compressed,
                    name: firstFile.name
                });
            } else {
                previewMeta.textContent = `${imageFiles.length} photos selected (${firstFile.name} + ${imageFiles.length - 1} more)`;
                selectedFilesToUpload.push({
                    file: firstFile,
                    dataUrl: compressed,
                    name: firstFile.name
                });

                // Compress the rest in background
                for (let i = 1; i < imageFiles.length; i++) {
                    const extra = imageFiles[i];
                    const comp = await compressImageFile(extra);
                    selectedFilesToUpload.push({
                        file: extra,
                        dataUrl: comp,
                        name: extra.name
                    });
                }
            }
        } catch (e) {
            console.error('File compression error:', e);
            showToast('Compression Error', 'Could not process image file.', true);
        }
    }

    // Submit / Add Photo
    function setupSubmitForm() {
        const submitBtn = document.getElementById('btn-submit-photo');
        const categorySelect = document.getElementById('photo-category-select');
        const titleInput = document.getElementById('photo-title-input');
        const urlInput = document.getElementById('photo-url-input');
        const fileInput = document.getElementById('file-input');
        const previewBox = document.getElementById('preview-box');

        submitBtn.addEventListener('click', async () => {
            const category = categorySelect.value;
            const customTitle = (titleInput.value || '').trim();

            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>&#8987;</span> Publishing...`;

            try {
                // If files were uploaded
                if (selectedFilesToUpload.length > 0) {
                    for (let i = 0; i < selectedFilesToUpload.length; i++) {
                        const item = selectedFilesToUpload[i];
                        const title = customTitle || (selectedFilesToUpload.length > 1 ? `${customTitle || category.toUpperCase()} #${i + 1}` : item.name.replace(/\.[^/.]+$/, ''));
                        await window.BankShotGallery.add({
                            category: category,
                            url: item.dataUrl,
                            title: title
                        });
                    }
                    showToast('Success!', `${selectedFilesToUpload.length} photo(s) published to ${category.toUpperCase()} gallery.`);
                } else if (urlInput.value.trim()) {
                    // Direct URL mode
                    const url = urlInput.value.trim();
                    await window.BankShotGallery.add({
                        category: category,
                        url: url,
                        title: customTitle || `${category.toUpperCase()} Photo`
                    });
                    showToast('Success!', `Photo published to ${category.toUpperCase()} gallery.`);
                } else {
                    showToast('Missing Photo', 'Please choose a photo file or enter an image URL.', true);
                    submitBtn.disabled = false;
                    updateSelectedCategoryDisplay(category);
                    return;
                }

                // Reset form
                selectedFilesToUpload = [];
                fileInput.value = '';
                urlInput.value = '';
                titleInput.value = '';
                previewBox.classList.remove('active');

                // Reload data
                await loadAllData();
            } catch (err) {
                console.error('Save photo error:', err);
                showToast('Error', 'Failed to save photo: ' + err.message, true);
            } finally {
                submitBtn.disabled = false;
                updateSelectedCategoryDisplay(category);
            }
        });
    }

    // Load data and refresh metrics & grid
    async function loadAllData() {
        if (!window.BankShotGallery) return;

        allPhotos = await window.BankShotGallery.getAll();
        updateMetrics();
        renderManageGrid();
    }

    // Metrics calculation
    function updateMetrics() {
        const counts = {
            total: allPhotos.length,
            birthday: 0,
            wedding: 0,
            concert: 0,
            lifestyle: 0,
            home: 0
        };

        allPhotos.forEach(p => {
            const c = (p.category || '').toLowerCase();
            if (counts[c] !== undefined) {
                counts[c]++;
            }
        });

        document.getElementById('metric-total').textContent = counts.total;
        document.getElementById('metric-birthday').textContent = counts.birthday;
        document.getElementById('metric-wedding').textContent = counts.wedding;
        document.getElementById('metric-concert').textContent = counts.concert;
        document.getElementById('metric-lifestyle').textContent = counts.lifestyle;
        document.getElementById('metric-home').textContent = counts.home;

        // Update counts in filter tab badges
        document.getElementById('tab-count-all').textContent = counts.total;
        document.getElementById('tab-count-birthday').textContent = counts.birthday;
        document.getElementById('tab-count-wedding').textContent = counts.wedding;
        document.getElementById('tab-count-concert').textContent = counts.concert;
        document.getElementById('tab-count-lifestyle').textContent = counts.lifestyle;
        document.getElementById('tab-count-home').textContent = counts.home;
    }

    // Render Manage Grid
    function renderManageGrid() {
        const grid = document.getElementById('manage-grid');
        grid.innerHTML = '';

        let filtered = allPhotos;

        // Filter by category
        if (currentFilter !== 'all') {
            filtered = filtered.filter(p => (p.category || '').toLowerCase() === currentFilter);
        }

        // Filter by search query
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                (p.title || '').toLowerCase().includes(q) ||
                (p.category || '').toLowerCase().includes(q)
            );
        }

        if (!filtered.length) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                    <div style="font-size: 38px; margin-bottom: 10px;">&#128269;</div>
                    <h4>No Photos Found</h4>
                    <p style="font-size: 13px; margin-top: 4px;">No photos match the selected category or search query.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(photo => {
            const card = document.createElement('div');
            card.className = 'manage-card';
            card.dataset.id = photo.id;

            const categoryClass = `pill-${photo.category}`;
            const formattedDate = photo.createdAt ? new Date(photo.createdAt).toLocaleDateString() : 'Original Shoot';

            card.innerHTML = `
                <div class="manage-thumb">
                    <img src="${photo.url}" alt="${photo.title || 'Photo'}" loading="lazy" />
                    <span class="manage-category-pill ${categoryClass}">${photo.category.toUpperCase()}</span>
                </div>
                <div class="manage-details">
                    <div class="manage-photo-title" title="${photo.title || 'Photo'}">${photo.title || 'Untitled Photo'}</div>
                    <div class="manage-photo-date">${formattedDate} ${photo.isDefault ? '• (Default)' : ''}</div>
                    <div class="manage-card-actions">
                        <button class="btn-card-action btn-card-view" data-action="view" title="Preview Fullscreen">&#128065; View</button>
                        <button class="btn-card-action btn-card-move" data-action="move" title="Change Category">&#8646; Move</button>
                        <button class="btn-card-action btn-card-delete" data-action="delete" title="Remove Photo">&#128465; Delete</button>
                    </div>
                </div>
            `;

            // Card Action Buttons
            card.querySelector('[data-action="view"]').addEventListener('click', () => {
                openPreviewModal(photo);
            });

            card.querySelector('[data-action="move"]').addEventListener('click', () => {
                openMoveCategoryModal(photo);
            });

            card.querySelector('[data-action="delete"]').addEventListener('click', () => {
                openDeleteModal(photo);
            });

            grid.appendChild(card);
        });
    }

    // Filter Tabs and Search Events
    function setupFilterToolbar() {
        const tabs = document.querySelectorAll('.category-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentFilter = tab.dataset.filter;
                renderManageGrid();
            });
        });

        // Also clicking on Metric Cards filters the grid!
        const metricCards = document.querySelectorAll('.metric-card');
        metricCards.forEach(mc => {
            mc.addEventListener('click', () => {
                const cat = mc.dataset.category;
                currentFilter = cat;
                tabs.forEach(t => {
                    if (t.dataset.filter === cat) t.classList.add('active');
                    else t.classList.remove('active');
                });
                renderManageGrid();
                document.getElementById('manage-section').scrollIntoView({ behavior: 'smooth' });
            });
        });

        const searchInput = document.getElementById('manage-search-input');
        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value.trim();
            renderManageGrid();
        });
    }

    // Full Preview Lightbox in Admin
    function openPreviewModal(photo) {
        const modal = document.getElementById('admin-preview-modal');
        const img = document.getElementById('admin-preview-img');
        const title = document.getElementById('admin-preview-title');
        const meta = document.getElementById('admin-preview-meta');

        img.src = photo.url;
        title.textContent = photo.title || 'Photo Preview';
        meta.textContent = `Category: ${photo.category.toUpperCase()}`;

        modal.classList.add('active');
    }

    // Delete Confirmation Modal
    function openDeleteModal(photo) {
        deleteTargetId = photo.id;
        const modal = document.getElementById('delete-modal');
        const desc = document.getElementById('delete-modal-desc');
        desc.textContent = `Are you sure you want to remove "${photo.title || 'this photo'}" from the ${photo.category.toUpperCase()} gallery? This cannot be undone.`;
        modal.classList.add('active');
    }

    function setupDeleteModalEvents() {
        const modal = document.getElementById('delete-modal');
        const cancelBtn = document.getElementById('delete-cancel-btn');
        const confirmBtn = document.getElementById('delete-confirm-btn');

        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            deleteTargetId = null;
        });

        confirmBtn.addEventListener('click', async () => {
            if (!deleteTargetId) return;
            try {
                await window.BankShotGallery.delete(deleteTargetId);
                showToast('Removed', 'Photo has been deleted from the gallery.', true);
                modal.classList.remove('active');
                deleteTargetId = null;
                await loadAllData();
            } catch (e) {
                console.error('Delete error:', e);
                showToast('Error', 'Failed to delete photo', true);
            }
        });
    }

    // Move Category Modal
    function openMoveCategoryModal(photo) {
        moveTargetId = photo.id;
        const modal = document.getElementById('move-modal');
        const select = document.getElementById('move-category-select');
        select.value = photo.category;
        modal.classList.add('active');
    }

    function setupMoveModalEvents() {
        const modal = document.getElementById('move-modal');
        const cancelBtn = document.getElementById('move-cancel-btn');
        const confirmBtn = document.getElementById('move-confirm-btn');
        const select = document.getElementById('move-category-select');

        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            moveTargetId = null;
        });

        confirmBtn.addEventListener('click', async () => {
            if (!moveTargetId) return;
            const newCat = select.value;
            try {
                await window.BankShotGallery.updateCategory(moveTargetId, newCat);
                showToast('Updated', `Photo successfully moved to ${newCat.toUpperCase()} gallery.`);
                modal.classList.remove('active');
                moveTargetId = null;
                await loadAllData();
            } catch (e) {
                console.error('Move error:', e);
                showToast('Error', 'Failed to change category', true);
            }
        });
    }

    // Studio Settings, Backup & Restore
    function setupSettingsModalEvents() {
        const settingsBtn = document.getElementById('admin-settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeBtn = document.getElementById('settings-close-btn');

        const btnExport = document.getElementById('btn-export-backup');
        const btnImportTrigger = document.getElementById('btn-import-trigger');
        const importFileInput = document.getElementById('import-file-input');
        const btnResetDefaults = document.getElementById('btn-reset-defaults');
        const btnChangePin = document.getElementById('btn-change-pin');
        const newPinInput = document.getElementById('new-pin-input');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
        }

        // Export JSON Backup
        btnExport.addEventListener('click', async () => {
            const jsonStr = await window.BankShotGallery.exportData();
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bankshot_gallery_backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Backup Exported', 'Gallery backup saved to your downloads.');
        });

        // Import Backup
        btnImportTrigger.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', async () => {
            if (!importFileInput.files || !importFileInput.files.length) return;
            const file = importFileInput.files[0];
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    await window.BankShotGallery.importData(e.target.result);
                    showToast('Restore Complete', 'Gallery data successfully restored!');
                    settingsModal.classList.remove('active');
                    await loadAllData();
                } catch (err) {
                    showToast('Import Error', 'Invalid backup file format.', true);
                }
            };
            reader.readAsText(file);
        });

        // Reset to Defaults
        btnResetDefaults.addEventListener('click', async () => {
            if (confirm('Are you sure you want to restore the original photoshoot gallery defaults? Any uploaded custom photos will be replaced.')) {
                await window.BankShotGallery.resetDefaults();
                showToast('Reset Complete', 'Original photos restored to all categories.');
                settingsModal.classList.remove('active');
                await loadAllData();
            }
        });

        // Change PIN
        btnChangePin.addEventListener('click', () => {
            const val = (newPinInput.value || '').trim();
            if (val.length < 4) {
                alert('PIN must be at least 4 digits');
                return;
            }
            localStorage.setItem('bankshot_admin_pin', val);
            newPinInput.value = '';
            showToast('PIN Updated', 'New Admin PIN has been saved.');
        });
    }

    // Modal Background Clicks
    function setupModalDismissal() {
        document.querySelectorAll('.admin-modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal && modal.id !== 'pin-gate-modal') {
                    modal.classList.remove('active');
                }
            });
        });
    }

    function initDashboard() {
        setupCategoryControls();
        setupUploadModes();
        setupSubmitForm();
        setupFilterToolbar();
        setupDeleteModalEvents();
        setupMoveModalEvents();
        setupSettingsModalEvents();
        setupModalDismissal();
        loadAllData();
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupAuthEvents();
        checkAuth();
    });
})();
