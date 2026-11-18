import { guard, json, supabase, verifyToken } from '../_auth.js';

/** Baca penghuni room. Entri basi otomatis ditampilkan sebagai 'sleeping'. */
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { success: false, error: 'Method tidak diizinkan' });

  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const claims = verifyToken(token);
  if (!claims) return json(res, 401, { success: false, error: 'Sesi tidak valid' });

  const code = String(req.query.roomCode || '').slice(0, 60);
  if (!code) return json(res, 400, { success: false, error: 'roomCode wajib diisi' });

  try {
    const rows = await supabase(
      `rooms?room_code=eq.${encodeURIComponent(code)}&select=music_state&limit=1`
    );
    if (!Array.isArray(rows) || !rows.length) {
      return json(res, 404, { success: false, error: 'Room tidak ditemukan' });
    }

    const musicState = rows[0].music_state || {};
    const raw = Array.isArray(musicState.occupants) ? musicState.occupants : [];
    const now = Date.now();
    const occupants = raw.map((o) => ({
      accountId: Number(o.accountId),
      name: o.name || 'Teman',
      gender: o.gender || 'boy',
      hairColor: o.hairColor || '#222222',
      shirtColor: o.shirtColor || '#52796f',
      state: (o.state === 'sleeping' || now - Number(o.lastSeen || 0) > 25000)
        ? 'sleeping'
        : 'awake',
      scene: o.scene || 'terrace'
    }));

    return json(res, 200, { success: true, occupants });
  } catch (err) {
    console.error('[room/occupants]', err);
    return json(res, err.status || 500, { success: false, error: err.message || 'Gagal membaca penghuni' });
  }
}
