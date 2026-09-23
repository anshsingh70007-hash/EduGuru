/**
 * EducationistGuru - YouTube Hub Manager (js/youtube-manager.js)
 * Features:
 * - Load channel videos from /api/youtube/videos (with fallbacks)
 * - Auto-grab YouTube thumbnails from any YouTube URL (watch, youtu.be, shorts, embed)
 * - Auto-fetch video metadata (title, author) via backend oEmbed proxy
 * - Category filter pills and real-time live search
 * - Theater Lightbox Video Modal player with autoplay
 * - Add Video modal with live thumbnail preview
 * - Delete video action with persistence
 */

(function () {
    'use strict';

    let allVideos = [];
    let filteredVideos = [];
    let activeCategory = 'all';
    let searchQuery = '';

    // ================= HELPER: PARSE YOUTUBE ID =================
    function extractYouTubeId(urlStr) {
        if (!urlStr) return null;
        urlStr = String(urlStr).trim();
        if (/^[\w-]{11}$/.test(urlStr)) return urlStr;
        const match = urlStr.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/|user\/[^\/]+\/.*[?&]v=))([\w-]{11})/i);
        return match ? match[1] : null;
    }

    // Escape HTML helper
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Relative / formatted time helper
    function formatTimeAgo(dateStr) {
        if (!dateStr) return 'Recently';
        const now = new Date();
        const date = new Date(dateStr);
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    // ================= LOAD VIDEOS DATA =================
    async function loadVideos() {
        const cacheBust = `_t=${Date.now()}`;
        // 1. Try Backend API (if on web server)
        if (window.location.protocol !== 'file:') {
            try {
                const res = await fetch(`/api/youtube/videos?${cacheBust}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.videos && Array.isArray(data.videos) && data.videos.length > 0) {
                        allVideos = data.videos;
                        localStorage.setItem('eg_youtube_videos', JSON.stringify(allVideos));
                        return allVideos;
                    }
                }
            } catch (e) {
                console.warn('[YouTubeManager] API unavailable, trying local data/videos.json');
            }
        }

        // 2. Try static data/videos.json
        try {
            const res = await fetch(`data/videos.json?${cacheBust}`, { cache: 'no-store' });
            if (res.ok) {
                const list = await res.json();
                if (Array.isArray(list) && list.length > 0) {
                    allVideos = list;
                    localStorage.setItem('eg_youtube_videos', JSON.stringify(allVideos));
                    return allVideos;
                }
            }
        } catch (e) {
            console.warn('[YouTubeManager] data/videos.json fallback failed');
        }

        // 3. Try LocalStorage
        try {
            const cached = localStorage.getItem('eg_youtube_videos');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    allVideos = parsed;
                    return allVideos;
                }
            }
        } catch (e) {}

        return allVideos;
    }

    // ================= FILTER & SEARCH LOGIC =================
    function applyFilters() {
        const q = searchQuery.trim().toLowerCase();

        filteredVideos = allVideos.filter(v => {
            // Category filter
            if (activeCategory !== 'all') {
                if ((v.category || '').toLowerCase() !== activeCategory.toLowerCase()) {
                    return false;
                }
            }

            // Search query across title, description, category
            if (q) {
                const titleMatch = (v.title || '').toLowerCase().includes(q);
                const descMatch = (v.description || '').toLowerCase().includes(q);
                const catMatch = (v.category || '').toLowerCase().includes(q);
                if (!titleMatch && !descMatch && !catMatch) {
                    return false;
                }
            }

            return true;
        });
    }

    // ================= RENDER METHODS =================
    function renderFeaturedVideo() {
        const container = document.getElementById('eg-yt-featured-wrapper');
        if (!container) return;

        // Only show featured section if on "All" tab and no active search
        if (activeCategory !== 'all' || searchQuery.trim() !== '') {
            container.style.display = 'none';
            return;
        }

        const featured = allVideos.find(v => v.isFeatured) || allVideos[0];
        if (!featured) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div class="eg-yt-featured-card">
                <div class="eg-yt-featured-media" onclick="window.playYouTubeVideo('${escapeHtml(featured.youtubeId)}', '${escapeHtml(featured.title)}')">
                    <img src="${escapeHtml(featured.thumbnail)}" alt="${escapeHtml(featured.title)}" onerror="this.onerror=null;this.src='https://img.youtube.com/vi/${featured.youtubeId}/hqdefault.jpg';">
                    <div class="eg-yt-play-overlay">
                        <div class="eg-yt-play-btn">
                            <i class="fa fa-play"></i>
                        </div>
                    </div>
                    <span class="eg-yt-card-duration">${escapeHtml(featured.duration || 'Watch Video')}</span>
                </div>
                <div class="eg-yt-featured-content">
                    <span class="eg-yt-featured-tag"><i class="fa fa-star"></i> Featured Release</span>
                    <h2 class="eg-yt-featured-title">${escapeHtml(featured.title)}</h2>
                    <p class="eg-yt-featured-desc">${escapeHtml(featured.description || 'Watch the latest detailed admission guidance and university review video from Educationist Guru.')}</p>
                    <div class="eg-yt-featured-footer">
                        <button type="button" class="btn btn-primary" style="background:#ff0000; border-color:#ff0000; border-radius:24px; padding:10px 22px; font-weight:700;" onclick="window.playYouTubeVideo('${escapeHtml(featured.youtubeId)}', '${escapeHtml(featured.title)}')">
                            <i class="fa fa-play" style="margin-right:6px;"></i> Watch Video Now
                        </button>
                        <a href="${escapeHtml(featured.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-light" style="border-radius:24px; padding:10px 20px; font-weight:600;">
                            <i class="fa fa-youtube-play" style="color:#ff0000; margin-right:6px;"></i> Watch on YouTube
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    function renderGrid() {
        const grid = document.getElementById('eg-yt-videos-grid');
        const countText = document.getElementById('eg-yt-results-count');
        if (!grid) return;

        if (countText) {
            countText.innerHTML = `Showing <strong>${filteredVideos.length}</strong> videos`;
        }

        if (filteredVideos.length === 0) {
            grid.innerHTML = `
                <div class="col-12">
                    <div class="eg-yt-empty-state">
                        <div class="eg-yt-empty-icon"><i class="fa fa-youtube-play"></i></div>
                        <h4 class="eg-yt-empty-title">No videos found</h4>
                        <p class="eg-yt-empty-desc">
                            We couldn't find any videos matching "<strong>${escapeHtml(searchQuery)}</strong>" in the selected category.
                        </p>
                        <button type="button" class="btn btn-primary" onclick="window.resetYouTubeFilters()" style="background:#ff0000; border-color:#ff0000; border-radius:20px;">
                            <i class="fa fa-refresh"></i> View All Videos
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        filteredVideos.forEach(v => {
            const timeAgo = formatTimeAgo(v.dateAdded);
            html += `
                <div class="col-lg-4 col-md-6 col-12 mb-4">
                    <article class="eg-yt-video-card" id="yt-card-${v.id}">
                        <div class="eg-yt-card-thumb" onclick="window.playYouTubeVideo('${escapeHtml(v.youtubeId)}', '${escapeHtml(v.title)}')">
                            <img src="${escapeHtml(v.thumbnail)}" alt="${escapeHtml(v.title)}" loading="lazy" onerror="this.onerror=null;this.src='https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg';">
                            <div class="eg-yt-card-play">
                                <div class="eg-yt-card-play-icon"><i class="fa fa-play"></i></div>
                            </div>
                            <span class="eg-yt-card-category">${escapeHtml(v.category || 'Education')}</span>
                            <span class="eg-yt-card-duration">${escapeHtml(v.duration || 'Watch')}</span>
                        </div>
                        <div class="eg-yt-card-body">
                            <h3 class="eg-yt-card-title">
                                <a href="javascript:void(0)" onclick="window.playYouTubeVideo('${escapeHtml(v.youtubeId)}', '${escapeHtml(v.title)}')">
                                    ${escapeHtml(v.title)}
                                </a>
                            </h3>
                            <p class="eg-yt-card-desc">${escapeHtml(v.description || 'Watch the latest update on admissions and university guidelines from Educationist Guru.')}</p>
                            <div class="eg-yt-card-meta">
                                <span><i class="fa fa-clock-o"></i> ${escapeHtml(timeAgo)}</span>
                                <div class="eg-yt-card-actions">
                                    <button type="button" class="eg-yt-btn-watch" onclick="window.playYouTubeVideo('${escapeHtml(v.youtubeId)}', '${escapeHtml(v.title)}')">
                                        <i class="fa fa-play"></i> Watch
                                    </button>
                                    <a href="${escapeHtml(v.url)}" target="_blank" rel="noopener noreferrer" class="eg-yt-btn-ext" title="Open directly on YouTube">
                                        <i class="fa fa-external-link"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            `;
        });

        grid.innerHTML = html;
    }

    // ================= GLOBAL ACTIONS =================

    // Open video in theater lightbox modal
    window.playYouTubeVideo = function (youtubeId, title) {
        if (!youtubeId) return;
        const modal = document.getElementById('egVideoPlayerModal');
        const iframe = document.getElementById('egVideoIframe');
        const titleEl = document.getElementById('egPlayerModalTitle');
        const directLink = document.getElementById('egPlayerDirectLink');

        if (iframe) {
            iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
        }
        if (titleEl) {
            titleEl.textContent = title || 'Educationist Guru Video';
        }
        if (directLink) {
            directLink.href = `https://www.youtube.com/watch?v=${youtubeId}`;
        }

        if (window.$ && typeof window.$.fn.modal === 'function') {
            $('#egVideoPlayerModal').modal('show');
        } else if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
        }
    };

    // Close video player modal and stop video playback
    window.closeVideoPlayer = function () {
        const iframe = document.getElementById('egVideoIframe');
        if (iframe) {
            iframe.src = '';
        }
        if (window.$ && typeof window.$.fn.modal === 'function') {
            $('#egVideoPlayerModal').modal('hide');
        } else {
            const modal = document.getElementById('egVideoPlayerModal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        }
    };

    // Stop playback when Bootstrap modal is closed via backdrop or escape
    if (window.$) {
        $(document).on('hidden.bs.modal', '#egVideoPlayerModal', function () {
            window.closeVideoPlayer();
        });
    }

    // Filter by category
    window.filterByCategory = function (cat) {
        activeCategory = cat;
        document.querySelectorAll('.eg-yt-cat-pill').forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-cat') === cat);
        });
        applyFilters();
        renderFeaturedVideo();
        renderGrid();
    };

    // Reset filters
    window.resetYouTubeFilters = function () {
        activeCategory = 'all';
        searchQuery = '';
        const searchInput = document.getElementById('eg-yt-search-input');
        const clearBtn = document.getElementById('eg-yt-search-clear');
        if (searchInput) searchInput.value = '';
        if (clearBtn) clearBtn.style.display = 'none';

        document.querySelectorAll('.eg-yt-cat-pill').forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-cat') === 'all');
        });

        applyFilters();
        renderFeaturedVideo();
        renderGrid();
    };

    // Delete a video
    window.deleteYouTubeVideo = async function (id) {
        if (!confirm('Are you sure you want to remove this video?')) return;

        try {
            await fetch(`/api/youtube/videos/${id}`, { method: 'DELETE' });
        } catch (e) {}

        allVideos = allVideos.filter(v => v.id !== id);
        localStorage.setItem('eg_youtube_videos', JSON.stringify(allVideos));
        applyFilters();
        renderFeaturedVideo();
        renderGrid();
    };

    // Open Add Video Modal
    window.openAddVideoModal = function () {
        const form = document.getElementById('egAddVideoForm');
        if (form) form.reset();
        resetThumbnailPreview();

        const alertBox = document.getElementById('egAddVideoAlert');
        if (alertBox) {
            alertBox.style.display = 'none';
            alertBox.textContent = '';
        }

        if (window.$ && typeof window.$.fn.modal === 'function') {
            $('#egAddVideoModal').modal('show');
        } else {
            const modal = document.getElementById('egAddVideoModal');
            if (modal) {
                modal.style.display = 'block';
                modal.classList.add('show');
            }
        }
    };

    window.closeAddVideoModal = function () {
        if (window.$ && typeof window.$.fn.modal === 'function') {
            $('#egAddVideoModal').modal('hide');
        } else {
            const modal = document.getElementById('egAddVideoModal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        }
    };

    // Reset preview box
    function resetThumbnailPreview() {
        const previewBox = document.getElementById('egThumbPreviewBox');
        const previewImg = document.getElementById('egThumbPreviewImg');
        const placeholder = document.getElementById('egThumbPlaceholder');
        const status = document.getElementById('egThumbStatus');
        const hiddenThumb = document.getElementById('egVideoThumbInput');

        if (previewBox) previewBox.classList.remove('has-thumb');
        if (previewImg) {
            previewImg.src = '';
            previewImg.style.display = 'none';
        }
        if (placeholder) placeholder.style.display = 'block';
        if (status) status.style.display = 'none';
        if (hiddenThumb) hiddenThumb.value = '';
    }

    // ================= AUTO THUMBNAIL & METADATA GRABBER =================
    let grabDebounce = null;
    function handleUrlInput(urlVal) {
        clearTimeout(grabDebounce);
        const alertBox = document.getElementById('egAddVideoAlert');
        if (alertBox) alertBox.style.display = 'none';

        if (!urlVal || !urlVal.trim()) {
            resetThumbnailPreview();
            return;
        }

        grabDebounce = setTimeout(async () => {
            const videoId = extractYouTubeId(urlVal);
            if (!videoId) {
                resetThumbnailPreview();
                if (alertBox) {
                    alertBox.className = 'alert alert-warning';
                    alertBox.style.display = 'block';
                    alertBox.innerHTML = '<i class="fa fa-exclamation-triangle"></i> Please enter a valid YouTube link or 11-digit Video ID.';
                }
                return;
            }

            // Immediately auto-grab thumbnail
            const maxresThumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            const hqThumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

            const previewBox = document.getElementById('egThumbPreviewBox');
            const previewImg = document.getElementById('egThumbPreviewImg');
            const placeholder = document.getElementById('egThumbPlaceholder');
            const status = document.getElementById('egThumbStatus');
            const hiddenThumb = document.getElementById('egVideoThumbInput');
            const titleInput = document.getElementById('egVideoTitleInput');

            if (previewBox) previewBox.classList.add('has-thumb');
            if (placeholder) placeholder.style.display = 'none';
            if (status) {
                status.style.display = 'block';
                status.textContent = '✓ Thumbnail Grabbed';
            }

            if (previewImg) {
                previewImg.style.display = 'block';
                // Try high-res first, fall back to hq default
                previewImg.onerror = function () {
                    this.onerror = null;
                    this.src = hqThumb;
                    if (hiddenThumb) hiddenThumb.value = hqThumb;
                };
                previewImg.src = maxresThumb;
                if (hiddenThumb) hiddenThumb.value = maxresThumb;
            }

            // Also call backend proxy to auto-fill Video Title via oEmbed
            try {
                const res = await fetch(`/api/youtube/fetch-info?url=${encodeURIComponent(urlVal)}`);
                if (res.ok) {
                    const info = await res.json();
                    if (info.success && info.title) {
                        if (titleInput && (!titleInput.value || titleInput.dataset.autoFilled === 'true')) {
                            titleInput.value = info.title;
                            titleInput.dataset.autoFilled = 'true';
                        }
                    }
                }
            } catch (e) {
                console.log('oEmbed fetch error (non-fatal):', e);
            }
        }, 220);
    }

    // Form Submission Handler
    async function handleAddVideoSubmit(e) {
        e.preventDefault();
        const alertBox = document.getElementById('egAddVideoAlert');
        const submitBtn = document.getElementById('egAddVideoSubmitBtn');

        const urlInput = document.getElementById('egVideoUrlInput');
        const titleInput = document.getElementById('egVideoTitleInput');
        const catInput = document.getElementById('egVideoCatInput');
        const durationInput = document.getElementById('egVideoDurationInput');
        const descInput = document.getElementById('egVideoDescInput');
        const thumbInput = document.getElementById('egVideoThumbInput');

        const url = (urlInput ? urlInput.value : '').trim();
        const title = (titleInput ? titleInput.value : '').trim();
        const category = catInput ? catInput.value : 'Admissions 2025';
        const duration = (durationInput ? durationInput.value : '').trim();
        const description = (descInput ? descInput.value : '').trim();
        const thumbnail = (thumbInput ? thumbInput.value : '') || '';

        const videoId = extractYouTubeId(url);
        if (!videoId) {
            if (alertBox) {
                alertBox.className = 'alert alert-danger';
                alertBox.style.display = 'block';
                alertBox.textContent = 'Please provide a valid YouTube video link.';
            }
            return;
        }

        if (!title) {
            if (alertBox) {
                alertBox.className = 'alert alert-danger';
                alertBox.style.display = 'block';
                alertBox.textContent = 'Please enter a video title.';
            }
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Adding Video...';
        }

        try {
            const res = await fetch('/api/youtube/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    title,
                    category,
                    duration,
                    description,
                    thumbnail: thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.video) {
                    allVideos.unshift(data.video);
                } else {
                    allVideos.unshift({
                        id: Date.now(),
                        youtubeId: videoId,
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                        title,
                        category,
                        duration: duration || 'Video',
                        description,
                        thumbnail: thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                        dateAdded: new Date().toISOString()
                    });
                }
            } else {
                throw new Error('Backend failed');
            }
        } catch (err) {
            // Local fallback
            allVideos.unshift({
                id: Date.now(),
                youtubeId: videoId,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                title,
                category,
                duration: duration || 'Video',
                description,
                thumbnail: thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                dateAdded: new Date().toISOString()
            });
        }

        localStorage.setItem('eg_youtube_videos', JSON.stringify(allVideos));

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa fa-check"></i> Add Video';
        }

        window.closeAddVideoModal();
        applyFilters();
        renderFeaturedVideo();
        renderGrid();

        // Scroll to grid smoothly
        const section = document.getElementById('eg-yt-grid-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    }

    // ================= EVENT LISTENERS =================
    function attachListeners() {
        const searchInput = document.getElementById('eg-yt-search-input');
        const clearBtn = document.getElementById('eg-yt-search-clear');
        const urlInput = document.getElementById('egVideoUrlInput');
        const addForm = document.getElementById('egAddVideoForm');

        if (searchInput) {
            searchInput.addEventListener('input', function (e) {
                searchQuery = e.target.value;
                if (clearBtn) clearBtn.style.display = searchQuery ? 'flex' : 'none';
                applyFilters();
                renderFeaturedVideo();
                renderGrid();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                if (searchInput) searchInput.value = '';
                clearBtn.style.display = 'none';
                searchQuery = '';
                applyFilters();
                renderFeaturedVideo();
                renderGrid();
            });
        }

        // Live Auto-Thumbnail Grabbing on link change
        if (urlInput) {
            urlInput.addEventListener('input', function (e) {
                handleUrlInput(e.target.value);
            });
            urlInput.addEventListener('paste', function (e) {
                const pasted = (e.clipboardData || window.clipboardData).getData('text');
                handleUrlInput(pasted);
            });
        }

        // Reset autoFilled tag if user manually modifies the title
        const titleInput = document.getElementById('egVideoTitleInput');
        if (titleInput) {
            titleInput.addEventListener('input', function () {
                this.dataset.autoFilled = 'false';
            });
        }

        if (addForm) {
            addForm.addEventListener('submit', handleAddVideoSubmit);
        }
    }

    // ================= INITIALIZATION =================
    window.initYouTubePage = async function () {
        const grid = document.getElementById('eg-yt-videos-grid');
        if (!grid) return; // Not on the YouTube page

        await loadVideos();
        applyFilters();
        renderFeaturedVideo();
        renderGrid();
        attachListeners();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initYouTubePage);
    } else {
        window.initYouTubePage();
    }
})();
