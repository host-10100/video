// VidGrb - Main Application JavaScript
class VidGrb {
    constructor() {
        this.init();
        this.bindEvents();
        this.startStatsAnimation();
    }

    init() {
        // Initialize translations
        if (typeof initTranslations === 'function') {
            initTranslations();
        }
        
        // Initialize platform detection patterns
        this.platformPatterns = {
            youtube: [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/],
            tiktok: [/(?:tiktok\.com\/@[^/]+\/video\/|vm\.tiktok\.com\/)(\d+)/],
            facebook: [/facebook\.com\/.*\/videos\/(\d+)/],
            twitter: [/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/],
            dailymotion: [/dailymotion\.com\/video\/([a-zA-Z0-9]+)/],
            twitch: [/twitch\.tv\/videos\/(\d+)/]
        };
        
        // Quality options for different platforms
        this.qualityOptions = {
            youtube: ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'],
            tiktok: ['360p', '720p'],
            facebook: ['240p', '360p', '480p', '720p'],
            twitter: ['240p', '360p', '720p'],
            dailymotion: ['240p', '360p', '480p', '720p', '1080p'],
            twitch: ['360p', '480p', '720p', '1080p']
        };
        
        this.currentVideoInfo = null;
    }

    bindEvents() {
        // Download button click
        const downloadBtn = document.getElementById('download-btn');
        const urlInput = document.getElementById('video-url');
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.handleDownloadClick();
            });
        }
        
        if (urlInput) {
            // Handle Enter key press
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleDownloadClick();
                }
            });
            
            // Auto-detect platform on input
            urlInput.addEventListener('input', (e) => {
                this.detectPlatform(e.target.value);
            });
        }
        
        // Platform item clicks
        document.querySelectorAll('.platform-item').forEach(item => {
            item.addEventListener('click', () => {
                const platform = item.getAttribute('data-platform');
                this.showPlatformInfo(platform);
            });
        });
    }

    async handleDownloadClick() {
        const urlInput = document.getElementById('video-url');
        const downloadBtn = document.getElementById('download-btn');
        const qualitySelector = document.getElementById('quality-selector');
        
        if (!urlInput || !downloadBtn) return;
        
        const url = urlInput.value.trim();
        
        if (!url) {
            this.showMessage(getTranslation('invalid_url'), 'error');
            return;
        }
        
        // Detect platform
        const platformInfo = this.detectPlatform(url);
        
        if (!platformInfo) {
            this.showMessage(getTranslation('platform_not_supported'), 'error');
            return;
        }
        
        // Show loading state
        this.setLoadingState(downloadBtn, true);
        
        try {
            // Simulate video info fetching
            const videoInfo = await this.fetchVideoInfo(url, platformInfo);
            
            if (videoInfo) {
                this.currentVideoInfo = videoInfo;
                this.showQualitySelector(platformInfo.platform, qualitySelector);
                this.setLoadingState(downloadBtn, false);
                this.showMessage(getTranslation('ready_to_download'), 'success');
            } else {
                throw new Error('Failed to fetch video info');
            }
            
        } catch (error) {
            this.setLoadingState(downloadBtn, false);
            this.showMessage(getTranslation('download_failed'), 'error');
            console.error('Download error:', error);
        }
    }

    detectPlatform(url) {
        if (!url) return null;
        
        for (const [platform, patterns] of Object.entries(this.platformPatterns)) {
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) {
                    return {
                        platform: platform,
                        id: match[1],
                        url: url
                    };
                }
            }
        }
        
        return null;
    }

    async fetchVideoInfo(url, platformInfo) {
        // Simulate API call to fetch video information
        // In real implementation, this would call your backend API
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock video info
                resolve({
                    title: `Video from ${platformInfo.platform.charAt(0).toUpperCase() + platformInfo.platform.slice(1)}`,
                    platform: platformInfo.platform,
                    id: platformInfo.id,
                    url: url,
                    thumbnail: `https://via.placeholder.com/320x180?text=${platformInfo.platform}`,
                    duration: '3:45',
                    qualities: this.qualityOptions[platformInfo.platform] || ['360p', '720p']
                });
            }, 2000); // Simulate 2 second processing time
        });
    }

    showQualitySelector(platform, selectorElement) {
        if (!selectorElement) return;
        
        const qualityOptions = this.qualityOptions[platform] || ['360p', '720p'];
        const optionsContainer = document.getElementById('quality-options');
        
        if (!optionsContainer) return;
        
        // Clear existing options
        optionsContainer.innerHTML = '';
        
        // Create quality option buttons
        qualityOptions.forEach(quality => {
            const option = document.createElement('div');
            option.className = 'quality-option';
            option.textContent = getTranslation(`quality_${quality.toLowerCase()}`) || quality;
            option.setAttribute('data-quality', quality);
            
            option.addEventListener('click', () => {
                this.selectQuality(option, quality);
            });
            
            optionsContainer.appendChild(option);
        });
        
        // Show quality selector
        selectorElement.style.display = 'block';
    }

    selectQuality(optionElement, quality) {
        // Remove selected class from all options
        document.querySelectorAll('.quality-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        optionElement.classList.add('selected');
        
        // Start download
        this.startDownload(quality);
    }

    async startDownload(quality) {
        if (!this.currentVideoInfo) return;
        
        try {
            // Simulate download process
            const downloadUrl = await this.generateDownloadUrl(this.currentVideoInfo, quality);
            
            // Create download link
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${this.currentVideoInfo.title.replace(/[^a-z0-9]/gi, '_')}_${quality}.mp4`;
            link.target = '_blank';
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Update statistics
            this.updateDownloadStats();
            
            this.showMessage(`${getTranslation('download_now')} - ${quality}`, 'success');
            
        } catch (error) {
            this.showMessage(getTranslation('download_failed'), 'error');
            console.error('Download start error:', error);
        }
    }

    async generateDownloadUrl(videoInfo, quality) {
        // In real implementation, this would call your backend API
        // For demo purposes, return a placeholder URL
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`/api/download?platform=${videoInfo.platform}&id=${videoInfo.id}&quality=${quality}`);
            }, 1000);
        });
    }

    setLoadingState(button, loading) {
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<div class="spinner"></div>' + getTranslation('processing');
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.innerHTML = '<span>' + getTranslation('download_now') + '</span>';
            button.classList.remove('loading');
        }
    }

    showMessage(message, type = 'info') {
        // Create or get message container
        let messageContainer = document.getElementById('message-container');
        
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }
        
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.style.cssText = `
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#6366f1'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        messageEl.textContent = message;
        
        // Add animation CSS
        if (!document.getElementById('message-styles')) {
            const styles = document.createElement('style');
            styles.id = 'message-styles';
            styles.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        messageContainer.appendChild(messageEl);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            messageEl.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 5000);
    }

    showPlatformInfo(platform) {
        const platformNames = {
            youtube: 'YouTube',
            tiktok: 'TikTok',
            facebook: 'Facebook',
            twitter: 'Twitter',
            dailymotion: 'Dailymotion',
            twitch: 'Twitch'
        };
        
        const platformName = platformNames[platform] || platform;
        this.showMessage(`${platformName} videos supported! Paste your ${platformName} URL above.`, 'info');
    }

    startStatsAnimation() {
        const stats = {
            totalDownloads: { element: document.getElementById('total-downloads'), target: 1247926, current: 0 },
            todayDownloads: { element: document.getElementById('today-downloads'), target: 8266, current: 0 },
            activeUsers: { element: document.getElementById('active-users'), target: 1850, current: 0 }
        };
        
        // Animate stats on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateStats(stats);
                    observer.unobserve(entry.target);
                }
            });
        });
        
        const statsSection = document.querySelector('.statistics');
        if (statsSection) {
            observer.observe(statsSection);
        }
        
        // Update stats periodically
        setInterval(() => {
            this.updateLiveStats(stats);
        }, 30000); // Update every 30 seconds
    }

    animateStats(stats) {
        Object.values(stats).forEach(stat => {
            if (!stat.element) return;
            
            const duration = 2000; // 2 seconds
            const steps = 60;
            const stepValue = stat.target / steps;
            const stepDuration = duration / steps;
            
            let currentStep = 0;
            
            const animate = () => {
                currentStep++;
                stat.current = Math.min(Math.floor(stepValue * currentStep), stat.target);
                stat.element.textContent = this.formatNumber(stat.current);
                
                if (currentStep < steps) {
                    setTimeout(animate, stepDuration);
                }
            };
            
            animate();
        });
    }

    updateLiveStats(stats) {
        // Simulate live updates
        stats.todayDownloads.target += Math.floor(Math.random() * 10) + 1;
        stats.totalDownloads.target += Math.floor(Math.random() * 10) + 1;
        stats.activeUsers.target += Math.floor(Math.random() * 5) - 2;
        
        // Ensure active users doesn't go below 1000
        if (stats.activeUsers.target < 1000) {
            stats.activeUsers.target = 1000 + Math.floor(Math.random() * 100);
        }
        
        // Update display
        Object.values(stats).forEach(stat => {
            if (stat.element) {
                stat.element.textContent = this.formatNumber(stat.target);
            }
        });
    }

    updateDownloadStats() {
        const totalDownloadsEl = document.getElementById('total-downloads');
        const todayDownloadsEl = document.getElementById('today-downloads');
        
        if (totalDownloadsEl) {
            const current = parseInt(totalDownloadsEl.textContent.replace(/,/g, ''));
            totalDownloadsEl.textContent = this.formatNumber(current + 1);
        }
        
        if (todayDownloadsEl) {
            const current = parseInt(todayDownloadsEl.textContent.replace(/,/g, ''));
            todayDownloadsEl.textContent = this.formatNumber(current + 1);
        }
    }

    formatNumber(num) {
        return num.toLocaleString();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VidGrb();
});

// Smooth scrolling for anchor links
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Handle scroll effects
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (header) {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(15, 15, 35, 0.98)';
        } else {
            header.style.background = 'rgba(15, 15, 35, 0.95)';
        }
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const urlInput = document.getElementById('video-url');
        if (urlInput) {
            urlInput.focus();
        }
    }
});

// Add paste event handling
document.addEventListener('paste', (e) => {
    const urlInput = document.getElementById('video-url');
    if (urlInput && document.activeElement === urlInput) {
        setTimeout(() => {
            // Auto-detect and show platform info after paste
            const vidgrb = new VidGrb();
            const platformInfo = vidgrb.detectPlatform(urlInput.value);
            if (platformInfo) {
                vidgrb.showPlatformInfo(platformInfo.platform);
            }
        }, 100);
    }
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VidGrb;
}
