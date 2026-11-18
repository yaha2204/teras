/**
 * Main Application Orchestrator for Cozy Flower Terrace & Car Cruise
 */
import { Engine3D } from './engine3d.js?v=20261116tidur1';
import { NetworkManager } from './network.js?v=20261116tidur1';
import { PureAudioController, parseYouTubeVideoId } from './audioController.js?v=20261116tidur1';
import { ThaloriaApiClient } from './apiClient.js?v=20261116tidur1';
import { initAuthGate } from './authGate.js?v=20261118akun1';

// apiClient.js membaca global ini — petakan dari env Vite (Vercel) atau script injection.
window.__SUPABASE_URL = window.__SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
window.__SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Room permanen: setiap akun punya SATU room yang melekat pada id akun.
// Room ini tidak berubah walau browser dibersihkan / dibuka di perangkat lain.
function getAccountSession() {
  try {
    return JSON.parse(localStorage.getItem('thaloria_user_profile') || 'null');
  } catch {
    return null;
  }
}

function getAccountRoomId() {
  const account = getAccountSession();
  if (!account || (!account.id && !account.username)) return null;
  const key = String(account.id || account.username).replace(/[^a-zA-Z0-9_-]/g, '');
  return `teras-akun-${key}`;
}

// Apakah user datang lewat link undangan teman (bukan room default)?
const hadInviteHash = !!window.location.hash.replace('#', '').trim();

// Setup or Retrieve Room Hash
function getOrCreateRoomId() {
  const accountRoom = getAccountRoomId();
  let hash = window.location.hash.replace('#', '').trim();
  if (!hash) {
    // Tanpa link undangan, masuk ke room permanen milik akun yang sedang login.
    hash = accountRoom || 'terras-' + Math.random().toString(36).substring(2, 7);
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

  // --- Kehadiran persisten: teman tetap menetap di room walau logout / offline ---
  // Profil penghuni disimpan di server. Saat tidak terhubung P2P, avatarnya
  // ditampilkan tidur di kasur, bukan dihapus.
  const persistentOccupants = new Map();
  const peerAccountIds = new Map();
  let networkRef = null;

  function presenceAvatar() {
    return {
      gender: engine.localPlayer.gender || profile.gender || 'boy',
      hairColor: engine.localPlayer.hairColor || profile.hairColor || '#4a3b32',
      shirtColor: engine.localPlayer.shirtColor || profile.shirtColor || '#f28482'
    };
  }

  function sendPresence(state, options = {}) {
    if (!apiClient.token || !apiClient.currentUser) return;
    Promise.resolve(apiClient.updatePresence(roomId, {
      displayName: engine.localPlayer.name || profile.name,
      avatarData: presenceAvatar(),
      state,
      scene: engine.currentSceneName || 'terrace'
    }, options)).catch(() => {});
  }

  function sleepSpot(index) {
    const S = 1.55; // disamakan dengan engine.interiorScale
    const jitter = ((Math.floor(index / 2) % 3) - 1) * 0.5;
    if (index % 2 === 0) {
      return { x: 5.8 * S + jitter, z: 3.6 * S, heightY: 1.05 * S, bedLabel: 'Kanan' };
    }
    return {
      x: -4.0 * S + jitter,
      z: -4.5 * S,
      heightY: (3.22 + 0.95) * S,
      bedLabel: 'Lantai Atas'
    };
  }

  function renderSleepingOccupants() {
    if (!engine) return;
    const myId = Number(apiClient.currentUser && apiClient.currentUser.id);
    const onlineAccounts = new Set(peerAccountIds.values());
    const keep = new Set();
    let slot = 0;

    for (const occ of persistentOccupants.values()) {
      const accountId = Number(occ.accountId);
      if (!accountId || accountId === myId) continue;
      const ghostId = `sleep-${accountId}`;
      if (onlineAccounts.has(accountId)) {
        engine.removeRemotePlayer(ghostId);
        continue;
      }
      keep.add(ghostId);
      const spot = sleepSpot(slot++);
      engine.updatePlayerState(ghostId, {
        name: `${occ.name || 'Teman'} 💤`,
        gender: occ.gender,
        hairColor: occ.hairColor,
        shirtColor: occ.shirtColor,
        scene: 'interior',
        x: spot.x,
        z: spot.z,
        isSleeping: true,
        bedLabel: spot.bedLabel,
        sleepHeight: spot.heightY
      });
    }

    for (const pid of Array.from(engine.remotePlayers.keys())) {
      if (pid.startsWith('sleep-') && !keep.has(pid)) engine.removeRemotePlayer(pid);
    }
  }

  function loadOccupants() {
    if (!apiClient.token) return;
    Promise.resolve(apiClient.getOccupants(roomId)).then((res) => {
      if (!res || !res.success || !Array.isArray(res.occupants)) return;
      persistentOccupants.clear();
      for (const occ of res.occupants) persistentOccupants.set(String(occ.accountId), occ);
      renderSleepingOccupants();
    }).catch(() => {});
  }

  window.addEventListener('pagehide', () => sendPresence('sleeping', { keepalive: true }));
  window.addEventListener('beforeunload', () => sendPresence('sleeping', { keepalive: true }));
  setInterval(() => {
    if (apiClient.token && !document.hidden) sendPresence('awake');
  }, 10000);

  // Update Room Header
  const roomTitleEl = document.getElementById('roomTitle');
  if (roomTitleEl) roomTitleEl.textContent = '#' + roomId;

  const currentRoomCodeText = document.getElementById('currentRoomCodeText');
  if (currentRoomCodeText) currentRoomCodeText.textContent = '#' + roomId;

  const myRoomCodeText = document.getElementById('myRoomCodeText');
  if (myRoomCodeText) myRoomCodeText.textContent = '#' + (getAccountRoomId() || roomId);

  // Initialize Canvas 3D Isometric Engine
  const canvas = document.getElementById('gameCanvas');
  let engine = null;
  engine = new Engine3D(canvas);

  // Apply Initial Profile to Local Player
  engine.localPlayer.name = profile.name;
  engine.localPlayer.shirtColor = profile.shirtColor;
  engine.localPlayer.hairColor = profile.hairColor;
  engine.updateAvatarAppearance(engine.localPlayer);

  // Wajib punya akun sebelum bisa daftar / gabung ke teras.
  // Dipanggil setelah engine siap supaya callback profil aman.
  initAuthGate(apiClient, (user) => {
    if (!user) return;
    const displayName = user.displayName || user.username;
    profile.name = displayName;
    profile.accountId = user.id;
    if (user.avatarData && user.avatarData.gender) profile.gender = user.avatarData.gender;

    engine.localPlayer.name = displayName;
    engine.localPlayer.gender = profile.gender || 'boy';
    engine.updateAvatarAppearance(engine.localPlayer);
    engine.syncCarCompanion();
    saveProfile(profile);

    const hudName = document.getElementById('hudPlayerName');
    if (hudName) hudName.textContent = displayName;
    showToast(`Selamat datang, ${displayName}! 🌸`);

    // Room permanen: pastikan room akun ada di Supabase & jadikan room aktif
    // selama user tidak sedang membuka link undangan teman.
    const accountRoom = `teras-akun-${user.id}`;
    if (!hadInviteHash && roomId !== accountRoom) {
      window.location.hash = accountRoom;
      window.location.reload();
      return;
    }

    // Beri tahu teman bahwa akun ini sedang online di room ini.
    if (networkRef) {
      networkRef.localProfile = profile;
      networkRef.broadcast({
        type: 'PROFILE',
        clientId: networkRef.myClientId,
        ...profile
      });
    }
    sendPresence('awake');
    loadOccupants();

    Promise.resolve(apiClient.ensureRoom({
      accountId: user.id,
      displayName
    })).then((result) => {
      if (result && result.success) console.log('🌸 Room permanen siap:', result.roomCode);
    }).catch(() => {});
  });

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
  // peerId -> clientId, dipakai untuk menentukan siapa sopir aktif.
  const peerClientIds = new Map();
  let driverClientId = null;
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
      const leftClientId = peerClientIds.get(peerId);
      peerClientIds.delete(peerId);
      peerAccountIds.delete(peerId);
      // Teman yang keluar tetap tinggal di room sebagai avatar tidur.
      renderSleepingOccupants();
      if (leftClientId && leftClientId === driverClientId) {
        driverClientId = network.myClientId;
        applyDriverAuthority();
        showToast('Teman keluar — setir kembali ke kamu 🚗');
      }
      if (!network.connections.size) {
        engine.carPeerProfile = null;
        engine.syncCarCompanion();
      }
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
        // Default mengikuti profil lokal, bukan cewek — karakter di mobil
        // harus konsisten dengan gender asli penghuninya.
        const gender = data.gender || (data.profile && data.profile.gender)
          || (engine.localPlayer.gender || 'cowo');
        const peerProfile = {
          name: data.name || (data.profile && data.profile.name) || 'Teman',
          gender,
          hairColor: hairC || engine.localPlayer.hairColor,
          shirtColor: shirtC || engine.localPlayer.shirtColor
        };
        engine.carPeerProfile = peerProfile;
        engine.syncCarCompanion(peerProfile);
        if (data.clientId) peerClientIds.set(peerId, data.clientId);
        if (data.accountId) peerAccountIds.set(peerId, Number(data.accountId));
        // Teman yang sedang online tidak perlu ditampilkan sebagai tidur.
        renderSleepingOccupants();
      } else if (data.type === 'CHAT') {
        appendChatMessage(data.name || 'Teman', data.text, false);
        showToast(`${data.name || 'Teman'}: ${data.text}`);
      } else if (data.type === 'YT_SYNC') {
        audioController.syncFromPeer(data.action, data.videoId, data.time);
        updateNowPlayingDisplay(data.videoId);
        updatePlayPauseButton(data.action === 'PLAY');
      } else if (data.type === 'DRIVER_HANDOFF') {
        // Hanya sopir aktif yang boleh menyerahkan setir.
        const senderClientId = peerClientIds.get(peerId) || data.from;
        const isDriverHandingOver =
          driverClientId === network.myClientId || driverClientId === senderClientId;
        if (!data.driverClientId || !isDriverHandingOver) return;
        driverClientId = data.driverClientId;
        applyDriverAuthority();
        showToast(isLocalDriver()
          ? 'Giliranmu menyetir sekarang! 🚗'
          : 'Temanmu mengambil giliran menyetir 🚗');
      } else if (data.type === 'CAR_DRIVE_SYNC') {
        // Physics mobil hanya diambil dari sopir aktif, bukan dari penumpang.
        const senderClientId = peerClientIds.get(peerId);
        if (!isLocalDriver() && data.driverClientId === driverClientId
            && senderClientId === driverClientId) {
          engine.carSteerX = data.carSteerX;
          if (data.speed) {
            engine.driveSpeed = data.speed;
            engine.speedLimit = data.speed;
            if (carThrottleSlider) carThrottleSlider.value = data.speed;
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
  networkRef = network;

  // Awalnya pemain lokal yang pegang setir.
  driverClientId = network.myClientId;

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
    // Engine hanya memancarkan ini kalau pemain lokal adalah sopir aktif.
    network.broadcast({
      type: 'CAR_DRIVE_SYNC',
      ...carData,
      driverClientId
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
      if (!isLocalDriver()) {
        e.target.value = engine.speedLimit;
        notifyPassenger();
        return;
      }
      const val = parseFloat(e.target.value);
      engine.setSpeedLimit(val);
      if (throttleSpeedLabel) {
        throttleSpeedLabel.textContent = `${Math.round(engine.speedLimit * 100)} km/j`;
      }

      // Broadcast throttle speed to companion
      network.broadcast({
        type: 'CAR_DRIVE_SYNC',
        carX: engine.driveCar ? engine.driveCar.position.x : 0,
        carSteerX: engine.carSteerX,
        speed: engine.driveSpeed
      });
    });
  }

  // Label menampilkan kecepatan aktual + batas yang diset user.
  // Slider sengaja TIDAK diubah di sini supaya limit tidak turun sendiri.
  engine.onSpeedChange = (speed) => {
    if (!throttleSpeedLabel) return;
    const limit = engine.speedLimit;
    throttleSpeedLabel.textContent = Math.abs(limit - speed) > 0.01
      ? `${Math.round(speed * 100)} / ${Math.round(limit * 100)} km/j`
      : `${Math.round(speed * 100)} km/j`;
  };

  // Wire Auto-Pilot & Day/Night Toggles
  const btnAutoPilotToggle = document.getElementById('btnAutoPilotToggle');
  if (btnAutoPilotToggle) {
    btnAutoPilotToggle.addEventListener('click', () => {
      if (!isLocalDriver()) {
        notifyPassenger();
        return;
      }
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
      if (!isLocalDriver()) {
        notifyPassenger();
        return;
      }
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

  // Otoritas menyetir: hanya satu sopir aktif. Penumpang tidak bisa mengubah
  // kecepatan/setir mobil yang sedang dikendarai teman.
  function isLocalDriver() {
    return driverClientId === network.myClientId;
  }

  let lastPassengerNotice = 0;
  function notifyPassenger() {
    const now = Date.now();
    if (now - lastPassengerNotice < 4000) return;
    lastPassengerNotice = now;
    showToast('Kamu penumpang — teman yang pegang setir 🚗');
  }

  function applyDriverAuthority() {
    const mine = isLocalDriver();
    engine.setDriverRole(mine ? 'local' : 'remote');

    if (carThrottleSlider) {
      carThrottleSlider.disabled = !mine;
      carThrottleSlider.value = engine.speedLimit;
    }
    if (throttleSpeedLabel) {
      throttleSpeedLabel.textContent = mine
        ? `${Math.round(engine.speedLimit * 100)} km/j`
        : 'Menunggu giliran';
    }
    [btnAutoPilotToggle, btnSirenToggle].forEach((button) => {
      if (button) button.disabled = !mine;
    });
    if (btnSwitchDriver) {
      btnSwitchDriver.textContent = mine
        ? '🔄 Serahin Setir ke Teman'
        : '⏳ Teman yang Menyetir';
      btnSwitchDriver.classList.toggle('passenger', !mine);
    }
  }

  if (btnSwitchDriver) {
    btnSwitchDriver.addEventListener('click', () => {
      if (!isLocalDriver()) {
        showToast('Sekarang giliran temanmu. Dia yang bisa menyerahkan setir balik.');
        return;
      }
      const peerIds = [...network.connections.keys()];
      if (!peerIds.length) {
        showToast('Ajak teman dulu supaya bisa bergantian menyetir 🌸');
        return;
      }
      const targetPeer = peerIds[0];
      driverClientId = peerClientIds.get(targetPeer) || targetPeer;
      applyDriverAuthority();
      network.broadcast({
        type: 'DRIVER_HANDOFF',
        driverClientId,
        from: network.myClientId
      });
      showToast('Setir diserahkan ke temanmu — sekarang kamu penumpang 🚗');
    });
  }

  // Terapkan otoritas awal: lokal sebagai sopir.
  applyDriverAuthority();

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
        engine.setSpeedLimit(0.35);
        btnCarSpeed.textContent = '⚡ Pelan (20 km/h)';
      } else if (speedTier === 1) {
        engine.setSpeedLimit(0.65);
        btnCarSpeed.textContent = '⚡ Santai (45 km/h)';
      } else {
        engine.setSpeedLimit(1.05);
        btnCarSpeed.textContent = '⚡ Cepat (70 km/h)';
      }
      if (carThrottleSlider) carThrottleSlider.value = engine.speedLimit;
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

  // Kembali ke teras permanen milik akun (dari room teman yang sedang dikunjungi)
  const btnGoMyRoom = document.getElementById('btnGoMyRoom');
  if (btnGoMyRoom) {
    btnGoMyRoom.addEventListener('click', () => {
      const own = getAccountRoomId();
      if (!own) {
        showToast('Buat akun dulu untuk punya teras permanen 🌸');
        return;
      }
      if (roomId === own) {
        showToast('Kamu sudah berada di teras sendiri 🌸');
        return;
      }
      window.location.hash = own;
      window.location.reload();
    });
  }

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
