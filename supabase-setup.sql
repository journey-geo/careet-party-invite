-- =========================================================
-- Supabase SQL Editor에서 그대로 실행하세요. (한 번만)
-- 회차(events) + 신청자(rsvps) 테이블을 만듭니다.
-- =========================================================

-- 1) 회차 테이블
create table if not exists public.events (
  id             bigint generated always as identity primary key,
  slug           text not null unique,                 -- URL에 쓰이는 고유값 (예: potato-kimjang)
  title          text not null,                        -- 파티 제목
  badge          text,                                 -- 상단 배지 (예: 제1회 전여정 오프라인 모임)
  description    text,                                  -- 파티 설명 (선택)
  notice         text,                                  -- 주의사항 (줄바꿈으로 여러 줄, 선택)
  welcome        jsonb default '[]'::jsonb,             -- "이런 분을 환영해요" 항목 배열
  starts_at      timestamptz,                           -- 카운트다운 기준 시각
  deadline       timestamptz,                           -- 신청 마감 시각 (지나면 폼 닫힘. 비우면 starts_at 사용)
  date_text      text,                                  -- 화면 표시용 일시 (예: 7월 10일(금) 오후 7시 30분)
  location       text,                                  -- 장소
  location_note  text,                                  -- 장소 부가설명 (예: *세부 장소 개별 안내)
  fee            text,                                  -- 참가비
  brand          text default 'journey',                -- 하단 브랜드명
  contact        text,                                  -- 문의 문구
  created_at     timestamptz not null default now()
);

-- 2) 신청자 테이블 (회차별로 구분)
create table if not exists public.rsvps (
  id          bigint generated always as identity primary key,
  event_id    bigint not null references public.events(id) on delete cascade,
  name        text not null,
  mbti        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists rsvps_event_id_idx on public.rsvps (event_id);

-- 3) RLS (서버리스 함수는 service_role 키로 접근 → RLS 우회. 브라우저 직접 접근은 없음)
alter table public.events enable row level security;
alter table public.rsvps  enable row level security;

-- =========================================================
-- 4) 첫 번째 회차 예시 데이터 (감자 김장 파티)
--    새 회차를 만들 땐 아래 insert 문을 복사해 값만 바꿔 실행하면 됩니다.
-- =========================================================
insert into public.events
  (slug, title, badge, welcome, starts_at, deadline, date_text, location, location_note, fee, brand, contact)
values
  (
    'potato-kimjang',
    '감자 김장 파티',
    '제1회 전여정 오프라인 모임',
    '["감자 김장하실 분.. (알레르기 없으셔야 함!)", "모여서 근황 얘기 나눌 분", "가볍게 놀러 오고 싶은 분도 OK~"]'::jsonb,
    '2026-07-10 19:30:00+09',
    '2026-07-09 23:59:59+09',   -- 신청 마감 (지나면 폼 닫히고 "신청 기간이 끝났어요" 표시)
    '7월 10일(금) 오후 7시 30분',
    '서울시 마포구 공덕역',
    '*세부 장소 참가자 개별 안내',
    '2만 원',
    'journey',
    '전여정에게 문의해주세요!'
  )
on conflict (slug) do nothing;

-- 접속 URL 예시:  https://<your-vercel-domain>/e/potato-kimjang
