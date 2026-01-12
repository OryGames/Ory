/**
 * Ory: Contra Dengue - Service Worker
 * Enables offline play and caching for PWA
 */

const CACHE_NAME = 'ory-game-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',

    // Libraries
    './lib/phaser.min.js',
    './lib/tf.min.js',

    // Game Scripts
    './js/game.js',
    './js/vision/VisionHandler.js',
    './js/logic/Interpreter.js',
    './js/entities/Robot.js',
    './js/scenes/PreloaderScene.js',
    './js/scenes/SplashScene.js',
    './js/scenes/InfoScene.js',
    './js/scenes/TitleScene.js',
    './js/scenes/OptionsScene.js',
    './js/scenes/MenuScene.js',
    './js/scenes/CutsceneScene.js',
    './js/scenes/LevelScene.js',
    './js/scenes/LevelCompleteScene.js',
    './js/scenes/CreditsScene.js',
    './js/scenes/UIScene.js',

    // Sprites & Backgrounds
    './assets/sprites/orygames_splash.png',
    './assets/sprites/infobg.png',
    './assets/sprites/splash_bg.png',
    './assets/sprites/splash_portrait.png',
    './assets/sprites/level_map.png',
    './assets/sprites/endmission.png',
    './assets/sprites/bgoptions.png',
    './assets/sprites/tile.png',
    './assets/sprites/collectibles.png',

    // Characters - boxbot
    './assets/sprites/characters/boxbot/player_down_idle.png',
    './assets/sprites/characters/boxbot/player_down.png',
    './assets/sprites/characters/boxbot/player_down_1.png',
    './assets/sprites/characters/boxbot/player_up_idle.png',
    './assets/sprites/characters/boxbot/player_up.png',
    './assets/sprites/characters/boxbot/player_up_1.png',
    './assets/sprites/characters/boxbot/player_right_idle.png',
    './assets/sprites/characters/boxbot/player_right.png',
    './assets/sprites/characters/boxbot/player_right_1.png',

    // Characters - bluebot
    './assets/sprites/characters/bluebot/player_down_idle.png',
    './assets/sprites/characters/bluebot/player_down.png',
    './assets/sprites/characters/bluebot/player_down_1.png',
    './assets/sprites/characters/bluebot/player_up_idle.png',
    './assets/sprites/characters/bluebot/player_up.png',
    './assets/sprites/characters/bluebot/player_up_1.png',
    './assets/sprites/characters/bluebot/player_right_idle.png',
    './assets/sprites/characters/bluebot/player_right.png',
    './assets/sprites/characters/bluebot/player_right_1.png',

    // Audio - Sound Effects
    './assets/audio/select.mp3',
    './assets/audio/win.mp3',
    './assets/audio/movement/cmd.mp3',
    './assets/audio/movement/mov1.mp3',
    './assets/audio/movement/get.mp3',

    // Audio - Music
    './assets/audio/music/Ory_ContraaDengue.mp3',
    './assets/audio/music/Ory_levelselect.mp3',
    './assets/audio/music/endgame.mp3',

    // Videos
    './assets/videos/endv.mp4',

    // Levels
    './assets/levels/level1.json',
    './assets/levels/level2.json',
    './assets/levels/level3.json',
    './assets/levels/level4.json',

    // AI Model
    './assets/model/model.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[SW] All assets cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache assets:', error);
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version
                    return cachedResponse;
                }

                // Not in cache - fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Cache new resources (if valid response)
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Network failed and not in cache
                        console.log('[SW] Network request failed for:', event.request.url);
                    });
            })
    );
});
