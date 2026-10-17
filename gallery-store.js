/**
 * Bank Shot It - Gallery Data Store
 * Handles categorized photo persistence using IndexedDB (with localStorage fallback).
 * Supports categories: birthday, wedding, concert, lifestyle, home
 */

(function (global) {
    const DB_NAME = 'BankShotGalleryDB';
    const DB_VERSION = 2;
    const STORE_NAME = 'photos';

    // Default categorized images that came with the website (stored in image/ directory)
    const DEFAULT_CATALOG = [
        // Birthday Category
        { id: 'bday_0', category: 'birthday', url: './image/BirthdayPic.jpg', title: 'Birthday Portrait 1', isDefault: true, createdAt: 1700000001000 },
        { id: 'bday_1', category: 'birthday', url: './image/BirthdayPic1.jpg', title: 'Birthday Celebration 2', isDefault: true, createdAt: 1700000002000 },
        { id: 'bday_2', category: 'birthday', url: './image/BirthdayPic2.jpg', title: 'Birthday Shoot 3', isDefault: true, createdAt: 1700000003000 },
        { id: 'bday_3', category: 'birthday', url: './image/BirthdayPic3.jpg', title: 'Birthday Glamour 4', isDefault: true, createdAt: 1700000004000 },
        { id: 'bday_4', category: 'birthday', url: './image/BirthdayPic4.jpg', title: 'Birthday Candid 5', isDefault: true, createdAt: 1700000005000 },
        { id: 'bday_5', category: 'birthday', url: './image/BirthdayPic5.jpg', title: 'Birthday Joy 6', isDefault: true, createdAt: 1700000006000 },
        { id: 'bday_6', category: 'birthday', url: './image/BirthdayPic6.jpg', title: 'Birthday Smile 7', isDefault: true, createdAt: 1700000007000 },
        { id: 'bday_7', category: 'birthday', url: './image/BirthdayPic7.jpg', title: 'Birthday Glow 8', isDefault: true, createdAt: 1700000008000 },
        { id: 'bday_8', category: 'birthday', url: './image/BirthdayPic8.jpg', title: 'Birthday Style 9', isDefault: true, createdAt: 1700000009000 },
        { id: 'bday_9', category: 'birthday', url: './image/BirthdayPic9.jpg', title: 'Birthday Golden Hour 10', isDefault: true, createdAt: 1700000010000 },
        { id: 'bday_10', category: 'birthday', url: './image/BirthdayPic10.jpg', title: 'Birthday Elegance 11', isDefault: true, createdAt: 1700000011000 },

        // Wedding Category
        { id: 'wed_0', category: 'wedding', url: './image/WeddingPic.jpg', title: 'Wedding Day 1', isDefault: true, createdAt: 1700000020000 },
        { id: 'wed_1', category: 'wedding', url: './image/WeddingPic1.jpg', title: 'Couple Romance 2', isDefault: true, createdAt: 1700000021000 },
        { id: 'wed_2', category: 'wedding', url: './image/WeddingPic2.jpg', title: 'Bridal Ceremony 3', isDefault: true, createdAt: 1700000022000 },
        { id: 'wed_3', category: 'wedding', url: './image/WeddingPic3.jpg', title: 'Wedding Reception 4', isDefault: true, createdAt: 1700000023000 },
        { id: 'wed_4', category: 'wedding', url: './image/WeddingPic4.jpg', title: 'Groom & Bride 5', isDefault: true, createdAt: 1700000024000 },
        { id: 'wed_5', category: 'wedding', url: './image/WeddingPic5.jpg', title: 'Wedding Moments 6', isDefault: true, createdAt: 1700000025000 },
        { id: 'wed_6', category: 'wedding', url: './image/WeddingPic6.jpg', title: 'Wedding Ring Exchange 7', isDefault: true, createdAt: 1700000026000 },
        { id: 'wed_7', category: 'wedding', url: './image/WeddingPic7.jpg', title: 'Traditional Wedding 8', isDefault: true, createdAt: 1700000027000 },
        { id: 'wed_8', category: 'wedding', url: './image/WeddingPic8.jpg', title: 'Celebration Dance 9', isDefault: true, createdAt: 1700000028000 },
        { id: 'wed_9', category: 'wedding', url: './image/WeddingPic9.jpg', title: 'Wedding Smiles 10', isDefault: true, createdAt: 1700000029000 },
        { id: 'wed_10', category: 'wedding', url: './image/WeddingPic10.jpg', title: 'Wedding Toast 11', isDefault: true, createdAt: 1700000030000 },
        { id: 'wed_11', category: 'wedding', url: './image/WeddingPic11.jpg', title: 'Wedding Memories 12', isDefault: true, createdAt: 1700000031000 },
        { id: 'wed_12', category: 'wedding', url: './image/WeddingPic12.jpg', title: 'Romantic Kiss 13', isDefault: true, createdAt: 1700000032000 },
        { id: 'wed_13', category: 'wedding', url: './image/WeddingPic13.jpg', title: 'Bridal Elegance 14', isDefault: true, createdAt: 1700000033000 },
        { id: 'wed_14', category: 'wedding', url: './image/WeddingPic14.jpg', title: 'Wedding Bliss 15', isDefault: true, createdAt: 1700000034000 },

        // Concert Category
        { id: 'con_0', category: 'concert', url: './image/ConcertPic.jpg', title: 'Concert Stage 1', isDefault: true, createdAt: 1700000040000 },
        { id: 'con_1', category: 'concert', url: './image/ConcertPic1.jpg', title: 'Live Performance 2', isDefault: true, createdAt: 1700000041000 },
        { id: 'con_2', category: 'concert', url: './image/ConcertPic2.jpg', title: 'Crowd Energy 3', isDefault: true, createdAt: 1700000042000 },
        { id: 'con_3', category: 'concert', url: './image/ConcertPic3.jpg', title: 'Stage Lights 4', isDefault: true, createdAt: 1700000043000 },
        { id: 'con_4', category: 'concert', url: './image/ConcertPic4.jpg', title: 'Artist In Focus 5', isDefault: true, createdAt: 1700000044000 },
        { id: 'con_5', category: 'concert', url: './image/ConcertPic5.jpg', title: 'Live Vibes 6', isDefault: true, createdAt: 1700000045000 },
        { id: 'con_6', category: 'concert', url: './image/ConcertPic6.jpg', title: 'Concert Night 7', isDefault: true, createdAt: 1700000046000 },
        { id: 'con_7', category: 'concert', url: './image/ConcertPic7.jpg', title: 'Music Festival 8', isDefault: true, createdAt: 1700000047000 },
        { id: 'con_8', category: 'concert', url: './image/ConcertPic8.jpg', title: 'Stage Passion 9', isDefault: true, createdAt: 1700000048000 },
        { id: 'con_9', category: 'concert', url: './image/ConcertPic9.jpg', title: 'Electric Night 10', isDefault: true, createdAt: 1700000049000 },
        { id: 'con_10', category: 'concert', url: './image/ConcertPic10.jpg', title: 'Spotlight Show 11', isDefault: true, createdAt: 1700000050000 },
        { id: 'con_11', category: 'concert', url: './image/ConcertPic11.jpg', title: 'Crowd Roar 12', isDefault: true, createdAt: 1700000051000 },
        { id: 'con_12', category: 'concert', url: './image/ConcertPic12.jpg', title: 'Finale Performance 13', isDefault: true, createdAt: 1700000052000 },

        // Lifestyle Category
        { id: 'life_0', category: 'lifestyle', url: './image/Lifestyle.jpg', title: 'Urban Lifestyle 1', isDefault: true, createdAt: 1700000060000 },
        { id: 'life_1', category: 'lifestyle', url: './image/Lifestyle1.jpg', title: 'Casual Portrait 2', isDefault: true, createdAt: 1700000061000 },
        { id: 'life_2', category: 'lifestyle', url: './image/Lifestyle2.jpg', title: 'Street Style 3', isDefault: true, createdAt: 1700000062000 },
        { id: 'life_3', category: 'lifestyle', url: './image/Lifestyle3.jpg', title: 'Modern Aesthetic 4', isDefault: true, createdAt: 1700000063000 },
        { id: 'life_4', category: 'lifestyle', url: './image/Lifestyle4.jpg', title: 'Golden Hour 5', isDefault: true, createdAt: 1700000064000 },
        { id: 'life_5', category: 'lifestyle', url: './image/Lifestyle5.jpg', title: 'City Atmosphere 6', isDefault: true, createdAt: 1700000065000 },
        { id: 'life_6', category: 'lifestyle', url: './image/Lifestyle6.jpg', title: 'Creative Session 7', isDefault: true, createdAt: 1700000066000 },
        { id: 'life_7', category: 'lifestyle', url: './image/Lifestyle7.jpg', title: 'Candid Mood 8', isDefault: true, createdAt: 1700000067000 },
        { id: 'life_8', category: 'lifestyle', url: './image/Lifestyle8.jpg', title: 'Warm Tones 9', isDefault: true, createdAt: 1700000068000 },
        { id: 'life_9', category: 'lifestyle', url: './image/Lifestyle9.jpg', title: 'Urban Elegance 10', isDefault: true, createdAt: 1700000069000 },
        { id: 'life_10', category: 'lifestyle', url: './image/Lifestyle10.jpg', title: 'Street Elegance 11', isDefault: true, createdAt: 1700000070000 },
        { id: 'life_11', category: 'lifestyle', url: './image/Lifestyle11.jpg', title: 'Everyday Moments 12', isDefault: true, createdAt: 1700000071000 },
        { id: 'life_12', category: 'lifestyle', url: './image/Lifestyle12.jpg', title: 'Natural Glow 13', isDefault: true, createdAt: 1700000072000 },

        // Home Highlights Category
        { id: 'home_0', category: 'home', url: './image/Faruq1.jpg', title: 'Bank Shot Showcase 1', isDefault: true, createdAt: 1700000080000 },
        { id: 'home_1', category: 'home', url: './image/Faruq2.jpg', title: 'Bank Shot Showcase 2', isDefault: true, createdAt: 1700000081000 },
        { id: 'home_2', category: 'home', url: './image/Faruq3.jpg', title: 'Bank Shot Showcase 3', isDefault: true, createdAt: 1700000082000 },
        { id: 'home_3', category: 'home', url: './image/Faruq4.jpg', title: 'Bank Shot Showcase 4', isDefault: true, createdAt: 1700000083000 }
    ];

    // BroadcastChannel for instant cross-tab sync
    let syncChannel = null;
    try {
        if ('BroadcastChannel' in global) {
            syncChannel = new BroadcastChannel('bankshot_gallery_sync');
        }
    } catch (e) {
        // fallback
    }

    class GalleryStore {
        constructor() {
            this.dbPromise = this.initDB();
            if (syncChannel) {
                syncChannel.onmessage = (event) => {
                    if (event && event.data && event.data.type === 'REFRESH') {
                        this.notifyListeners(event.data.category);
                    }
                };
            }
        }

        initDB() {
            return new Promise((resolve) => {
                if (!('indexedDB' in global)) {
                    console.warn('IndexedDB not supported, falling back to localStorage');
                    resolve(null);
                    return;
                }

                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                        store.createIndex('category', 'category', { unique: false });
                        store.createIndex('createdAt', 'createdAt', { unique: false });
                    }
                };

                request.onsuccess = async (event) => {
                    const db = event.target.result;
                    // Check if initial seeding is needed
                    await this.seedDefaultsIfNeeded(db);
                    resolve(db);
                };

                request.onerror = (err) => {
                    console.error('IndexedDB open error:', err);
                    resolve(null);
                };
            });
        }

        async seedDefaultsIfNeeded(db) {
            if (!db) return;
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const countReq = store.count();

                countReq.onsuccess = () => {
                    const hasV2Migrated = localStorage.getItem('bankshot_image_dir_v2');
                    if (countReq.result === 0 || !hasV2Migrated) {
                        const writeTx = db.transaction(STORE_NAME, 'readwrite');
                        const writeStore = writeTx.objectStore(STORE_NAME);
                        DEFAULT_CATALOG.forEach(item => {
                            writeStore.put({ ...item });
                        });
                        writeTx.oncomplete = () => {
                            localStorage.setItem('bankshot_image_dir_v2', 'true');
                            localStorage.setItem('bankshot_db_seeded', 'true');
                            resolve();
                        };
                        writeTx.onerror = () => resolve();
                    } else {
                        resolve();
                    }
                };

                countReq.onerror = () => resolve();
            });
        }

        // LocalStorage fallback helper
        getLocalStorageItems() {
            try {
                const raw = localStorage.getItem('bankshot_photos_backup');
                if (!raw) {
                    localStorage.setItem('bankshot_photos_backup', JSON.stringify(DEFAULT_CATALOG));
                    return [...DEFAULT_CATALOG];
                }
                return JSON.parse(raw);
            } catch (e) {
                return [...DEFAULT_CATALOG];
            }
        }

        setLocalStorageItems(items) {
            try {
                localStorage.setItem('bankshot_photos_backup', JSON.stringify(items));
            } catch (e) {
                console.warn('LocalStorage save failed:', e);
            }
        }

        async getAll() {
            const db = await this.dbPromise;
            if (!db) {
                return this.getLocalStorageItems().sort((a, b) => b.createdAt - a.createdAt);
            }

            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.getAll();

                req.onsuccess = () => {
                    const items = req.result || [];
                    // Return sorted newest first
                    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    resolve(items);
                };

                req.onerror = () => {
                    resolve(this.getLocalStorageItems());
                };
            });
        }

        async getByCategory(category) {
            const normalized = (category || '').toLowerCase().trim();
            const all = await this.getAll();
            if (!normalized || normalized === 'all') {
                return all;
            }
            return all.filter(item => (item.category || '').toLowerCase().trim() === normalized);
        }

        async add({ category, url, title, isDefault = false }) {
            if (!url) throw new Error('Image URL or Data is required');
            const cleanCategory = (category || 'lifestyle').toLowerCase().trim();

            const newPhoto = {
                id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                category: cleanCategory,
                url: url,
                title: (title || '').trim() || `${cleanCategory.charAt(0).toUpperCase() + cleanCategory.slice(1)} Photo`,
                isDefault: !!isDefault,
                createdAt: Date.now()
            };

            const db = await this.dbPromise;
            if (!db) {
                const items = this.getLocalStorageItems();
                items.unshift(newPhoto);
                this.setLocalStorageItems(items);
                this.notifyChange(cleanCategory);
                return newPhoto;
            }

            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.add(newPhoto);

                req.onsuccess = () => {
                    this.notifyChange(cleanCategory);
                    resolve(newPhoto);
                };

                req.onerror = (e) => {
                    reject(e.target.error || new Error('Failed to save image in database'));
                };
            });
        }

        async delete(id) {
            if (!id) return false;
            const db = await this.dbPromise;

            // Find item first to know its category for notification
            const all = await this.getAll();
            const item = all.find(p => p.id === id);
            const category = item ? item.category : 'all';

            if (!db) {
                const items = this.getLocalStorageItems().filter(p => p.id !== id);
                this.setLocalStorageItems(items);
                this.notifyChange(category);
                return true;
            }

            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.delete(id);

                req.onsuccess = () => {
                    this.notifyChange(category);
                    resolve(true);
                };

                req.onerror = () => {
                    resolve(false);
                };
            });
        }

        async updateCategory(id, newCategory) {
            if (!id || !newCategory) return false;
            const cleanCategory = newCategory.toLowerCase().trim();
            const db = await this.dbPromise;

            if (!db) {
                const items = this.getLocalStorageItems();
                const target = items.find(p => p.id === id);
                if (target) {
                    target.category = cleanCategory;
                    this.setLocalStorageItems(items);
                    this.notifyChange(cleanCategory);
                    return true;
                }
                return false;
            }

            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const getReq = store.get(id);

                getReq.onsuccess = () => {
                    const photo = getReq.result;
                    if (!photo) return resolve(false);

                    photo.category = cleanCategory;
                    const putReq = store.put(photo);
                    putReq.onsuccess = () => {
                        this.notifyChange(cleanCategory);
                        resolve(true);
                    };
                    putReq.onerror = () => resolve(false);
                };

                getReq.onerror = () => resolve(false);
            });
        }

        async resetDefaults() {
            const db = await this.dbPromise;
            if (!db) {
                this.setLocalStorageItems([...DEFAULT_CATALOG]);
                this.notifyChange('all');
                return;
            }

            return new Promise((resolve) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const clearReq = store.clear();

                clearReq.onsuccess = () => {
                    DEFAULT_CATALOG.forEach(item => {
                        store.put({ ...item });
                    });
                    tx.oncomplete = () => {
                        this.notifyChange('all');
                        resolve();
                    };
                };
                clearReq.onerror = () => resolve();
            });
        }

        async exportData() {
            const items = await this.getAll();
            return JSON.stringify({
                app: 'BankShotIt',
                version: '1.0',
                exportDate: new Date().toISOString(),
                photos: items
            }, null, 2);
        }

        async importData(jsonString) {
            try {
                const parsed = JSON.parse(jsonString);
                if (!parsed || !Array.isArray(parsed.photos)) {
                    throw new Error('Invalid JSON format for Bank Shot gallery data');
                }

                const db = await this.dbPromise;
                if (!db) {
                    this.setLocalStorageItems(parsed.photos);
                    this.notifyChange('all');
                    return true;
                }

                return new Promise((resolve, reject) => {
                    const tx = db.transaction(STORE_NAME, 'readwrite');
                    const store = tx.objectStore(STORE_NAME);
                    store.clear();

                    parsed.photos.forEach(item => {
                        store.put(item);
                    });

                    tx.oncomplete = () => {
                        this.notifyChange('all');
                        resolve(true);
                    };

                    tx.onerror = (e) => reject(e);
                });
            } catch (e) {
                console.error('Import failed:', e);
                throw e;
            }
        }

        notifyChange(category) {
            this.notifyListeners(category);
            if (syncChannel) {
                try {
                    syncChannel.postMessage({ type: 'REFRESH', category: category });
                } catch (e) { }
            }
        }

        notifyListeners(category) {
            const event = new CustomEvent('bankshot:gallery-changed', {
                detail: { category: category }
            });
            global.dispatchEvent(event);
        }
    }

    // Expose global singleton
    global.BankShotGallery = new GalleryStore();
})(window);
