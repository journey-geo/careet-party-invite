// Vercel Serverless Function: /api/events?slug=...
// GET -> 특정 회차(이벤트) 정보 조회

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: '서버 설정 오류: SUPABASE 환경변수를 확인하세요.' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const slug = (req.query?.slug ?? '').toString().trim();
  if (!slug) return res.status(400).json({ error: 'slug가 필요합니다.' });

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('events')
    .select('slug, title, badge, description, notice, welcome, starts_at, deadline, date_text, location, location_note, fee, brand, contact')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: '해당 회차를 찾을 수 없어요.' });

  return res.status(200).json({ event: data });
}
