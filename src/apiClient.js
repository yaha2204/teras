/**
 * Thaloria Dual-Database Client Helper (Local-First with Supabase Cloud Failover)
 * Connects to Local PostgreSQL Backend (Port 3333) primarily;
 * Falls back seamlessly to Supabase Cloud if local server is down or unreachable.
 */

export class ThaloriaApiClient {
  constructor(options = {}) {
    this.localUrl = options.localUrl || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://127.0.0.1:3333' 
      : `http://${window.location.hostname}:3333`);
    
    this.supabaseUrl = options.supabaseUrl || window.__SUPABASE_URL || '';
    this.supabaseKey = options.supabaseKey || window.__SUPABASE_ANON_KEY || '';

    this.activeMode = 'probing'; // 'local' | 'supabase' | 'probing'
    this.token = localStorage.getItem('thaloria_jwt_token') || null;
    this.currentUser = JSON.parse(localStorage.getItem('thaloria_user_profile') || 'null');

    this.probeBackend();
  }

  // Probe local server with a fast 1.5s timeout
  async probeBackend() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${this.localUrl}/api/health`, {
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        this.activeMode = 'local';
        console.log(`🌸 [Thaloria API] Connected to LOCAL PRIMARY server: ${this.localUrl}`);
        return 'local';
      }
    } catch {
      // Local server down or network unreachable
    }

    if (this.supabaseUrl && this.supabaseKey) {
      this.activeMode = 'supabase';
      console.log(`☁️ [Thaloria API] Local down. Switched to SUPABASE CLOUD fallback: ${this.supabaseUrl}`);
      return 'supabase';
    } else {
      this.activeMode = 'offline';
      console.warn('⚠️ [Thaloria API] Local backend unreachable & Supabase unconfigured. Running in P2P mesh mode.');
      return 'offline';
    }
  }

  getHeaders(useAnonKey = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (useAnonKey) {
      // PostgREST / Supabase Auth menerima kunci anon sebagai apikey + Bearer.
      headers['apikey'] = this.supabaseKey;
      headers['Authorization'] = `Bearer ${this.token || this.supabaseKey}`;
    } else if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // 1. REGISTER ACCOUNT
  async register(username, password, displayName, avatarData) {
    await this.probeBackend();

    if (this.activeMode === 'local') {
      const res = await fetch(`${this.localUrl}/api/auth/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ username, password, displayName, avatarData })
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.token = data.token;
        this.currentUser = data.user;
        localStorage.setItem('thaloria_jwt_token', data.token);
        localStorage.setItem('thaloria_user_profile', JSON.stringify(data.user));
      }
      return data;
    }

    // Fallback: Supabase direct registration
    return { success: false, error: 'Pendaftaran cloud langsung memerlukan konfigurasi Supabase Auth' };
  }

  // 2. LOGIN ACCOUNT
  async login(username, password) {
    await this.probeBackend();

    if (this.activeMode === 'local') {
      const res = await fetch(`${this.localUrl}/api/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.token = data.token;
        this.currentUser = data.user;
        localStorage.setItem('thaloria_jwt_token', data.token);
        localStorage.setItem('thaloria_user_profile', JSON.stringify(data.user));
      }
      return data;
    }

    return { success: false, error: 'Server lokal tidak aktif dan Supabase Auth belum dikonfigurasi' };
  }

  // 3. CREATE ROOM
  async createRoom(params = {}) {
    await this.probeBackend();

    if (this.activeMode === 'local') {
      const res = await fetch(`${this.localUrl}/api/rooms/create`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params)
      });
      return await res.json();
    }

    // Cloud fallback: RLS hanya mengizinkan anon membaca room publik.
    // Penulisan harus lewat endpoint service_role (Vercel function), jadi di sini
    // kita kembalikan room lokal untuk dipakai UI tanpa menyimpan ke Supabase.
    return {
      success: true,
      persisted: false,
      room: {
        room_code: params.roomCode || `RM-${Math.floor(1000 + Math.random() * 9000)}`,
        room_name: params.roomName || 'Villa Hangout Cloud',
        current_scene: params.initialScene || 'terrace'
      }
    };
  }

  // 4. GET ROOM STATE
  async getRoom(roomCode) {
    await this.probeBackend();

    if (this.activeMode === 'local') {
      const res = await fetch(`${this.localUrl}/api/rooms/${encodeURIComponent(roomCode)}`);
      return await res.json();
    }

    if (this.activeMode === 'supabase') {
      try {
        const cols = 'room_code,room_name,current_scene,music_state,siren_mode,is_private,max_players,updated_at';
        const res = await fetch(
          `${this.supabaseUrl}/rest/v1/rooms?room_code=eq.${encodeURIComponent(roomCode)}&select=${cols}`,
          { headers: this.getHeaders(true) }
        );
        const rows = await res.json();
        if (!res.ok) return { success: false, error: rows.message || 'Gagal membaca Supabase' };
        return { success: true, room: rows[0] || null };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }

    return { success: false, error: 'Server lokal tidak tersedia' };
  }

  // 5b. DAFTAR ROOM PUBLIK (via view aman, tanpa password/passcode)
  async listRooms(limit = 20) {
    await this.probeBackend();

    if (this.activeMode === 'local') {
      const res = await fetch(`${this.localUrl}/api/rooms`);
      return await res.json();
    }

    if (this.activeMode === 'supabase') {
      try {
        const res = await fetch(
          `${this.supabaseUrl}/rest/v1/public_rooms?select=*&order=created_at.desc&limit=${Number(limit) || 20}`,
          { headers: this.getHeaders(true) }
        );
        const rows = await res.json();
        if (!res.ok) return { success: false, error: rows.message || 'Gagal membaca Supabase' };
        return { success: true, rooms: rows };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }

    return { success: false, rooms: [], error: 'Backend tidak tersedia' };
  }

  // 5. UPDATE ROOM STATE (Scene, Music, Siren)
  async updateRoomState(roomCode, state) {
    if (this.activeMode === 'local') {
      try {
        const res = await fetch(`${this.localUrl}/api/rooms/${encodeURIComponent(roomCode)}/state`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(state)
        });
        return await res.json();
      } catch (err) {
        console.warn('Gagal sync ke local backend:', err);
      }
    }
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('thaloria_jwt_token');
    localStorage.removeItem('thaloria_user_profile');
  }
}
