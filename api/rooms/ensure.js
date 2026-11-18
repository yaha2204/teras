import {
  guard, json, readBody, supabase, verifyToken
} from '../_auth.js';

/**
 * Pastikan setiap akun punya SATU room permanen: teras-akun-<id>.
 * Dipanggil sekali setelah login. Room dibuat/diperbarui dengan service_role
 * karena RLS tidak mengizinkan anon menulis tabel rooms.
 */
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { success: false, error: 'Method tidak diizinkan' });

  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const claims = verifyToken(token);
  if (!claims) return json(res, 401, { success: false, error: 'Sesi tidak valid' });

  const { accountId, displayName } = readBody(req);
  if (Number(accountId) !== Number(claims.id)) {
    return json(res, 403, { success: false, error: 'Akun tidak cocok dengan sesi' });
  }

  const roomCode = `teras-akun-${claims.id}`;
  const roomName = `Teras ${String(displayName || claims.username).slice(0, 60)}`;

  try {
    const existing = await supabase(
      `rooms?room_code=eq.${encodeURIComponent(roomCode)}&select=id&limit=1`
    );

    if (Array.isArray(existing) && existing.length) {
      await supabase(`rooms?room_code=eq.${encodeURIComponent(roomCode)}`, {
        method: 'PATCH',
        body: { room_name: roomName, host_id: Number(claims.id), is_private: false }
      });
    } else {
      await supabase('rooms', {
        method: 'POST',
        body: {
          room_code: roomCode,
          room_name: roomName,
          host_id: Number(claims.id),
          is_private: false,
          current_scene: 'terrace'
        }
      });
    }

    return json(res, 200, { success: true, roomCode, permanent: true });
  } catch (err) {
    console.error('[rooms/ensure]', err);
    return json(res, err.status || 500, { success: false, error: 'Gagal menyiapkan room.' });
  }
}
