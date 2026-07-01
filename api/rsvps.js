// Vercel Serverless Function: /api/rsvps
// GET  ?slug=...        -> 해당 회차의 신청자 리스트
// POST { slug, name, mbti } -> 해당 회차에 신청 저장

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const VALID_MBTI = new Set([
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
]);

async function getEventId(supabase, slug) {
  const { data, error } = await supabase
    .from('events').select('id').eq('slug', slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? data.id : null;
}

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: '서버 설정 오류: SUPABASE 환경변수를 확인하세요.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (req.method === 'GET') {
    const slug = (req.query?.slug ?? '').toString().trim();
    if (!slug) return res.status(400).json({ error: 'slug가 필요합니다.' });

    let eventId;
    try { eventId = await getEventId(supabase, slug); }
    catch (e) { return res.status(500).json({ error: e.message }); }
    if (!eventId) return res.status(404).json({ error: '해당 회차를 찾을 수 없어요.' });

    const { data, error } = await supabase
      .from('rsvps')
      .select('id, name, mbti, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ rsvps: data });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const slug = (body?.slug ?? '').toString().trim();
    const name = (body?.name ?? '').toString().trim();
    const mbti = (body?.mbti ?? '').toString().trim().toUpperCase();

    if (!slug) return res.status(400).json({ error: 'slug가 필요합니다.' });
    if (!name) return res.status(400).json({ error: '이름을 입력해 주세요.' });
    if (name.length > 40) return res.status(400).json({ error: '이름이 너무 깁니다.' });
    if (!VALID_MBTI.has(mbti)) return res.status(400).json({ error: 'MBTI 값이 올바르지 않습니다.' });

    let eventId;
    try { eventId = await getEventId(supabase, slug); }
    catch (e) { return res.status(500).json({ error: e.message }); }
    if (!eventId) return res.status(404).json({ error: '해당 회차를 찾을 수 없어요.' });

    const { data, error } = await supabase
      .from('rsvps')
      .insert({ event_id: eventId, name, mbti })
      .select('id, name, mbti, created_at')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ rsvp: data });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
