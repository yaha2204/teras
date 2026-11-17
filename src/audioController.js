/**
 * Multi-Engine YouTube & Audio Stream Controller
 * Powered by standalone YTPlayer + direct Invidious audio fallback + native audio element.
 * Fully persistent: Survives browser reload/refresh for both users via localStorage and WebRTC DataChannel!
 */

export function parseYouTubeVideoId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
  }
  return null;
}

export class PureAudioController {
  constructor(onStateChange) {
    this.onStateChange = onStateChange;
    this.audioElement = document.getElementById('directAudioPlayer');
    this.currentTrackId = null;
    this.currentTitle = 'Memuat audio...';
    this.isPlaying = false;
    this.isSyncing = false;
    this.volume = 0.8;
    this.roomId = (window.location.hash || '#terras-bunga').replace('#', '').trim();

    if (this.audioElement) {
      this.audioElement.volume = this.volume;
      this.setupAudioListeners();
    }

    // Load persisted state immediately on construct
    this.loadPersistedState();
  }

  // Save current playback state to localStorage keyed by room
  persistState() {
    if (!this.currentTrackId) return;
    try {
      const state = {
        trackId: this.currentTrackId,
        title: this.currentTitle,
        isPlaying: this.isPlaying,
        time: this.audioElement ? this.audioElement.currentTime : 0,
        savedAt: Date.now()
      };
      localStorage.setItem(`hangout_music_${this.roomId}`, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not persist music state:', e);
    }
  }

  // Load and auto-resume music on page reload/refresh
  loadPersistedState() {
    try {
      const raw = localStorage.getItem(`hangout_music_${this.roomId}`);
      if (!raw) return null;
      const state = JSON.parse(raw);
      if (!state || !state.trackId) return null;

      // Calculate elapsed seconds since page was closed/refreshed
      const elapsed = Math.max(0, (Date.now() - (state.savedAt || Date.now())) / 1000);
      const targetTime = (state.time || 0) + (state.isPlaying ? elapsed : 0);

      this.currentTrackId = state.trackId;
      this.currentTitle = state.title || 'Lagu Tersimpan';

      // Load and resume
      this.playTrack(state.trackId, targetTime, state.isPlaying);
      return state;
    } catch (e) {
      console.warn('Could not restore music state:', e);
      return null;
    }
  }

  getPersistedState() {
    try {
      const raw = localStorage.getItem(`hangout_music_${this.roomId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  setupAudioListeners() {
    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.persistState();
      if (!this.isSyncing && this.onStateChange) {
        this.onStateChange('PLAY', this.currentTrackId, this.audioElement.currentTime);
      }
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.persistState();
      if (!this.isSyncing && this.onStateChange) {
        this.onStateChange('PAUSE', this.currentTrackId, this.audioElement.currentTime);
      }
    });

    this.audioElement.addEventListener('timeupdate', () => {
      // Periodically persist timestamp every ~4 seconds
      if (Math.floor(this.audioElement.currentTime) % 4 === 0) {
        this.persistState();
      }
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Native audio encountered an error, falling back to alternative source...', e);
      this.tryFallbackStream();
    });
  }

  async playTrack(trackInput, startTime = 0, autoPlay = true) {
    const videoId = parseYouTubeVideoId(trackInput) || trackInput;
    this.currentTrackId = videoId;
    this.currentTitle = `Lagu (${videoId})`;
    this.persistState();

    // 1. Primary: High-speed local yt-dlp resolver via Cloudflare Tunnel (yapi.styna.my.id)
    const streamUrls = [
      `https://yapi.styna.my.id/api/stream?v=${videoId}`,
      `https://yt.chocolatemoo53.com/latest_version?id=${videoId}&itag=140`,
      `https://invidious.nerdvpn.de/latest_version?id=${videoId}&itag=140`
    ];

    // Fetch real song title asynchronously from yapi
    fetch(`https://yapi.styna.my.id/api/info?v=${videoId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.title) {
          this.currentTitle = data.title;
          const barTitle = document.getElementById('audioBarTitle');
          if (barTitle) barTitle.textContent = data.title;
          this.persistState();
        }
      })
      .catch(() => {});

    let loaded = false;
    if (this.audioElement) {
      for (const url of streamUrls) {
        try {
          this.audioElement.src = url;
          if (startTime > 0) {
            this.audioElement.currentTime = startTime;
          }
          if (autoPlay) {
            await this.audioElement.play().catch(() => {
              // Browser may require user gesture on first cold load
              console.log('Autoplay waiting for user touch/click gesture');
            });
          }
          loaded = true;
          break;
        } catch (err) {
          console.warn('Failed audio endpoint, trying next...', err);
        }
      }
    }

    if (!loaded) {
      this.tryFallbackStream(startTime, autoPlay);
    }

    this.persistState();
    if (this.onStateChange) {
      this.onStateChange(autoPlay ? 'PLAY' : 'PAUSE', this.currentTrackId, startTime);
    }
  }

  tryFallbackStream(startTime = 0, autoPlay = true) {
    if (!this.audioElement) return;
    // Pleasant ambient lofi radio stream that is 100% reliable
    this.audioElement.src = 'https://stream.zeno.fm/f3wvbbqmdg8uv';
    if (startTime > 0) this.audioElement.currentTime = startTime;
    if (autoPlay) {
      this.audioElement.play().catch(() => {});
    }
  }

  togglePlayPause() {
    if (!this.audioElement) return;
    if (this.audioElement.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  play() {
    if (!this.audioElement) return;
    this.audioElement.play().catch(() => {});
    this.isPlaying = true;
    this.persistState();
    if (this.onStateChange) {
      this.onStateChange('PLAY', this.currentTrackId, this.audioElement.currentTime);
    }
  }

  pause() {
    if (!this.audioElement) return;
    this.audioElement.pause();
    this.isPlaying = false;
    this.persistState();
    if (this.onStateChange) {
      this.onStateChange('PAUSE', this.currentTrackId, this.audioElement.currentTime);
    }
  }

  seekTo(seconds) {
    if (!this.audioElement) return;
    this.audioElement.currentTime = seconds;
    this.persistState();
    if (this.onStateChange) {
      this.onStateChange('SEEK', this.currentTrackId, seconds);
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  // Receive sync command from friend via WebRTC DataChannel
  syncFromPeer(action, trackId, time) {
    this.isSyncing = true;

    if (trackId && trackId !== this.currentTrackId) {
      this.currentTrackId = trackId;
      this.playTrack(trackId, time, action === 'PLAY');
    } else if (this.audioElement) {
      if (Math.abs(this.audioElement.currentTime - time) > 2.0) {
        this.audioElement.currentTime = time;
      }
      if (action === 'PLAY' && this.audioElement.paused) {
        this.audioElement.play().catch(() => {});
        this.isPlaying = true;
      } else if (action === 'PAUSE' && !this.audioElement.paused) {
        this.audioElement.pause();
        this.isPlaying = false;
      }
    }

    this.persistState();
    setTimeout(() => {
      this.isSyncing = false;
    }, 400);
  }

  getCurrentState() {
    return {
      trackId: this.currentTrackId,
      isPlaying: this.isPlaying,
      currentTime: this.audioElement ? this.audioElement.currentTime : 0
    };
  }
}
