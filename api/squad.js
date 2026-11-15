// Vercel Serverless Function: /api/squad
// Syncs Squad Leaderboard, Registered Users, Member Check-Ins, and Accountability Nudges across devices.
// Supports Permanent Cloud Persistence via Vercel KV / Upstash Redis (KV_REST_API_URL + KV_REST_API_TOKEN)
// or Supabase REST (SUPABASE_URL + SUPABASE_KEY), with automatic in-memory fallback.

const squadStore = new Map();

const SEED_SQUAD_MEMBERS = [
  {
    id: 'm_1',
    name: { en: 'Ahmed (Cousin)', ar: 'أحمد (ابن العم)' },
    points: 420,
    streak: 9,
    checkedInToday: true,
    badge: '🥇'
  },
  {
    id: 'm_2',
    name: { en: 'Sara (Sister)', ar: 'سارة (الأخت)' },
    points: 365,
    streak: 7,
    checkedInToday: true,
    badge: '🥈'
  },
  {
    id: 'm_3',
    name: { en: 'Omar (Best Friend)', ar: 'عمر (صديق مقرب)' },
    points: 240,
    streak: 4,
    checkedInToday: false,
    badge: '⚡'
  },
  {
    id: 'm_4',
    name: { en: 'Youssef (Brother)', ar: 'يوسف (الأخ)' },
    points: 195,
    streak: 3,
    checkedInToday: false,
    badge: '🌱'
  }
];

async function loadPersistentRoom(key, clientCloudConfig = null) {
  // 1. Check Upstash Redis / Vercel KV
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/nawwa_room_${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.result) {
          return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        }
      }
    } catch (_) {}
  }

  // 2. Check Supabase REST (table: nawwa_squads with columns: squad_code text primary key, payload jsonb)
  const sbUrl = clientCloudConfig?.supabaseUrl || process.env.SUPABASE_URL;
  const sbKey = clientCloudConfig?.supabaseKey || process.env.SUPABASE_KEY;
  if (sbUrl && sbKey) {
    try {
      const cleanUrl = sbUrl.replace(/\/+$/, '');
      const res = await fetch(
        `${cleanUrl}/rest/v1/nawwa_squads?squad_code=eq.${encodeURIComponent(key)}&select=payload`,
        {
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`
          }
        }
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]?.payload) {
          return rows[0].payload;
        }
      }
    } catch (_) {}
  }

  // 3. Fallback to warm in-memory store
  if (!squadStore.has(key)) {
    squadStore.set(key, {
      squadCode: key,
      squadMembers: structuredClone(SEED_SQUAD_MEMBERS),
      users: [],
      recentEvents: []
    });
  }
  return squadStore.get(key);
}

async function savePersistentRoom(key, roomData, clientCloudConfig = null) {
  squadStore.set(key, roomData);

  // 1. Save to Upstash Redis / Vercel KV
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (kvUrl && kvToken) {
    try {
      await fetch(`${kvUrl}/set/nawwa_room_${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomData)
      });
    } catch (_) {}
  }

  // 2. Save to Supabase REST (upsert)
  const sbUrl = clientCloudConfig?.supabaseUrl || process.env.SUPABASE_URL;
  const sbKey = clientCloudConfig?.supabaseKey || process.env.SUPABASE_KEY;
  if (sbUrl && sbKey) {
    try {
      const cleanUrl = sbUrl.replace(/\/+$/, '');
      await fetch(`${cleanUrl}/rest/v1/nawwa_squads`, {
        method: 'POST',
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          squad_code: key,
          payload: roomData,
          updated_at: new Date().toISOString()
        })
      });
    } catch (_) {}
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const code = String(req.query?.squadCode || 'NAWWA-77').trim().toUpperCase();
    const room = await loadPersistentRoom(code);
    return res.status(200).json(room);
  }

  if (req.method === 'POST') {
    try {
      const {
        squadCode = 'NAWWA-77',
        user = null,
        users = null,
        eventPayload = null,
        cloudConfig = null
      } = req.body || {};

      const key = String(squadCode).trim().toUpperCase() || 'NAWWA-77';
      const room = await loadPersistentRoom(key, cloudConfig);

      if (Array.isArray(users) && users.length) {
        room.users = users;
      }

      if (user && user.id) {
        const existingIdx = room.squadMembers.findIndex((m) => m.id === user.id);
        const memberRecord = {
          id: user.id,
          name: { en: user.name, ar: user.name },
          points: Number(user.points) || 0,
          streak: Number(user.streak) || 0,
          checkedInToday: Boolean(user.checkedInToday),
          badge: user.role === 'admin' ? '👑' : '🌟'
        };
        if (existingIdx >= 0) {
          room.squadMembers[existingIdx] = memberRecord;
        } else {
          room.squadMembers.push(memberRecord);
        }
      }

      if (eventPayload) {
        room.recentEvents = room.recentEvents || [];
        room.recentEvents.unshift({
          ...eventPayload,
          timestamp: new Date().toISOString()
        });
        room.recentEvents = room.recentEvents.slice(0, 20);
      }

      await savePersistentRoom(key, room, cloudConfig);
      return res.status(200).json(room);
    } catch (err) {
      return res.status(400).json({ error: String(err.message || err) });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
