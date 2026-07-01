# 캐릿 오프라인 모임 초대장 (멀티 회차)

감자 무드의 초대장 페이지 + 참가 신청폼 + 실시간 신청자 리스트.
**회차(이벤트)별로 URL이 구분**됩니다. → `https://<도메인>/e/<슬러그>`
스택: **Vercel(호스팅/서버리스) + Supabase(DB)**

## 구성
```
index.html          초대장 페이지 (슬러그에 맞는 회차 정보를 불러와 렌더링)
api/events.js       서버리스 함수 — 회차 정보 조회 (GET ?slug=)
api/rsvps.js        서버리스 함수 — 신청자 조회/저장 (회차별 분리)
vercel.json         /e/:slug → index.html 라우팅
supabase-setup.sql  events + rsvps 테이블 생성 & 첫 회차 예시 데이터
package.json        의존성 (@supabase/supabase-js)
.env.example        환경변수 예시
```

## 최초 배포 (한 번만)

### 1) Supabase
1. https://supabase.com 프로젝트 생성
2. **SQL Editor** → `supabase-setup.sql` 전체 붙여넣고 **Run**
   (events/rsvps 테이블 + 첫 회차 `potato-kimjang`이 생성됩니다)
3. **Project Settings → API** 에서 복사:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY`

### 2) Vercel
1. 이 폴더를 GitHub 저장소에 올리거나 Vercel CLI로 배포 (아래 CLI 참고)
2. Vercel **Settings → Environment Variables** 등록:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. 배포 → 접속: `https://<도메인>/e/potato-kimjang`

### Vercel CLI로 배포하는 법
```bash
npm i -g vercel      # 최초 1회
cd <이 폴더>
vercel               # 로그인 후 안내대로 엔터 → 프로젝트 생성
# 대시보드에서 환경변수 2개 등록 후:
vercel --prod        # 실서비스 배포
```

## 새 회차(파티) 추가하는 법  ⭐
Supabase **SQL Editor** 에서 아래를 복사해 값만 바꿔 실행하면 끝. 배포 재작업 필요 없어요.

```sql
insert into public.events
  (slug, title, badge, welcome, starts_at, deadline, date_text, location, location_note, fee, brand, contact)
values (
  'summer-bbq',                         -- 슬러그 (URL: /e/summer-bbq) · 영문/숫자/하이픈
  '여름 감자 바베큐',                    -- 제목
  '제2회 캐릿 오프라인 모임',            -- 배지
  '["같이 구워 먹을 분", "낯가림 있어도 OK~"]'::jsonb,  -- 환영 항목
  '2026-08-15 18:00:00+09',             -- 카운트다운 기준(파티 시작)
  '2026-08-14 23:59:59+09',             -- 신청 마감 (지나면 폼 닫힘 · 비우면 시작시각 사용)
  '8월 15일(토) 오후 6시',              -- 표시용 일시
  '서울시 용산구 이태원',               -- 장소
  '*세부 장소 개별 안내',               -- 장소 부가설명 (없으면 null)
  '3만 원',                             -- 참가비
  'journey',                            -- 하단 브랜드
  '전여정에게 문의해주세요!'             -- 문의 문구
);
```
- 파티 설명을 넣고 싶으면 `description` 컬럼, 주의사항은 `notice` 컬럼(줄바꿈으로 여러 줄)에 추가하세요.
- `deadline`이 지나면 신청 폼이 자동으로 닫히고 "신청 기간이 끝났어요"가 표시됩니다.
- 신청자는 회차별로 자동 분리됩니다. `/e/summer-bbq` 로 접속하면 그 회차 신청자만 보여요.

## 로컬 테스트
```bash
npm i -g vercel
npm install
vercel dev   # .env 에 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 넣어두기
# http://localhost:3000/e/potato-kimjang
```
