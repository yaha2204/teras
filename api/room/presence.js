import { guard, json, readBody, supabase, verifyToken } from '../_auth.js';

/**
 * Simpan kehadiran akun di sebuah room.
 *
 * Kami menyimpan daftar penghuni di dalam rooms.music_state.occupants agar
 * tidak perlu migrasi schema. Kunci musik (videoId/action/time) dipertahankan.
 * Setiap entri otomatis dianggap 'sleeping' bila lastSeen sudah basi.
 */
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Method tidak diizinkan' });

  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const claims = verifyToken(token);
  if (!claims) return json(res, 401, { success: false, error: 'Sesi tidak valid' });

  const { roomCode, displayName, avatarData, state, scene } = readBody(req);
  if (!roomCode) return json(res, 400, { success: false, error: 'roomCode wajib diisi' });

  const code = String(roomCode).slice(0, 60);
  const key = `rooms?room_code=eq.${encodeURIComponent(code)}&select=id,music_state&limit=1`;

  try {
    const rows = await supabase(key);
    if (!Array.isArray(rows) || !rows.length) {
      return json(res, 404, { success: false, error: 'Room tidak ditemukan' });
    }

    const room = rows[0];
    const musicState = room.music_state && typeof room.music_state === 'object'
      ? room.music_state
      : { videoId: '', action: 'pause', time: 0 };
    const occupants = Array.isArray(musicState.occupants) ? musicState.occupants.slice() : [];

    const now = Date.now();
    const accountId = Number(claims.id);
    const avatar = avatarData && typeof avatarData === 'object' ? avatarData : {};
    const entry = {
      accountId,
      name: String(displayName || claims.username || 'Teman').slice(0, 50),
      gender: String(avatar.gender || 'boy').slice(0, 20),
      hairColor: String(avatar.hairColor || avatar.hair || '#222222').slice(0, 30),
      shirtColor: String(avatar.shirtColor || avatar.shirt || '#52796f').slice(0, 30),
      state: state === 'sleeping' ? 'sleeping' : 'awake',
      scene: String(scene || 'terrace').slice(0, 30),
      lastSeen: now
    };

    const idx = occupants.findIndex((o) => Number(o && o.accountId) === accountId);
    if (idx >= 0) occupants[idx] = { ...occupants[idx], ...entry };
    else occupants.push(entry);

    // Buang entri yang sudah lebih dari 30 hari supaya JSON tidak membengkak.
    const fresh = occupants.filter((o) => now - Number(o.lastSeen || 0) < 30 * 24 * 60 * 60 * 1000);

    await supabase(`rooms?id=eq.${room.id}`, {
      method: 'PATCH',
      body: { music_state: { ...musicState, occupants: fresh } }
    });

    return json(res, 200, { success: true, roomCode: code, occupants: fresh.length });
  } catch (err) {
    console.error('[room/presence]', err);
    return json(res, err.status || 500, { success: false, error: 'Gagal menyimpan kehadiran.' });
  }
}
