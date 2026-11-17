/**
 * Main Application Orchestrator for Cozy Flower Terrace & Car Cruise
 */
import { Engine3D } from './engine3d.js?v=20261116tidur1';
import { NetworkManager } from './network.js?v=20261116tidur1';
import { PureAudioController, parseYouTubeVideoId } from './audioController.js?v=20261116tidur1';
import { ThaloriaApiClient } from './apiClient.js?v=20261116tidur1';

// apiClient.js membaca global ini — petakan dari env Vite (Vercel) atau script injection.
window.__SUPABASE_URL = window.__SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
window.__SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Setup or Retrieve Room Hash
function getOrCreateRoomId() {
  let hash = window.location.hash.replace('#', '').trim();
  if (!hash) {
    hash = 'terras-' + Math.random().toString(36).substring(2, 7);
    window.location.hash = hash;
  }
  return hash;
}

// Local Storage Profile Cache
function loadProfile() {
  const saved = localStorage.getItem('cozy_user_profile');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return {
    name: 'Warga ' + Math.floor(Math.random() * 900 + 100),
    gender: 'boy', // 'boy' or 'girl'
    shirtColor: '#f28482',
    hairColor: '#4a3b32'
  };
}

function saveProfile(profile) {
  localStorage.setItem('cozy_user_profile', JSON.stringify(profile));
}

// Toast Notification Helper
function showToast(text, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  // If in driving mode, keep toast discreet or skip so it never blocks the windshield view
  const driveHUD = document.getElementById('driveControlsBar');
  if (driveHUD && !driveHUD.classList.contains('hidden') && text.includes('menyetir')) {
    return;
  }
  toast.textContent = text;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

// Application Lifecycle
window.addEventListener('DOMContentLoaded', () => {
  const roomId = getOrCreateRoomId();
  const profile = loadProfile();

  // Database client: lokal dulu, fallback Supabase. Semua pemanggilan bersifat
  // fire-and-forget supaya game tetap jalan walau backend tidak tersedia.
  const apiClient = new ThaloriaApiClient({
    localUrl: import.meta.env.VITE_DB_LOCAL_URL || undefined,
    supabaseUrl: window.__SUPABASE_URL,
    supabaseKey: window.__SUPABASE_ANON_KEY
  });
  window.terasApi = apiClient;

  // Update Room Header
  const roomTitleEl = document.getElementById('roomTitle');
  if (roomTitleEl) roomTitleEl.textContent = '#' + roomId;

  const currentRoomCodeText = document.getElementById('currentRoomCodeText');
  if (currentRoomCodeText) currentRoomCodeText.textContent = '#' + roomId;

  // Initialize Canvas 3D Isometric Engine
  const canvas = document.getElementById('gameCanvas');
  const engine = new Engine3D(canvas);

  // Apply Initial Profile to Local Player
  engine.localPlayer.name = profile.name;
  engine.localPlayer.shirtColor = profile.shirtColor;
  engine.localPlayer.hairColor = profile.hairColor;
  engine.updateAvatarAppearance(engine.localPlayer);

  // Initialize Pure Audio Controller (No Video, No Iframe Blocks!)
  const audioController = new PureAudioController((action, trackId, currentTime) => {
    updatePlayPauseButton(action === 'PLAY');
    network.broadcast({
      type: 'YT_SYNC',
      action: action,
      videoId: trackId,
      time: currentTime
    });
    syncRoomState();
  });

  // --- Sinkronisasi state ruangan ke backend (fire-and-forget) ---
  function readMusicState() {
    if (!audioController.currentTrackId) return { videoId: '', action: 'pause', time: 0 };
    return {
      action: audioController.isPlaying ? 'PLAY' : 'PAUSE',
      videoId: audioController.currentTrackId,
      time: audioController.audioElement ? audioController.audioElement.currentTime : 0
    };
  }

  let roomSyncTimer = null;
  function syncRoomState() {
    if (!apiClient || apiClient.activeMode === 'offline' || apiClient.activeMode === 'probing') return;
    clearTimeout(roomSyncTimer);
    roomSyncTimer = setTimeout(() => {
      const sirenBtn = document.getElementById('btnSirenToggle');
      Promise.resolve(apiClient.updateRoomState(roomId, {
        current_scene: engine.currentSceneName || 'terrace',
        music_state: readMusicState(),
        siren_mode: !!(sirenBtn && sirenBtn.classList.contains('active'))
      })).catch(() => {});
    }, 250);
  }

  // Daftarkan ruangan ke backend bila tersedia (diabaikan kalau gagal).
  Promise.resolve(apiClient.createRoom({
    roomCode: roomId,
    roomName: `${profile.name}'s Teras`,
    initialScene: 'terrace'
  })).then(syncRoomState).catch(() => {});

  // Connection status element in Menu
  const menuConnectionStatusText = document.getElementById('menuConnectionStatusText');

  // Initialize PeerJS Network
  const voiceStatusEl = document.getElementById('voiceStatus');
  const network = new NetworkManager(roomId, profile, {
    onPeerJoin: (peerId) => {
      showToast('Temanmu telah bergabung ke teras bunga! 🌸');
      if (menuConnectionStatusText) {
        menuConnectionStatusText.textContent = 'Status Teman: Teman online di teras bunga! 💖';
      }
      if (audioController.currentTrackId) {
        network.broadcast({
          type: 'YT_SYNC',
          action: audioController.isPlaying ? 'PLAY' : 'PAUSE',
          videoId: audioController.currentTrackId,
          time: audioController.audioElement ? audioController.audioElement.currentTime : 0
        });
      }
    },
    onPeerLeave: (peerId) => {
      engine.removeRemotePlayer(peerId);
      showToast('Temanmu meninggalkan teras.');
      if (voiceStatusEl) voiceStatusEl.textContent = 'Panggilan: Teman Terputus';
      if (menuConnectionStatusText) {
        menuConnectionStatusText.textContent = 'Status Teman: Menunggu teman bergabung...';
      }
    },
    onPeerData: (peerId, data) => {
      if (!data || !data.type) return;

      if (data.type === 'MOVE') {
        engine.updatePlayerState(peerId, data);
      } else if (data.type === 'PROFILE') {
        engine.updatePlayerState(peerId, data);
        const hairC = data.hairColor || (data.profile && data.profile.hairColor);
        const shirtC = data.shirtColor || (data.profile && data.profile.shirtColor);
        const gender = data.gender || (data.profile && data.profile.gender) || 'cewe';
        engine.updateCompanionAppearance(hairC, shirtC, gender);
      } else if (data.type === 'CHAT') {
        appendChatMessage(data.name || 'Teman', data.text, false);
        showToast(`${data.name || 'Teman'}: ${data.text}`);
      } else if (data.type === 'YT_SYNC') {
        audioController.syncFromPeer(data.action, data.videoId, data.time);
        updateNowPlayingDisplay(data.videoId);
        updatePlayPauseButton(data.action === 'PLAY');
      } else if (data.type === 'DRIVER_ROLE') {
        engine.setDriverRole(data.role === 'local' ? 'remote' : 'local');
        showToast('Sopir mobil diganti oleh temanmu 🚗');
      } else if (data.type === 'CAR_DRIVE_SYNC') {
        // Synchronize car physics if friend is driving
        if (engine.driverRole === 'remote') {
          engine.carSteerX = data.carSteerX;
          if (data.speed) {
            engine.driveSpeed = data.speed;
            if (engine.onSpeedChange) engine.onSpeedChange(data.speed);
          }
        }
      } else if (data.type === 'BED_ACTION') {
        // Synchronize friend laying down on bed
        if (engine.remotePlayers.has(peerId)) {
          const rPlayer = engine.remotePlayers.get(peerId);
          rPlayer.isSleeping = data.isSleeping;
          if (data.isSleeping) {
            rPlayer.x = data.bedX;
            rPlayer.z = data.bedZ;
            rPlayer.targetX = data.bedX;
            rPlayer.targetZ = data.bedZ;
            rPlayer.bedLabel = data.label;
            rPlayer.sleepHeight = data.heightY;
            showToast(`${rPlayer.name || 'Temanmu'} sedang rebahan di tempat tidur ${data.label || ''} 🛏️`);
          } else {
            rPlayer.bedLabel = null;
            rPlayer.sleepHeight = null;
            showToast(`${rPlayer.name || 'Temanmu'} sudah bangun dari kasur ☀️`);
          }
        }
      } else if (data.type === 'CAR_SCENE_TRANSITION') {
        // Auto-board the car together! When one enters drive mode, friend joins the car!
        if (data.scene === 'drive' && engine.currentSceneName !== 'drive') {
          engine.switchScene('drive');
          showToast('Temanmu mengajakmu jalan-jalan naik mobil bareng! 🚗💖');
        } else if (data.scene !== 'drive' && engine.currentSceneName === 'drive') {
          engine.switchScene('interior', 0, 4.8);
          showToast('Temanmu mengajak kembali ke rumah 🏡');
        }

        // Keep audio streaming in perfect sync across scene transition!
        if (data.audioSync && data.audioSync.videoId) {
          audioController.syncFromPeer(data.audioSync.action, data.audioSync.videoId, data.audioSync.time);
        } else if (audioController.currentTrackId) {
          audioController.loadPersistedState();
        }
      } else if (data.type === 'SIREN_TOGGLE') {
        engine.toggleSirenMode(data.enabled);
        const btnSiren = document.getElementById('btnSirenToggle');
        if (btnSiren) {
          btnSiren.textContent = data.enabled ? '🚨 Sirine: ON' : '🚨 Sirine: OFF';
          btnSiren.classList.toggle('active', data.enabled);
        }
        showToast(data.enabled ? '🚨 Temanmu menyalakan sirine! Semua kendaraan minggir memberi jalan!' : 'Sirine darurat dimatikan');
      }
    },
    onVoiceConnected: (peerId) => {
      if (voiceStatusEl) voiceStatusEl.textContent = 'Panggilan: Terhubung 🎙️';
      showToast('Voice call terhubung langsung! 💖');
    }
  });

  // Hook Engine Player Action (e.g. Sleeping on Bed)
  engine.onPlayerAction = (action, meta) => {
    if (action === 'SLEEP_BED') {
      showToast(`Kamu sedang rebahan santai di kasur ${meta.label}! 🛏️✨`);
      network.broadcast({
        type: 'BED_ACTION',
        isSleeping: true,
        bedX: meta.bedX,
        bedZ: meta.bedZ
      });
    } else if (action === 'WAKE_UP') {
      showToast('Bangun dari tempat tidur ☀️');
      network.broadcast({
        type: 'BED_ACTION',
        isSleeping: false
      });
    }
  };
  engine.onCarDriveSync = (carData) => {
    network.broadcast({
      type: 'CAR_DRIVE_SYNC',
      ...carData
    });
  };

  // Hook Engine Player Movement to Network Broadcast
  engine.onPlayerMove = (moveData) => {
    network.broadcast({
      type: 'MOVE',
      ...moveData
    });
  };

  // Hook Engine Scene Change
  const switchRoomText = document.getElementById('switchRoomText');
  const driveControlsBar = document.getElementById('driveControlsBar');
  const btnDriveCar = document.getElementById('btnDriveCar');

  engine.onSceneChange = (scene) => {
    syncRoomState();

    if (switchRoomText) {
      if (scene === 'terrace') switchRoomText.textContent = 'Masuk ke Rumah';
      else if (scene === 'interior') switchRoomText.textContent = 'Keluar ke Teras';
      else switchRoomText.textContent = 'Kembali ke Rumah';
    }

    if (driveControlsBar) {
      if (scene === 'drive') driveControlsBar.classList.remove('hidden');
      else driveControlsBar.classList.add('hidden');
    }

    if (scene === 'terrace') {
      showToast('Kamu berada di Teras Bunga 🌸');
    } else if (scene === 'interior') {
      showToast('Kamu masuk ke Ruang Rumah Luas 🏡');
    } else if (scene === 'drive') {
      const bottomHud = document.querySelector('.bottom-hud');
      if (bottomHud) bottomHud.style.display = 'none';
      const topHud = document.querySelector('.top-hud');
      if (topHud) topHud.style.display = 'none';
      if (chatSidebar) chatSidebar.classList.add('collapsed');
      if (btnOpenChatFloating) btnOpenChatFloating.classList.remove('hidden');
    }
  };

  engine.onSceneLeave = (prevScene) => {
    if (prevScene === 'drive') {
      const bottomHud = document.querySelector('.bottom-hud');
      if (bottomHud) bottomHud.style.display = '';
      const topHud = document.querySelector('.top-hud');
      if (topHud) topHud.style.display = '';
    }
  };

  // Wire Switch Room Button
  const btnSwitchRoom = document.getElementById('btnSwitchRoom');
  if (btnSwitchRoom) {
    btnSwitchRoom.addEventListener('click', () => {
      if (engine.currentSceneName === 'terrace') {
        engine.switchScene('interior', 0, 4.0);
      } else {
        engine.switchScene('terrace', 0, -2.5);
      }
    });
  }

  // Wire Throttle Speed Slider
  const carThrottleSlider = document.getElementById('carThrottleSlider');
  const throttleSpeedLabel = document.getElementById('throttleSpeedLabel');
  if (carThrottleSlider) {
    carThrottleSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      engine.driveSpeed = val;
      const kmh = Math.round(val * 100);
      if (throttleSpeedLabel) throttleSpeedLabel.textContent = `${kmh} km/j`;

      // Broadcast throttle speed to companion
      network.broadcast({
        type: 'CAR_DRIVE_SYNC',
        carX: engine.driveCar ? engine.driveCar.position.x : 0,
        carSteerX: engine.carSteerX,
        speed: engine.driveSpeed
      });
    });
  }

  // Update slider UI when speed changes dynamically
  const origAnimate = engine.animate;
  engine.onSpeedChange = (speed) => {
    if (carThrottleSlider) carThrottleSlider.value = speed;
    if (throttleSpeedLabel) throttleSpeedLabel.textContent = `${Math.round(speed * 100)} km/j`;
  };

  // Wire Auto-Pilot & Day/Night Toggles
  const btnAutoPilotToggle = document.getElementById('btnAutoPilotToggle');
  if (btnAutoPilotToggle) {
    btnAutoPilotToggle.addEventListener('click', () => {
      engine.isAutoPilot = !engine.isAutoPilot;
      if (engine.isAutoPilot) {
        btnAutoPilotToggle.textContent = '🛡️ Auto-Pilot: ON';
        btnAutoPilotToggle.classList.add('active');
        showToast('Mode Auto-Pilot aktif: Otomatis rem & hindari tabrakan! 🛡️');
      } else {
        btnAutoPilotToggle.textContent = '⚡ Manual Rusuh: ON';
        btnAutoPilotToggle.classList.remove('active');
        showToast('Mode Manual Rusuh aktif: Tabrak mobil/motor NPC sampai mental! 💥🚗');
      }
    });
  }

  const btnDayNightToggle = document.getElementById('btnDayNightToggle');
  if (btnDayNightToggle) {
    btnDayNightToggle.addEventListener('click', () => {
      const isNight = engine.toggleDayNight();
      btnDayNightToggle.textContent = isNight ? '🌙 Malam' : '☀️ Siang';
      showToast(isNight ? 'Suasana malam berbintang romantis 🌙✨' : 'Suasana pagi cerah berawan ☀️☁️');
    });
  }

  // Wire Emergency Siren Mode Toggle Button
  const btnSirenToggle = document.getElementById('btnSirenToggle');
  if (btnSirenToggle) {
    btnSirenToggle.addEventListener('click', () => {
      const isSiren = engine.toggleSirenMode();
      btnSirenToggle.textContent = isSiren ? '🚨 Sirine: ON' : '🚨 Sirine: OFF';
      btnSirenToggle.classList.toggle('active', isSiren);
      showToast(isSiren ? '🚨 Mode Sirine Aktif! Semua mobil & motor minggir ke bahu jalan!' : 'Sirine darurat dimatikan');

      network.broadcast({
        type: 'SIREN_TOGGLE',
        enabled: isSiren
      });
      syncRoomState();
    });
  }

  engine.onCrashBounce = () => {
    // Pure silent cartoony bounce with zero annoying popups / toasts!
  };

  // Wire Drive Car Button (Transisi ke Mode Mobil)
  if (btnDriveCar) {
    btnDriveCar.addEventListener('click', () => {
      const audioSyncData = audioController.currentTrackId ? {
        action: audioController.isPlaying ? 'PLAY' : 'PAUSE',
        videoId: audioController.currentTrackId,
        time: audioController.audioElement ? audioController.audioElement.currentTime : 0
      } : null;

      if (engine.currentSceneName !== 'drive') {
        engine.switchScene('drive');
        // Broadcast to companion to hop in the car together with synchronized music!
        network.broadcast({
          type: 'CAR_SCENE_TRANSITION',
          scene: 'drive',
          audioSync: audioSyncData
        });
      } else {
        engine.switchScene('interior', 0, 4.8);
        network.broadcast({
          type: 'CAR_SCENE_TRANSITION',
          scene: 'interior',
          audioSync: audioSyncData
        });
      }
    });
  }

  // Driving Controller HUD actions
  const btnExitCar = document.getElementById('btnExitCar');
  if (btnExitCar) {
    btnExitCar.addEventListener('click', () => {
      engine.switchScene('interior', 0, 4.8);
      const audioSyncData = audioController.currentTrackId ? {
        action: audioController.isPlaying ? 'PLAY' : 'PAUSE',
        videoId: audioController.currentTrackId,
        time: audioController.audioElement ? audioController.audioElement.currentTime : 0
      } : null;

      network.broadcast({
        type: 'CAR_SCENE_TRANSITION',
        scene: 'interior',
        audioSync: audioSyncData
      });
      showToast('Kembali ke rumah yang hangat 🏡');
    });
  }

  // Wire Switch Driver & Driving POV Controls
  const btnSwitchDriver = document.getElementById('btnSwitchDriver');
  const btnCarLookLeft = document.getElementById('btnCarLookLeft');
  const btnCarLookCenter = document.getElementById('btnCarLookCenter');
  const btnCarLookRight = document.getElementById('btnCarLookRight');

  let currentDriver = 'local';
  if (btnSwitchDriver) {
    btnSwitchDriver.addEventListener('click', () => {
      currentDriver = (currentDriver === 'local') ? 'remote' : 'local';
      engine.setDriverRole(currentDriver);
      btnSwitchDriver.textContent = currentDriver === 'local' ? '🔄 Ganti Sopir (Kamu)' : '🔄 Ganti Sopir (Temanmu)';
      showToast(currentDriver === 'local' ? 'Kamu yang pegang kemudi setir! 🚗' : 'Temanmu yang pegang kemudi setir! 🚗');

      // Broadcast to peer
      network.broadcast({
        type: 'DRIVER_ROLE',
        role: currentDriver
      });
    });
  }

  function setActiveLookButton(btn) {
    [btnCarLookLeft, btnCarLookCenter, btnCarLookRight].forEach(b => {
      if (b) b.classList.remove('active');
    });
    if (btn) btn.classList.add('active');
  }

  if (btnCarLookLeft) {
    btnCarLookLeft.addEventListener('click', () => {
      engine.setCarLookAngle(-0.55); // POV lihat ke kiri pemandangan
      setActiveLookButton(btnCarLookLeft);
      showToast('👀 Melihat pemandangan kiri');
    });
  }

  if (btnCarLookCenter) {
    btnCarLookCenter.addEventListener('click', () => {
      engine.setCarLookAngle(0); // POV lurus ke depan
      setActiveLookButton(btnCarLookCenter);
      showToast('👀 Menatap jalanan depan');
    });
  }

  if (btnCarLookRight) {
    btnCarLookRight.addEventListener('click', () => {
      // Look into the passenger seat at your friend, or out the window!
      engine.setCarLookAngle(0.68);
      setActiveLookButton(btnCarLookRight);
      showToast('👀 Menoleh ke teman di sebelahmu 💖');
    });
  }

  // Minimize/Restore YouTube Floating Player
  const btnMinimizePlayer = document.getElementById('btnMinimizePlayer');
  const ytPlayerContainer = document.getElementById('ytPlayerContainer');
  if (btnMinimizePlayer && ytPlayerContainer) {
    btnMinimizePlayer.addEventListener('click', () => {
      ytPlayerContainer.classList.toggle('minimized');
      btnMinimizePlayer.textContent = ytPlayerContainer.classList.contains('minimized') ? '🗖' : '−';
    });
  }

  const btnCarSpeed = document.getElementById('btnCarSpeed');
  if (btnCarSpeed) {
    let speedTier = 1;
    btnCarSpeed.addEventListener('click', () => {
      speedTier = (speedTier + 1) % 3;
      if (speedTier === 0) {
        engine.driveSpeed = 0.35;
        btnCarSpeed.textContent = '⚡ Pelan (20 km/h)';
      } else if (speedTier === 1) {
        engine.driveSpeed = 0.65;
        btnCarSpeed.textContent = '⚡ Santai (45 km/h)';
      } else {
        engine.driveSpeed = 1.05;
        btnCarSpeed.textContent = '⚡ Cepat (70 km/h)';
      }
    });
  }

  // Hook 3D Interactive Object Click (Boombox on table)
  engine.onInteractObject = (obj) => {
    if (obj === 'boombox') {
      openMusicModal();
    }
  };

  // Wire Sidebar Chat
  const chatSidebar = document.getElementById('chatSidebar');
  const btnToggleChatSidebar = document.getElementById('btnToggleChatSidebar');
  const btnOpenChatFloating = document.getElementById('btnOpenChatFloating');
  const chatMessagesList = document.getElementById('chatMessagesList');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatUnreadDot = document.getElementById('chatUnreadDot');

  function appendChatMessage(senderName, text, isMe) {
    if (!chatMessagesList) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg ' + (isMe ? 'me' : 'them');
    msgEl.textContent = (isMe ? '' : senderName + ': ') + text;
    chatMessagesList.appendChild(msgEl);
    chatMessagesList.scrollTop = chatMessagesList.scrollHeight;

    // Show unread dot if sidebar is collapsed
    if (chatSidebar && chatSidebar.classList.contains('collapsed') && chatUnreadDot) {
      chatUnreadDot.classList.remove('hidden');
    }
  }

  if (btnToggleChatSidebar && chatSidebar) {
    btnToggleChatSidebar.addEventListener('click', () => {
      chatSidebar.classList.add('collapsed');
      if (btnOpenChatFloating) btnOpenChatFloating.classList.remove('hidden');
    });
  }

  if (btnOpenChatFloating && chatSidebar) {
    btnOpenChatFloating.addEventListener('click', () => {
      chatSidebar.classList.remove('collapsed');
      if (chatUnreadDot) chatUnreadDot.classList.add('hidden');
      if (chatInput) chatInput.focus();
    });
  }

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      appendChatMessage(engine.localPlayer.name, text, true);

      // Broadcast to peer
      network.broadcast({
        type: 'CHAT',
        name: engine.localPlayer.name,
        text: text
      });

      chatInput.value = '';
    });
  }

  // Wire Zoom & Fullscreen Controls
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      engine.zoomIn();
      showToast('Zoom In 🔍');
    });
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      engine.zoomOut();
      showToast('Zoom Out 🔍');
    });
  }

  // Setup Fullscreen & Auto-Landscape Lock (Android & Desktop)
  async function toggleFullscreenAndLandscape() {
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        }

        // Auto-lock orientation to Landscape on Android
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape').catch(() => {});
        }
        showToast('Layar penuh aktif! Mode Landscape ⛶');
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  }

  const btnFullscreen = document.getElementById('btnFullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', toggleFullscreenAndLandscape);
  }

  const btnDriveFullscreen = document.getElementById('btnDriveFullscreen');
  if (btnDriveFullscreen) {
    btnDriveFullscreen.addEventListener('click', toggleFullscreenAndLandscape);
  }

  document.addEventListener('fullscreenchange', () => {
    const isFull = !!document.fullscreenElement;
    if (btnFullscreen) btnFullscreen.textContent = isFull ? '✕' : '⛶';
    if (btnDriveFullscreen) btnDriveFullscreen.textContent = isFull ? '✕ Normal' : '⛶ Fullscreen';
  });

  // Wire Room & Join Code Menu (Pengganti Kota)
  const cityMenuModal = document.getElementById('cityMenuModal');
  const btnOpenCityMenu = document.getElementById('btnOpenCityMenu');
  const btnCloseCityMenu = document.getElementById('btnCloseCityMenu');
  const joinCodeInput = document.getElementById('joinCodeInput');
  const btnSubmitJoinCode = document.getElementById('btnSubmitJoinCode');
  const btnCopyRoomCode = document.getElementById('btnCopyRoomCode');

  function openCityMenu() {
    cityMenuModal.classList.remove('hidden');
    joinCodeInput.focus();
  }

  function closeCityMenu() {
    cityMenuModal.classList.add('hidden');
  }

  btnOpenCityMenu.addEventListener('click', openCityMenu);
  btnCloseCityMenu.addEventListener('click', closeCityMenu);
  cityMenuModal.addEventListener('click', (e) => {
    if (e.target === cityMenuModal) closeCityMenu();
  });

  // Handle Joining Another Room
  btnSubmitJoinCode.addEventListener('click', () => {
    let raw = joinCodeInput.value.trim();
    if (!raw) {
      showToast('Masukkan kode kamar terlebih dahulu!');
      return;
    }
    // Parse link if user pasted complete URL
    let targetRoom = raw;
    if (raw.includes('#')) {
      targetRoom = raw.split('#')[1];
    } else if (raw.includes('/')) {
      targetRoom = raw.split('/').pop();
    }
    targetRoom = targetRoom.replace('#', '').trim();
    if (targetRoom) {
      window.location.hash = targetRoom;
      window.location.reload();
    }
  });

  // Handle Copy Room Code Button inside Menu
  btnCopyRoomCode.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link teras bunga berhasil disalin! 🌸');
    } catch (err) {
      showToast('Gagal menyalin link.');
    }
  });

  // Wire Copy Link Button on HUD
  const btnCopyLink = document.getElementById('btnCopyLink');
  btnCopyLink.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link kamar berhasil disalin! Kirimkan ke temanmu 💖');
    } catch (err) {
      showToast('Gagal menyalin link secara otomatis.');
    }
  });

  // Wire Single Unified Mic Toggle Button (Clear ON / OFF + Chrome Native Permission Prompt)
  const btnMic = document.getElementById('btnMic');
  const micIcon = document.getElementById('micIcon');
  const micLabel = document.getElementById('micLabel');

  if (btnMic) {
    btnMic.addEventListener('click', async () => {
      try {
        const isEnabled = await network.toggleMic();
        if (isEnabled) {
          btnMic.className = 'mic-toggle-btn on';
          if (micIcon) micIcon.textContent = '🎙️';
          if (micLabel) micLabel.textContent = 'Mic: ON';
          showToast('Mikrofon aktif (ON) 🎙️');
        } else {
          btnMic.className = 'mic-toggle-btn off';
          if (micIcon) micIcon.textContent = '🔇';
          if (micLabel) micLabel.textContent = 'Mic: OFF';
          showToast('Mikrofon dimatikan (OFF) 🔇');
        }
      } catch (err) {
        btnMic.className = 'mic-toggle-btn off';
        if (micIcon) micIcon.textContent = '🔇';
        if (micLabel) micLabel.textContent = 'Mic: OFF';
        showToast('Izin akses mikrofon ditolak / diblokir Chrome ⚠️');
      }
    });
  }

  // Wire Music Modal & Controls
  const musicModal = document.getElementById('musicModal');
  const btnToggleMusicModal = document.getElementById('btnToggleMusicModal');
  const btnOpenMusicShortcut = document.getElementById('btnOpenMusicShortcut');
  const btnCloseMusicModal = document.getElementById('btnCloseMusicModal');
  const btnApplyYtUrl = document.getElementById('btnApplyYtUrl');
  const ytUrlInput = document.getElementById('ytUrlInput');
  const nowPlayingTitle = document.getElementById('nowPlayingTitle');
  const btnPlayPause = document.getElementById('btnPlayPause');

  function openMusicModal() {
    musicModal.classList.remove('hidden');
    ytUrlInput.focus();
  }

  function closeMusicModal() {
    musicModal.classList.add('hidden');
  }

  function updateNowPlayingDisplay(videoId) {
    if (nowPlayingTitle) {
      nowPlayingTitle.textContent = `Memutar: Video [${videoId}]`;
    }
  }

  function updatePlayPauseButton(playing) {
    if (btnPlayPause) {
      btnPlayPause.textContent = playing ? '⏸️' : '▶️';
    }
  }

  btnToggleMusicModal.addEventListener('click', openMusicModal);
  if (btnOpenMusicShortcut) btnOpenMusicShortcut.addEventListener('click', openMusicModal);
  btnCloseMusicModal.addEventListener('click', closeMusicModal);
  musicModal.addEventListener('click', (e) => {
    if (e.target === musicModal) closeMusicModal();
  });

  function startMusicTrack(url) {
    const videoId = parseYouTubeVideoId(url) || url;
    if (!videoId) {
      showToast('Masukkan link atau nama lagu terlebih dahulu!');
      return;
    }
    audioController.playTrack(videoId, 0);
    updatePlayPauseButton(true);
    closeMusicModal();
    showToast('Memutar audio musik di teras & mobil! 🎶');
  }

  btnApplyYtUrl.addEventListener('click', () => {
    startMusicTrack(ytUrlInput.value);
  });

  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const url = chip.getAttribute('data-url');
      startMusicTrack(url);
    });
  });

  btnPlayPause.addEventListener('click', () => {
    if (audioController.isPlaying) {
      audioController.pause();
      updatePlayPauseButton(false);
    } else {
      audioController.play();
      updatePlayPauseButton(true);
    }
  });

  const btnFloatingPlayPause = document.getElementById('btnFloatingPlayPause');
  if (btnFloatingPlayPause) {
    btnFloatingPlayPause.addEventListener('click', () => {
      if (audioController.isPlaying) {
        audioController.pause();
        updatePlayPauseButton(false);
      } else {
        audioController.play();
        updatePlayPauseButton(true);
      }
    });
  }

  const btnFloatingOpenModal = document.getElementById('btnFloatingOpenModal');
  if (btnFloatingOpenModal) {
    btnFloatingOpenModal.addEventListener('click', openMusicModal);
  }

  // Wire Avatar Customization Modal
  const avatarModal = document.getElementById('avatarModal');
  const btnCustomize = document.getElementById('btnCustomize');
  const btnProfileBadge = document.getElementById('btnProfileBadge');
  const btnCloseAvatarModal = document.getElementById('btnCloseAvatarModal');
  const playerNameInput = document.getElementById('playerNameInput');
  const btnSaveAvatar = document.getElementById('btnSaveAvatar');
  const shirtColorsContainer = document.getElementById('shirtColorOptions');
  const hairColorsContainer = document.getElementById('hairColorOptions');
  const hudPlayerName = document.getElementById('hudPlayerName');
  const avatarIcoHair = document.getElementById('avatarIcoHair');
  const avatarIcoFrame = document.querySelector('.avatar-ico-frame');

  function updateHudProfileDisplay(pName, pHair, pShirt) {
    if (hudPlayerName) hudPlayerName.textContent = pName;
    if (avatarIcoHair) avatarIcoHair.style.backgroundColor = pHair;
    if (avatarIcoFrame) avatarIcoFrame.style.backgroundColor = pShirt;
  }

  // Initial update
  updateHudProfileDisplay(profile.name, profile.hairColor, profile.shirtColor);

  // Performance Switcher: Standard or Potato Mode (Ultra-Fast 60 FPS)
  const isMobileOrPotato = window.innerWidth <= 768 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  if (isMobileOrPotato) {
    console.log('Mobile / Budget CPU detected: Auto-optimizing performance!');
    engine.renderer.setPixelRatio(1.0);
  }

  const shirtPalette = ['#f28482', '#52796f', '#3a86ff', '#8338ec', '#ff006e', '#2b2621'];
  const hairPalette = ['#4a3b32', '#222222', '#d4a373', '#e76f51', '#f4a261', '#9a8c98'];

  let selectedShirt = profile.shirtColor;
  let selectedHair = profile.hairColor;

  function renderColorSwatches(container, colors, currentSelected, onSelect) {
    container.innerHTML = '';
    colors.forEach(c => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch' + (c === currentSelected ? ' selected' : '');
      swatch.style.backgroundColor = c;
      swatch.addEventListener('click', () => {
        container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        onSelect(c);
      });
      container.appendChild(swatch);
    });
  }

  const btnGenderBoy = document.getElementById('btnGenderBoy');
  const btnGenderGirl = document.getElementById('btnGenderGirl');
  let selectedGender = profile.gender || 'boy';

  function updateGenderButtons() {
    if (btnGenderBoy && btnGenderGirl) {
      if (selectedGender === 'boy') {
        btnGenderBoy.style.borderColor = '#3a86ff';
        btnGenderBoy.style.background = '#eef4ff';
        btnGenderGirl.style.borderColor = '#e5e7eb';
        btnGenderGirl.style.background = '#ffffff';
      } else {
        btnGenderGirl.style.borderColor = '#ff758f';
        btnGenderGirl.style.background = '#fff0f3';
        btnGenderBoy.style.borderColor = '#e5e7eb';
        btnGenderBoy.style.background = '#ffffff';
      }
    }
  }

  if (btnGenderBoy) {
    btnGenderBoy.addEventListener('click', () => {
      selectedGender = 'boy';
      updateGenderButtons();
    });
  }

  if (btnGenderGirl) {
    btnGenderGirl.addEventListener('click', () => {
      selectedGender = 'girl';
      updateGenderButtons();
    });
  }

  function openAvatarModal() {
    playerNameInput.value = engine.localPlayer.name;
    selectedShirt = engine.localPlayer.shirtColor;
    selectedHair = engine.localPlayer.hairColor;
    selectedGender = engine.localPlayer.gender || 'boy';
    updateGenderButtons();

    renderColorSwatches(shirtColorsContainer, shirtPalette, selectedShirt, (c) => selectedShirt = c);
    renderColorSwatches(hairColorsContainer, hairPalette, selectedHair, (c) => selectedHair = c);

    avatarModal.classList.remove('hidden');
  }

  btnCustomize.addEventListener('click', openAvatarModal);
  if (btnProfileBadge) btnProfileBadge.addEventListener('click', openAvatarModal);

  btnCloseAvatarModal.addEventListener('click', () => {
    avatarModal.classList.add('hidden');
  });

  btnSaveAvatar.addEventListener('click', () => {
    const newName = playerNameInput.value.trim() || 'Warga';
    engine.localPlayer.name = newName;
    engine.localPlayer.shirtColor = selectedShirt;
    engine.localPlayer.hairColor = selectedHair;
    engine.updateAvatarAppearance(engine.localPlayer);

    updateHudProfileDisplay(newName, selectedHair, selectedShirt);

    saveProfile({
      name: newName,
      gender: selectedGender,
      shirtColor: selectedShirt,
      hairColor: selectedHair
    });

    engine.localPlayer.name = newName;
    engine.localPlayer.gender = selectedGender;
    engine.localPlayer.shirtColor = selectedShirt;
    engine.localPlayer.hairColor = selectedHair;
    engine.updateAvatarAppearance(engine.localPlayer);

    network.broadcast({
      type: 'PROFILE',
      name: newName,
      gender: selectedGender,
      shirtColor: selectedShirt,
      hairColor: selectedHair
    });

    avatarModal.classList.add('hidden');
    showToast('Tampilan karakter diperbarui! ✨');
  });

  // Keyboard accessibility: Close modals with Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cityMenuModal.classList.add('hidden');
      musicModal.classList.add('hidden');
      avatarModal.classList.add('hidden');
    }
  });
});
