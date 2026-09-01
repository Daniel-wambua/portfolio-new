/* HavocSec — portfolio.havocsec.me
 *
 * Small on purpose. Three jobs:
 *   1. mobile nav drawer (state only; CSS does the rest)
 *   2. section reveal on scroll (skipped under prefers-reduced-motion)
 *   3. writeup index, rendered from the RSS feed
 *
 * The feed is fetched SAME-ORIGIN from /rss.xml. On production, vercel.json
 * rewrites /rss.xml to the havocsec.dev feed server-side, so there is no CORS
 * in play at all. The direct upstream URL is only a last-ditch fallback for
 * local development — the upstream host sends no Access-Control-Allow-Origin,
 * so browsers will (correctly) refuse it; see the rewrite in vercel.json.
 */

(function () {
    'use strict';

    var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ------------------------------------------------------------ nav ---- */

    document.addEventListener('DOMContentLoaded', function () {
        var toggle = document.getElementById('nav-toggle');
        var nav = document.getElementById('site-nav');
        var scrim = document.getElementById('nav-scrim');
        if (!toggle || !nav) return;

        function setNavOpen(open) {
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            if (open) {
                nav.setAttribute('data-open', 'true');
                document.body.setAttribute('data-nav-open', 'true');
                if (scrim) scrim.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            } else {
                nav.removeAttribute('data-open');
                document.body.removeAttribute('data-nav-open');
                if (scrim) scrim.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        }

        function isNavOpen() {
            return toggle.getAttribute('aria-expanded') === 'true';
        }

        toggle.addEventListener('click', function () {
            setNavOpen(!isNavOpen());
        });

        // Same-page anchors do not reload, so the drawer would otherwise stay
        // open over the section the visitor just jumped to.
        nav.addEventListener('click', function (event) {
            if (event.target.closest('a')) setNavOpen(false);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && isNavOpen()) {
                setNavOpen(false);
                // Focus would otherwise be left on a link inside a now-hidden
                // drawer.
                toggle.focus();
            }
        });

        // Covers the scrim as well as the page behind it.
        document.addEventListener('click', function (event) {
            if (!isNavOpen()) return;
            if (!event.target.closest('#site-nav, #nav-toggle')) setNavOpen(false);
        });

        // Crossing into the desktop layout leaves the button display:none
        // while the drawer is still flagged open; clear the stale state (and
        // its scroll lock) before the visitor rotates back.
        var wide = window.matchMedia('(min-width: 861px)');
        if (wide.addEventListener) {
            wide.addEventListener('change', function (event) {
                if (event.matches) setNavOpen(false);
            });
        }
    });

    /* --------------------------------------------------------- reveal ---- */

    document.addEventListener('DOMContentLoaded', function () {
        if (REDUCED_MOTION || !('IntersectionObserver' in window)) return;

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px' });

        document.querySelectorAll('.section').forEach(function (el) {
            el.classList.add('reveal');
            io.observe(el);
        });

        // Exposed so dynamically rendered rows can join the same observer.
        window.__hsObserve = function (el) {
            el.classList.add('reveal');
            io.observe(el);
        };
    });

    /* ------------------------------------------------------------ feed ---- */

    var FEED = {
        // Same-origin first: on production this hits the vercel.json rewrite
        // and never leaves the site. The upstream URL is a dev-only fallback.
        endpoints: ['/rss.xml', 'https://havocsec.dev/rss.xml'],
        maxWriteups: 6,
        maxNotes: 3,
        timeout: 8000
    };

    document.addEventListener('DOMContentLoaded', function () {
        var yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = new Date().getFullYear();

        loadWriteups();
    });

    function loadWriteups() {
        var list = document.getElementById('writeup-list');
        if (!list) return;

        fetchFeed()
            .then(function (posts) {
                renderWriteups(list, posts.filter(function (p) {
                    return p.kind === 'ctf' || p.kind === 'pentest';
                }));
                renderNotes(posts.filter(function (p) {
                    return p.kind === 'note';
                }));
            })
            .catch(function (err) {
                console.warn('Writeup index unavailable:', err && err.message);
                list.innerHTML = '';
                list.appendChild(emptyNode(
                    'The writeup index is temporarily unavailable. ' +
                    'Read the archive directly at havocsec.dev.'
                ));
            });
    }

    function fetchFeed() {
        var chain = FEED.endpoints.reduce(function (prev, endpoint) {
            return prev.catch(function () {
                return withTimeout(fetch(endpoint, {
                    headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' }
                }), FEED.timeout).then(function (response) {
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    return response.text();
                }).then(function (text) {
                    var head = text.trim().slice(0, 200).toLowerCase();
                    if (!head.startsWith('<?xml') && !head.startsWith('<rss')) {
                        throw new Error('Non-XML response');
                    }
                    return parseFeed(text);
                });
            });
        }, Promise.reject());

        return chain;
    }

    function withTimeout(promise, ms) {
        return new Promise(function (resolve, reject) {
            var timer = setTimeout(function () {
                reject(new Error('Feed request timed out'));
            }, ms);
            promise.then(function (value) {
                clearTimeout(timer);
                resolve(value);
            }, function (err) {
                clearTimeout(timer);
                reject(err);
            });
        });
    }

    function parseFeed(text) {
        var xml = new DOMParser().parseFromString(text, 'text/xml');
        if (xml.querySelector('parsererror')) throw new Error('XML parsing failed');

        var posts = [];
        xml.querySelectorAll('item').forEach(function (item) {
            var title = (item.querySelector('title') || {}).textContent || 'Untitled';
            var link = (item.querySelector('link') || {}).textContent || '';
            var description = (item.querySelector('description') || {}).textContent || '';
            var pubDate = (item.querySelector('pubDate') || {}).textContent || '';

            var categories = [];
            item.querySelectorAll('category').forEach(function (cat) {
                categories.push((cat.textContent || '').toLowerCase());
            });

            posts.push({
                title: title,
                link: collapseSlashes(link),
                description: description,
                date: pubDate ? new Date(pubDate) : null,
                categories: categories,
                kind: kindOf(link, categories),
                image: imageOf(item)
            });
        });

        posts.sort(function (a, b) {
            return (b.date || 0) - (a.date || 0);
        });
        return posts;
    }

    function kindOf(link, categories) {
        var path = link.toLowerCase();
        if (path.indexOf('/ctf/') !== -1) return 'ctf';
        if (path.indexOf('/pentesting/') !== -1 || path.indexOf('/hackthebox/') !== -1) return 'pentest';
        if (path.indexOf('/blog/') !== -1 || path.indexOf('/chitchat/') !== -1) return 'note';
        return 'other';
    }

    // Difficulty ships in the feed tags ("insane-difficulty", "hard-difficulty"...).
    function difficultyOf(categories) {
        for (var i = 0; i < categories.length; i++) {
            var m = categories[i].match(/^([a-z]+)-difficulty$/);
            if (m) return m[1];
        }
        return '';
    }

    // The feed emits links like `https://havocsec.dev//ctf/x`; collapse the
    // duplicate slash while preserving the `https://` scheme separator.
    function collapseSlashes(url) {
        return (url || '').replace(/(https?:\/\/)|\/{2,}/g, function (match, scheme) {
            return scheme || '/';
        });
    }

    // Feature image for the row thumbnail: the item's image enclosure, or the
    // first <img> inside content:encoded when there is no enclosure. Links in
    // the feed carry the `//` bug too, so they go through collapseSlashes.
    function imageOf(item) {
        var enclosure = item.querySelector('enclosure');
        if (enclosure) {
            var type = (enclosure.getAttribute('type') || '').toLowerCase();
            var url = enclosure.getAttribute('url') || '';
            if (url && (type === '' || type.indexOf('image/') === 0)) {
                return collapseSlashes(url);
            }
        }

        var encoded = item.getElementsByTagNameNS(
            'http://purl.org/rss/1.0/modules/content/', 'encoded');
        if (!encoded.length) return '';

        var match = encoded[0].textContent.match(/<img[^>]+src=["']([^"']+)["']/i);
        return match ? collapseSlashes(match[1]) : '';
    }

    /* -------------------------------------------------------- rendering ---- */

    function renderWriteups(container, posts) {
        container.innerHTML = '';

        if (posts.length === 0) {
            container.appendChild(emptyNode(
                'No writeups in the feed right now. The archive lives at havocsec.dev.'
            ));
            return;
        }

        posts.slice(0, FEED.maxWriteups).forEach(function (post) {
            var card = document.createElement('article');
            card.className = 'wcard glass';

            var meta = ['<span class="wt-type">' + (post.kind === 'ctf' ? 'CTF' : 'Pentest') + '</span>'];
            meta.push('<span class="wt-platform">' +
                (post.link.toLowerCase().indexOf('hackthebox') !== -1 ? 'HackTheBox' : 'CTF event') +
                '</span>');
            var diff = difficultyOf(post.categories);
            if (diff) meta.push('<span class="wt-diff">' + escapeHtml(diff) + '</span>');

            var metaLeft = '<span class="wt-set">' + meta.join('<span aria-hidden="true"> · </span>') + '</span>';

            var date = formatDate(post.date);
            if (date) metaLeft += '<span class="wt-date">' + escapeHtml(date) + '</span>';

            // Decorative feature image from the feed's enclosure, on top of the
            // card exactly like the project covers. The title link is the
            // keyboard path in, so the media is aria-hidden and its wrapper
            // drops out entirely (onerror) if the image fails to load.
            var media = '';
            if (post.image) {
                media = '<a class="card-media" href="' + escapeAttr(post.link) + '" ' +
                    'target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">' +
                    '<img src="' + escapeAttr(post.image) + '" alt="" loading="lazy" decoding="async" ' +
                    'onerror="this.parentNode.remove()"></a>';
            }

            card.innerHTML =
                media +
                '<div class="wcard-body">' +
                    '<p class="wcard-meta mono">' + metaLeft + '</p>' +
                    '<h3><a href="' + escapeAttr(post.link) + '" target="_blank" rel="noopener noreferrer">' +
                        escapeHtml(post.title) + '</a></h3>' +
                    '<p class="wcard-sum">' + escapeHtml(truncate(post.description, 220)) + '</p>' +
                '</div>';

            container.appendChild(card);
            if (window.__hsObserve) window.__hsObserve(card);
        });
    }

    function renderNotes(posts) {
        var wrap = document.getElementById('notes-list');
        var grid = document.getElementById('notes-grid');
        if (!wrap || !grid || posts.length === 0) return;

        posts.slice(0, FEED.maxNotes).forEach(function (post) {
            var card = document.createElement('a');
            card.className = 'note-card glass';
            card.href = post.link;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.innerHTML =
                '<span class="note-title">' + escapeHtml(post.title) + '</span>' +
                '<span class="note-date">' + escapeHtml(formatDate(post.date, { year: 'numeric' })) + '</span>';

            grid.appendChild(card);
            if (window.__hsObserve) window.__hsObserve(card);
        });

        wrap.hidden = false;
    }

    function emptyNode(message) {
        var p = document.createElement('p');
        p.className = 'research-empty mono';
        var a = document.createElement('a');
        a.href = 'https://havocsec.dev';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'havocsec.dev';
        p.appendChild(document.createTextNode(message.replace('havocsec.dev', '') + ' '));
        p.appendChild(a);
        return p;
    }

    function formatDate(date, opts) {
        if (!date || isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', opts || {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    }

    function truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '…';
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }

    function escapeAttr(text) {
        return escapeHtml(text).replace(/"/g, '&quot;');
    }
})();
