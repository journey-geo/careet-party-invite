// Vercel Serverless Function: /api/admin
// 비밀번호(x-admin-password 헤더)로 보호되는 관리자 API.
// op: list | get | create | update | delete | rsvps | deleteRsvp

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const EVENT_FIELDS = [
  'slug', 'title', 'badge', 'description', 'notice', 'welcome',
  'starts_at', 'deadline', 'date_text', 'location', 'location_note',
  'fee', 'brand', 'contact',
];

function pickEvent(body) {
  const o = {};
  for (const f of EVENT_FIELDS) {
    if (body[f] !== undefined) o[f] = (body[f] === '') ? null : body[f];
  }
  return o;
}

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'SUPABASE 환경변수를 확인하세요.' });
  }
  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD 환경변수가 설정되지 않았어요.' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const pw = (req.headers['x-admin-password'] || '').toString().trim();
  if (pw !== ADMIN_PASSWORD.trim()) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않아요.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const op = body.op;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (op === 'list') {
      const { data, error } = await supabase
        .from('events')
        .select('id, slug, title, date_text, starts_at, deadline, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ events: data });
    }

    if (op === 'get') {
      if (!body.id) return res.status(400).json({ error: 'id가 필요합니다.' });
      const { data, error } = await supabase.from('events').select('*').eq('id', body.id).maybeSingle();
      if (error) throw error;
      return res.status(200).json({ event: data });
    }

    if (op === 'create') {
      const payload = pickEvent(body);
      if (!payload.slug || !payload.title) {
        return res.status(400).json({ error: 'slug와 제목은 필수입니다.' });
      }
      const { data, error } = await supabase.from('events').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json({ event: data });
    }

    if (op === 'update') {
      if (!body.id) return res.status(400).json({ error: 'id가 필요합니다.' });
      const payload = pickEvent(body);
      const { data, error } = await supabase.from('events').update(payload).eq('id', body.id).select().single();
      if (error) throw error;
      return res.status(200).json({ event: data });
    }

    if (op === 'delete') {
      if (!body.id) return res.status(400).json({ error: 'id가 필요합니다.' });
      const { error } = await supabase.from('events').delete().eq('id', body.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (op === 'rsvps') {
      if (!body.event_id) return res.status(400).json({ error: 'event_id가 필요합니다.' });
      const { data, error } = await supabase
        .from('rsvps').select('id, name, mbti, created_at')
        .eq('event_id', body.event_id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ rsvps: data });
    }

    if (op === 'deleteRsvp') {
      if (!body.id) return res.status(400).json({ error: 'id가 필요합니다.' });
      const { error } = await supabase.from('rsvps').delete().eq('id', body.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: '알 수 없는 작업이에요.' });
  } catch (e) {
    return res.status(500).json({ error: e.message || '서버 오류' });
  }
}
