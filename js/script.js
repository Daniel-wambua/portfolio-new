document.addEventListener('DOMContentLoaded', function() {
    if (window.particlesJS) {
        window.particlesJS('particles-js', {
            particles: {
                number: {
                    value: 60,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: '#ffffff'
                },
                shape: {
                    type: 'circle'
                },
                opacity: {
                    value: 0.5,
                    random: true
                },
                size: {
                    value: 3,
                    random: true
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#ffffff',
                    opacity: 0.4,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: {
                        enable: true,
                        mode: 'repulse'
                    },
                    onclick: {
                        enable: true,
                        mode: 'push'
                    },
                    resize: true
                },
                modes: {
                    repulse: {
                        distance: 100,
                        duration: 0.4
                    },
                    push: {
                        particles_nb: 4
                    }
                }
            },
            retina_detect: true
        });
    }
});
const themes = [
    'theme-neon-tokyo', 
    'theme-dark-amethyst', 
    'theme-midnight-forest',
    'theme-cyber-blood',
    'theme-arctic-frost',
    'theme-golden-haze',
    'theme-void-purple',
    'theme-ocean-depths',
    'theme-sunset-ember',
    'theme-matrix-green',
    'theme-synthwave',
    'theme-nord-aurora'
];
const themeIcons = ['🌃', '🔮', '🌲', '🩸', '❄️', '✨', '🌌', '🌊', '🌅', '💻', '🎧', '🌌'];
let currentThemeIdx = themes.findIndex(t => document.body.classList.contains(t));
if (currentThemeIdx === -1) currentThemeIdx = 0;

function setTheme(idx) {
    document.body.classList.remove(...themes);
    document.body.classList.add(themes[idx]);
    const btn = document.getElementById('theme-switcher');
    if (btn) btn.textContent = themeIcons[idx];
}
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-switcher');
    if (!btn) return;
    setTheme(currentThemeIdx);
    btn.addEventListener('click', () => {
        currentThemeIdx = (currentThemeIdx + 1) % themes.length;
        setTheme(currentThemeIdx);
    });
});

// RSS Feed Configuration
const RSS_CONFIG = {
    feedUrl: 'https://havocsec.me/rss.xml',
    corsProxy: 'https://api.allorigins.win/raw?url=',
    maxCtfPosts: 2,        // 2 CTF posts
    maxPentestPosts: 2,    // 2 Pentesting posts
    allowedTypes: ['ctf', 'pentesting'],
    timeout: 5000
};

// GitHub Configuration
const GITHUB_CONFIG = {
    username: 'Daniel-wambua',
    maxRepos: 2,
    featuredRepos: ['cyberhub', 'docker-scanner', 'Havoclab', 'hackGraph'],
    timeout: 5000
};

// Main function to load all projects
async function loadProjects() {
    const container = document.getElementById('rss-projects');
    if (!container) return;

    try {
        // Fetch both RSS and GitHub data in parallel with timeout
        const [rssPosts, githubRepos] = await Promise.all([
            Promise.race([
                fetchRSSFeed(),
                new Promise((_, reject) => setTimeout(() => reject('RSS timeout'), RSS_CONFIG.timeout))
            ]).catch(() => []),
            Promise.race([
                fetchGitHubRepos(),
                new Promise((_, reject) => setTimeout(() => reject('GitHub timeout'), GITHUB_CONFIG.timeout))
            ]).catch(() => [])
        ]);

        container.innerHTML = '';
        
        // Render RSS posts (CTF & Pentesting writeups)
        if (rssPosts.length > 0) {
            const writeupSection = document.createElement('div');
            writeupSection.className = 'project-section';
            writeupSection.innerHTML = '<h3 class="section-title">🚩 Latest Writeups</h3>';
            rssPosts.forEach(post => renderRSSPost(post, writeupSection));
            
            // Add "See more" link for writeups
            writeupSection.innerHTML += `
                <div class="see-more-container">
                    <p class="see-more-text">Find more CTF writeups and pentesting guides here</p>
                    <a href="https://havocsec.me" class="btn" target="_blank" rel="noopener noreferrer">Visit havocsec.me →</a>
                </div>
            `;
            container.appendChild(writeupSection);
        }
        
        // Render GitHub repos
        if (githubRepos.length > 0) {
            const githubSection = document.createElement('div');
            githubSection.className = 'project-section';
            githubSection.innerHTML = '<h3 class="section-title">🔧 Featured Tools</h3>';
            githubRepos.forEach(repo => renderGitHubRepo(repo, githubSection));
            
            // Add "See more" link for GitHub
            githubSection.innerHTML += `
                <div class="see-more-container">
                    <p class="see-more-text">Explore more security tools and projects</p>
                    <a href="https://github.com/Daniel-wambua" class="btn" target="_blank" rel="noopener noreferrer">View GitHub →</a>
                </div>
            `;
            container.appendChild(githubSection);
        }
        
        // Fallback if nothing loaded
        if (rssPosts.length === 0 && githubRepos.length === 0) {
            container.innerHTML = `
                <div class="error-message">
                    <p>Projects loading slowly? Visit directly:</p>
                    <div class="project-links" style="justify-content: center; margin-top: 1rem;">
                        <a href="https://havocsec.me" class="btn" target="_blank">havocsec.me</a>
                        <a href="https://github.com/Daniel-wambua" class="btn" target="_blank">GitHub</a>
                    </div>
                </div>
            `;
        }
        
        // Initialize tag filtering after all posts are loaded
        initTagFiltering();
        
    } catch (error) {
        console.error('Error loading projects:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Unable to load projects. Visit directly:</p>
                <div class="project-links" style="justify-content: center; margin-top: 1rem;">
                    <a href="https://havocsec.me" class="btn" target="_blank">havocsec.me</a>
                    <a href="https://github.com/Daniel-wambua" class="btn" target="_blank">GitHub</a>
                </div>
            </div>
        `;
    }
}

// Fetch and parse RSS feed (CTF & Pentesting only)
async function fetchRSSFeed() {
    try {
        // Always use CORS proxy for cross-origin requests
        const proxyUrl = RSS_CONFIG.corsProxy + encodeURIComponent(RSS_CONFIG.feedUrl);
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        
        // Check for parsing errors
        const parseError = xml.querySelector('parsererror');
        if (parseError) {
            throw new Error('XML parsing failed');
        }
        
        const items = xml.querySelectorAll('item');
        const posts = [];
        
        items.forEach((item) => {
            const title = item.querySelector('title')?.textContent || 'Untitled';
            const link = item.querySelector('link')?.textContent || '#';
            const description = item.querySelector('description')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            const enclosure = item.querySelector('enclosure');
            const imageUrl = enclosure?.getAttribute('url') || '';
            
            // Get categories/tags
            const categories = [];
            item.querySelectorAll('category').forEach(cat => {
                categories.push(cat.textContent.toLowerCase());
            });
            
            // Determine post type from URL path
            let postType = 'blog';
            if (link.includes('/ctf/')) postType = 'ctf';
            else if (link.includes('/pentesting/') || link.includes('/hackthebox/')) postType = 'pentesting';
            else if (link.includes('/chitchat/')) postType = 'chitchat';
            
            // Only include CTF and Pentesting posts
            if (!RSS_CONFIG.allowedTypes.includes(postType)) return;
            
            // Add postType to categories if not present
            if (!categories.includes(postType)) {
                categories.push(postType);
            }
            
            // Clean up double slashes in URLs
            const cleanLink = link.replace(/([^:]\/)\/+/g, '$1');
            const cleanImage = imageUrl.replace(/([^:]\/)\/+/g, '$1');
            
            posts.push({
                title,
                link: cleanLink,
                description,
                pubDate: new Date(pubDate),
                imageUrl: cleanImage,
                categories,
                postType
            });
        });
        
        // Sort by date (newest first) and separate by type
        posts.sort((a, b) => b.pubDate - a.pubDate);
        
        // Get separate arrays for CTF and Pentesting
        const ctfPosts = posts.filter(p => p.postType === 'ctf').slice(0, RSS_CONFIG.maxCtfPosts);
        const pentestPosts = posts.filter(p => p.postType === 'pentesting').slice(0, RSS_CONFIG.maxPentestPosts);
        
        console.log(`RSS: Found ${ctfPosts.length} CTF posts, ${pentestPosts.length} pentesting posts`);
        
        // Combine: CTF first, then pentesting
        return [...ctfPosts, ...pentestPosts];
        
    } catch (error) {
        console.error('Error fetching RSS feed:', error);
        return [];
    }
}

// Fetch GitHub repos
async function fetchGitHubRepos() {
    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_CONFIG.username}/repos?sort=updated&per_page=30`);
        const repos = await response.json();
        
        // Filter to featured repos or non-fork repos with descriptions
        const filtered = repos.filter(repo => {
            if (GITHUB_CONFIG.featuredRepos.includes(repo.name)) return true;
            return !repo.fork && repo.description && repo.description.length > 10;
        });
        
        // Prioritize featured repos
        filtered.sort((a, b) => {
            const aFeatured = GITHUB_CONFIG.featuredRepos.indexOf(a.name);
            const bFeatured = GITHUB_CONFIG.featuredRepos.indexOf(b.name);
            if (aFeatured !== -1 && bFeatured !== -1) return aFeatured - bFeatured;
            if (aFeatured !== -1) return -1;
            if (bFeatured !== -1) return 1;
            return new Date(b.updated_at) - new Date(a.updated_at);
        });
        
        return filtered.slice(0, GITHUB_CONFIG.maxRepos);
        
    } catch (error) {
        console.error('Error fetching GitHub repos:', error);
        return [];
    }
}

// Render RSS post card
function renderRSSPost(post, container) {
    const tagsString = post.categories.join(' ');
    const typeLabel = getTypeLabel(post.postType);
    const formattedDate = post.pubDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    const card = document.createElement('div');
    card.className = 'project-card animate-card';
    card.setAttribute('data-tags', tagsString);
    
    card.innerHTML = `
        <div class="project-content">
            <div class="post-meta">
                <span class="post-type ${post.postType}">${typeLabel}</span>
                <span class="post-date">${formattedDate}</span>
            </div>
            <h3>${escapeHtml(post.title)}</h3>
            <p class="decore">${escapeHtml(truncateText(post.description, 200))}</p>
            <div class="project-links">
                <a href="${post.link}" class="btn" target="_blank" rel="noopener noreferrer">Read Writeup</a>
            </div>
        </div>
        ${post.imageUrl ? `
            <div class="project-image">
                <img src="${post.imageUrl}" alt="${escapeHtml(post.title)}" loading="lazy" onerror="this.parentElement.style.display='none'" />
            </div>
        ` : ''}
    `;
    
    container.appendChild(card);
}

// Render GitHub repo card
function renderGitHubRepo(repo, container) {
    const tags = ['github', 'tools'];
    if (repo.language) tags.push(repo.language.toLowerCase());
    if (repo.topics) tags.push(...repo.topics);
    
    const card = document.createElement('div');
    card.className = 'project-card animate-card';
    card.setAttribute('data-tags', tags.join(' '));
    
    const languageBadge = repo.language ? `<span class="repo-language">${repo.language}</span>` : '';
    
    card.innerHTML = `
        <div class="project-content">
            <div class="post-meta">
                <span class="post-type github">🔧 GitHub Project</span>
                ${languageBadge}
            </div>
            <h3>${escapeHtml(repo.name)}</h3>
            <p class="decore">${escapeHtml(repo.description || 'No description')}</p>
            <div class="project-links">
                <a href="${repo.html_url}" class="btn" target="_blank" rel="noopener noreferrer">View on GitHub</a>
                ${repo.homepage ? `<a href="${repo.homepage}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ''}
            </div>
        </div>
    `;
    
    container.appendChild(card);
}

// Get readable type label
function getTypeLabel(type) {
    const labels = {
        'ctf': '🚩 CTF Writeup',
        'pentesting': '🔓 Pentesting',
        'blog': '📝 Blog',
        'chitchat': '💬 ChitChat',
        'github': '🔧 GitHub'
    };
    return labels[type] || '📄 Post';
}

// Truncate text to specified length
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Tag filtering functionality (works with dynamically loaded content)
function initTagFiltering() {
    const tagButtons = document.querySelectorAll('.tag[data-tag]');
    const projectCards = document.querySelectorAll('.project-card[data-tags]');
    
    tagButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state on buttons
            tagButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const selectedTag = button.dataset.tag.toLowerCase();
            
            // Filter projects
            projectCards.forEach(card => {
                const cardTags = card.dataset.tags.toLowerCase().split(' ');
                
                if (selectedTag === 'all' || cardTags.some(tag => tag.includes(selectedTag))) {
                    card.classList.remove('hidden');
                    card.style.animation = 'slideInUp 0.4s ease-out forwards';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

// Fetch and display dynamic GitHub stats
async function loadGitHubStats() {
    const username = 'Daniel-wambua';
    const reposEl = document.getElementById('github-repos');
    const contribEl = document.getElementById('github-contributions');
    
    try {
        // Fetch user data for public repos count
        const userResponse = await fetch(`https://api.github.com/users/${username}`);
        const userData = await userResponse.json();
        
        if (reposEl && userData.public_repos) {
            reposEl.textContent = userData.public_repos;
        }
        
        // For contributions, we use the events API to estimate recent activity
        // GitHub doesn't expose total contributions via API, so we show repos + a note
        const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`);
        const events = await eventsResponse.json();
        
        // Count push events (commits) from the last 100 events
        const pushEvents = events.filter(e => e.type === 'PushEvent');
        const totalCommits = pushEvents.reduce((sum, e) => sum + (e.payload?.commits?.length || 0), 0);
        
        if (contribEl) {
            // Use a realistic estimate based on profile (1697+ was visible on profile)
            // We can show recent activity or fall back to the known number
            if (totalCommits > 50) {
                contribEl.textContent = `${totalCommits}+`;
            } else {
                // Fallback to approximate based on what was on profile
                contribEl.textContent = '1,700+';
            }
        }
        
    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
        if (reposEl) reposEl.textContent = '22+';
        if (contribEl) contribEl.textContent = '1,700+';
    }
}

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    loadGitHubStats();
});