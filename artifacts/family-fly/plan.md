# FamilyFly 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 가격 데이터 | Amadeus API (항공 + 호텔) | 사용자 선택. 테스트 환경 무료 티어로 시작 |
| 화면 전환 | Client-side state (useSearch hook) | 검색 결과는 SEO 불필요, 인터랙션 중심 |
| API 레이어 | Next.js Route Handlers | 외부 API 소비(Amadeus)는 Route Handler 권장 (route-handlers.md) |
| 알림 저장소 | SQLite (better-sqlite3) | 추가 인프라 없이 파일 기반, MVP에 충분 |
| 이메일 발송 | Resend SDK | 간단한 API, 무료 티어 |
| 취소 토큰 | `crypto.randomUUID()` | 내장 API, 별도 패키지 불필요 |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| AMADEUS_CLIENT_ID | Env var | .env.local | Task 1 |
| AMADEUS_CLIENT_SECRET | Env var | .env.local | Task 1 |
| RESEND_API_KEY | Env var | .env.local | Task 9 |
| CRON_SECRET | Env var | .env.local | Task 9 |
| app.db | SQLite 파일 | 프로젝트 루트 (gitignore) | Task 7 |

## 데이터 모델

### PriceAlert
- `id` TEXT PRIMARY KEY (crypto.randomUUID)
- `cancel_token` TEXT UNIQUE (crypto.randomUUID, 취소 링크용)
- `email` TEXT NOT NULL
- `origin` TEXT NOT NULL (IATA 코드)
- `destination` TEXT NOT NULL
- `depart_from` TEXT NOT NULL (ISO 날짜)
- `depart_to` TEXT NOT NULL
- `return_from` TEXT NOT NULL
- `return_to` TEXT NOT NULL
- `adults` INTEGER NOT NULL
- `children` INTEGER NOT NULL DEFAULT 0
- `flight_target_price` INTEGER NULL (원화, 성인 1인)
- `hotel_target_price` INTEGER NULL (원화, 1박)
- `is_active` INTEGER NOT NULL DEFAULT 1 (0/1)
- `created_at` TEXT NOT NULL (ISO datetime)
- `last_notified_at` TEXT NULL

### DayPrice (API 응답 구조, DB 저장 안 함)
- `date` string (YYYY-MM-DD)
- `minPrice` number | null (항공+호텔 합산 최저가)
- `combos` ComboOffer[] (조합 리스트)

### ComboOffer
- `flight` FlightOffer
- `hotel` HotelOffer
- `combinedPrice` number

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| next-best-practices | Task 1, 2, 7, 9 | Route Handler 패턴, RSC 경계, async params |
| shadcn | Task 3, 4, 5, 8 | FieldGroup+Field 폼 레이아웃, Card, Button, Input, Combobox |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/search.ts` | New | Task 1 |
| `types/alert.ts` | New | Task 7 |
| `lib/amadeus.ts` | New | Task 1 |
| `lib/db.ts` | New | Task 7 |
| `services/search.ts` | New | Task 1 |
| `services/search.test.ts` | New | Task 1 |
| `services/hotels.ts` | New | Task 2 |
| `services/hotels.test.ts` | New | Task 2 |
| `services/alerts.ts` | New | Task 7 |
| `services/alerts.test.ts` | New | Task 7 |
| `services/email.ts` | New | Task 9 |
| `hooks/useSearch.ts` | New | Task 6 |
| `components/family-fly/SearchForm.tsx` | New | Task 3 |
| `components/family-fly/SearchForm.test.tsx` | New | Task 3 |
| `components/family-fly/PriceCalendar.tsx` | New | Task 4 |
| `components/family-fly/PriceCalendar.test.tsx` | New | Task 4 |
| `components/family-fly/ComboList.tsx` | New | Task 5 |
| `components/family-fly/ComboList.test.tsx` | New | Task 5 |
| `components/family-fly/AlertForm.tsx` | New | Task 8 |
| `components/family-fly/AlertForm.test.tsx` | New | Task 8 |
| `app/page.tsx` | Modify | Task 6 |
| `app/cancel/[token]/page.tsx` | New | Task 8 |
| `app/api/search/route.ts` | New | Task 1 |
| `app/api/alerts/route.ts` | New | Task 7 |
| `app/api/alerts/cancel/route.ts` | New | Task 8 |
| `app/api/cron/check-prices/route.ts` | New | Task 9 |
| `app/layout.tsx` | Modify | Task 6 (메타데이터) |
| `.env.local` | New | Task 1 |
| `.gitignore` | Modify | Task 7 (app.db 추가) |

---

## Tasks

### Task 1: Amadeus SDK + 항공 가격 검색 Route Handler

- **담당 시나리오**: Scenario 1 (항공 부분, 서버 레이어)
- **크기**: M (5 파일)
- **의존성**: None — 고위험 Task, fail-fast를 위해 선행
- **참조**:
  - next-best-practices — route-handlers (외부 API = Route Handler)
  - https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search
  - `amadeus` npm 패키지 (`bun add amadeus`)
- **구현 대상**:
  - `types/search.ts` — SearchParams, FlightOffer, DayPrice (flight only)
  - `lib/amadeus.ts` — Amadeus SDK 싱글턴 (AMADEUS_CLIENT_ID/SECRET)
  - `services/search.ts` — `fetchFlightDayPrices(params: SearchParams): Promise<Record<string, FlightOffer[]>>`
  - `app/api/search/route.ts` — `GET /api/search?origin=&destination=&departFrom=&departTo=&returnFrom=&returnTo=&adults=&children=`
  - `services/search.test.ts` — Amadeus 클라이언트 mock, 날짜별 결과 매핑 검증
- **수용 기준**:
  - [ ] 유효한 쿼리 파라미터 → `GET /api/search` 200 응답, body에 `dates` 객체 포함 (각 key는 YYYY-MM-DD)
  - [ ] `dates["2026-06-15"]` 에 `minFlightPrice: number` 필드 존재
  - [ ] 필수 파라미터 누락 → 400 응답, `{ error: "missing required params" }`
  - [ ] Amadeus API 에러 → 502 응답
- **검증**: `bun run test -- services/search`

---

### Task 2: 호텔 가격 연동 + 날짜별 합산 DayPrice

- **담당 시나리오**: Scenario 1 (호텔 추가, 합산 완성)
- **크기**: M (4 파일 수정/추가)
- **의존성**: Task 1 (lib/amadeus, types/search)
- **참조**:
  - https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-list
  - https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-offers-search
- **구현 대상**:
  - `types/search.ts` — HotelOffer, ComboOffer, DayPrice (combined) 추가
  - `services/hotels.ts` — `fetchHotelDayPrices(params): Promise<Record<string, HotelOffer[]>>`
    - 1단계: `referenceData.locations.hotels.byCity` (도시 코드 → 호텔 ID 목록)
    - 2단계: `shopping.hotelOffersSearch` (날짜별 최저가)
  - `services/hotels.test.ts` — 두 단계 API mock, 날짜별 매핑 검증
  - `app/api/search/route.ts` — 항공+호텔 조합 → `DayPrice[]` 반환 (combinedPrice 포함)
- **수용 기준**:
  - [ ] `GET /api/search` 응답의 `dates["2026-06-15"]`에 `minPrice: number`, `combos: ComboOffer[]` 포함
  - [ ] 각 `ComboOffer`에 `flight.price`, `hotel.nightlyRate`, `combinedPrice` 필드 존재
  - [ ] `combos`가 `combinedPrice` 오름차순으로 정렬됨
  - [ ] 호텔 결과가 없는 날짜의 `minPrice`는 `null`
- **검증**: `bun run test -- services/hotels`

---

### Checkpoint: Tasks 1-2 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] `GET /api/search?origin=ICN&destination=TYO&...` → Amadeus test 환경에서 실제 응답 수신 확인 (Browser MCP 또는 curl)

---

### Task 3: 검색 폼 UI (유효성 검사 포함)

- **담당 시나리오**: Scenario 1 (입력 부분), Scenario 4 (필수 입력 오류), Scenario 5 (날짜 오류)
- **크기**: M (2 파일)
- **의존성**: Task 1 (SearchParams 타입)
- **참조**:
  - shadcn — forms.md (FieldGroup + Field 레이아웃, data-invalid 패턴)
  - shadcn — composition.md (Combobox: 공항 자동완성)
  - wireframe.html 검색폼 화면 레이아웃
- **구현 대상**:
  - `components/family-fly/SearchForm.tsx` (`'use client'`) — 출발지/목적지(Combobox), 날짜 range(native date input×4), 인원 스텝퍼, 검색 버튼
  - `components/family-fly/SearchForm.test.tsx`
- **수용 기준**:
  - [ ] 출발지 비어있고 "검색" 클릭 → "출발지를 입력하세요" 오류 텍스트 표시됨, 검색 실행 안 됨
  - [ ] 목적지 비어있고 "검색" 클릭 → "목적지를 입력하세요" 오류 텍스트 표시됨
  - [ ] 출발일 범위 비어있고 "검색" 클릭 → "출발일 범위를 선택하세요" 표시됨
  - [ ] 귀환일 범위 비어있고 "검색" 클릭 → "귀환일 범위를 선택하세요" 표시됨
  - [ ] 귀환일 종료일이 출발일 시작일보다 이른 경우 → "귀환일은 출발일보다 늦어야 합니다" 표시, 검색 버튼 `disabled`
  - [ ] 성인 수가 0인 상태로 "검색" 클릭 → "성인은 최소 1명 이상이어야 합니다" 표시
  - [ ] 모든 필드 유효 → `onSubmit(params)` 호출됨
  - [ ] 초기 기본값: 성인 2, 소아 0
- **검증**: `bun run test -- components/family-fly/SearchForm`

---

### Task 4: 달력 뷰 (가격 표시, 상태 처리)

- **담당 시나리오**: Scenario 1 (로딩 + 결과), Scenario 6 (빈 결과)
- **크기**: M (2 파일)
- **의존성**: Task 2 (DayPrice 타입)
- **참조**:
  - shadcn — composition.md (Skeleton: 로딩 상태)
  - wireframe.html 달력뷰 화면
- **구현 대상**:
  - `components/family-fly/PriceCalendar.tsx` — 달력 그리드(7컬럼), 날짜셀(범위 내/외, 가격 있음/없음), 로딩(Skeleton), 빈 결과 메시지
  - `components/family-fly/PriceCalendar.test.tsx`
- **수용 기준**:
  - [ ] `isLoading=true` → 달력 셀 위치에 Skeleton 컴포넌트가 렌더됨
  - [ ] `dayPrices` 에 `"2026-06-15": { minPrice: 267000 }` 전달 → 해당 셀에 "₩267,000" 텍스트 표시
  - [ ] `minPrice: null` 인 날짜 셀 → "−" 표시, 클릭 핸들러 없음 (onclick 속성 없음)
  - [ ] 범위 밖 날짜 셀 → 가격 미표시, 클릭 불가
  - [ ] `dayPrices`가 빈 객체이고 `isLoading=false` → "입력하신 조건에 맞는 항공+호텔 조합을 찾을 수 없습니다" 텍스트 표시
  - [ ] 가격 있는 날짜 셀 클릭 → `onDateSelect(date)` 호출
- **검증**: `bun run test -- components/family-fly/PriceCalendar`

---

### Task 5: 조합 리스트 (외부 예약 링크, 정렬 포함)

- **담당 시나리오**: Scenario 2 (조합 리스트, 정렬), Scenario 3 (외부 링크)
- **크기**: M (2 파일, 정렬 기능 포함으로 S→M 상향)
- **의존성**: Task 2 (ComboOffer 타입)
- **참조**:
  - shadcn — composition.md (Card 구조: CardHeader/CardContent/CardFooter)
  - wireframe.html 조합리스트 화면 (정렬 버튼 3개: 합산가/항공가/호텔가)
- **구현 대상**:
  - `components/family-fly/ComboList.tsx` — ComboOffer 카드 목록, 정렬 버튼(합산가 낮은 순·항공가·호텔가), 항공 예약 / 호텔 예약 링크 (`target="_blank" rel="noopener noreferrer"`)
  - `components/family-fly/ComboList.test.tsx`
- **수용 기준**:
  - [ ] `combos` 배열 3개 전달 → 카드 3개 렌더됨
  - [ ] 각 카드에 항공편명, 항공 가격(₩N), 호텔명, 호텔 가격(₩N/박), 합산 가격 텍스트 표시
  - [ ] 기본 정렬 "합산가 낮은 순" — 카드가 `combinedPrice` 오름차순으로 렌더됨
  - [ ] "항공가" 정렬 버튼 클릭 → 카드가 `flight.price` 오름차순으로 재배치됨
  - [ ] "호텔가" 정렬 버튼 클릭 → 카드가 `hotel.nightlyRate` 오름차순으로 재배치됨
  - [ ] "항공 예약" 링크의 `target` 속성이 `"_blank"`, `rel`에 `"noopener"` 포함 (클릭 시 현재 탭 유지)
  - [ ] "호텔 예약" 링크의 `target` 속성이 `"_blank"`, `rel`에 `"noopener"` 포함
  - [ ] `combos` 빈 배열 → 카드 미렌더
- **검증**: `bun run test -- components/family-fly/ComboList`

---

### Task 6: 메인 페이지 통합 + 검색 흐름 연결

- **담당 시나리오**: Scenario 1 (전체 흐름: 검색 → 로딩 → 달력 → 조합 리스트)
- **크기**: M (3 파일)
- **의존성**: Tasks 3, 4, 5
- **참조**:
  - next-best-practices — rsc-boundaries (Client 컴포넌트에 Date 객체 직렬화 주의)
  - next-best-practices — suspense-boundaries (useSearchParams → Suspense 필요 시)
  - wireframe.html — 전체 흐름
- **구현 대상**:
  - `hooks/useSearch.ts` (`'use client'`) — 검색 상태(idle/loading/results/error), `search(params)` 액션, 선택된 날짜 상태, alertForm 표시 여부 상태
  - `app/page.tsx` — SearchForm → (loading) → PriceCalendar → (date 선택) → ComboList 조건부 렌더. 달력 뷰·조합 리스트 양쪽에 "가격 알림 설정" 버튼 → AlertForm 표시 (Task 8 의존, placeholder 처리 후 Task 8에서 실제 연결)
  - `app/layout.tsx` — 타이틀 "FamilyFly — 가족 여행 최저가 탐색기" 업데이트
- **수용 기준**:
  - [ ] `/` 진입 → 검색 폼이 렌더됨
  - [ ] 유효한 조건 입력 후 "검색" 클릭 → Skeleton(로딩) 표시됨
  - [ ] 로딩 완료 → 달력 뷰로 전환, 가격 있는 날짜 셀에 금액 표시
  - [ ] 달력에서 가격 있는 날짜 클릭 → 조합 리스트로 전환
  - [ ] 조합 리스트에서 "달력" 버튼 클릭 → 달력 뷰로 복귀
  - [ ] 달력 뷰의 "가격 알림 설정" 버튼 클릭 → AlertForm 영역이 표시됨
  - [ ] 조합 리스트의 "알림" 버튼 클릭 → AlertForm 영역이 표시됨
- **검증**: Browser MCP — `/` 접속, 검색 → 달력 → 조합 리스트 흐름 수행, 스크린샷 `artifacts/family-fly/evidence/task-6.png` 저장

---

### Checkpoint: Tasks 3-6 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 검색 → 달력 → 조합 리스트 end-to-end 흐름이 브라우저에서 동작

---

### Task 7: SQLite DB 스키마 + 알림 저장 Route Handler

- **담당 시나리오**: Scenario 7 (백엔드 — 알림 저장)
- **크기**: M (5 파일)
- **의존성**: None (독립 레이어)
- **참조**:
  - `better-sqlite3` npm 패키지 (`bun add better-sqlite3 @types/better-sqlite3`)
  - next-best-practices — route-handlers (POST = 알림 생성)
- **구현 대상**:
  - `types/alert.ts` — PriceAlert, CreateAlertInput 타입
  - `lib/db.ts` — DB 연결, `price_alerts` 테이블 CREATE TABLE IF NOT EXISTS, `app.db`를 `.gitignore`에 추가
  - `services/alerts.ts` — `createAlert(input)`, `getActiveAlerts()`, `deactivateAlert(token)`, `recordNotification(id)`
  - `app/api/alerts/route.ts` — `POST /api/alerts` (CreateAlertInput → 201 + { id, cancelToken })
  - `services/alerts.test.ts` — in-memory SQLite (`:memory:`)로 createAlert/deactivate 검증
- **수용 기준**:
  - [ ] `POST /api/alerts` 유효 body → 201, body에 `{ id, cancelToken }` 포함
  - [ ] `cancelToken`은 UUID 형식 (36자, `-` 포함)
  - [ ] 이메일 없이 POST → 400 응답
  - [ ] 항공·호텔 목표가 모두 없이 POST → 400, `{ error: "at least one target price required" }`
  - [ ] `flight_target_price`만 있고 `hotel_target_price` 없는 body → 201 (항공만 알림 유효)
  - [ ] `hotel_target_price`만 있고 `flight_target_price` 없는 body → 201 (호텔만 알림 유효)
  - [ ] 저장 후 `getActiveAlerts()` 결과에 해당 alert 포함
  - [ ] `deactivateAlert(token)` 호출 후 `getActiveAlerts()` 결과에서 제외됨
- **검증**: `bun run test -- services/alerts`

---

### Task 8: 알림 설정 폼 UI + 알림 취소 페이지

- **담당 시나리오**: Scenario 7 (UI), Scenario 8 (이메일 오류), Scenario 10 (취소 확인 페이지)
- **크기**: M (4 파일)
- **의존성**: Task 7 (POST /api/alerts), Task 6 (페이지 통합)
- **참조**:
  - shadcn — forms.md (Field + FieldDescription for helper text, aria-invalid 패턴)
  - wireframe.html — 알림설정, 취소확인 화면
- **구현 대상**:
  - `components/family-fly/AlertForm.tsx` (`'use client'`) — 이메일 입력, 항공·호텔 목표가 입력, 저장 → POST /api/alerts → 성공 상태
  - `components/family-fly/AlertForm.test.tsx`
  - `app/api/alerts/cancel/route.ts` — `GET /api/alerts/cancel?token=` → deactivateAlert, 취소 완료 or 이미 취소 분기
  - `app/cancel/[token]/page.tsx` — `cancel_token` URL param → GET /api/alerts/cancel → "알림이 취소되었습니다" or "이미 취소된 알림입니다" 표시
- **수용 기준**:
  - [ ] 이메일 필드에 `"abc"` 입력 후 "알림 저장" 클릭 → "올바른 이메일 주소를 입력하세요" 오류 텍스트 표시
  - [ ] 이메일 필드에 `"abc@"` 입력 → 동일 오류 표시
  - [ ] 이메일 필드에 `"@domain.com"` 입력 → 동일 오류 표시
  - [ ] 항공·호텔 목표가 모두 비운 채 저장 → "항공 또는 호텔 목표 가격 중 하나 이상을 입력하세요" 표시
  - [ ] 항공 목표가만 입력하고 저장 → "알림이 설정되었습니다" 성공 메시지 표시
  - [ ] 호텔 목표가만 입력하고 저장 → "알림이 설정되었습니다" 성공 메시지 표시
  - [ ] 유효한 이메일 + 목표가 입력 후 저장 → "알림이 설정되었습니다" 성공 메시지 표시
  - [ ] `GET /app/cancel/[token]` (유효 토큰) → "알림이 취소되었습니다" 텍스트 표시
  - [ ] 동일 토큰 재방문 → "이미 취소된 알림입니다" 텍스트 표시
- **검증**: `bun run test -- components/family-fly/AlertForm`; Browser MCP — 알림 설정 → 취소 링크 방문, 스크린샷 `artifacts/family-fly/evidence/task-8.png` 저장

---

### Checkpoint: Tasks 7-8 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 알림 설정 → POST 성공 → 취소 링크 클릭 → 취소 확인 페이지 end-to-end 동작

---

### Task 9: Cron 가격 폴링 + Resend 이메일 발송

- **담당 시나리오**: Scenario 9 (이메일 알림 수신 — 비시각적, 서버 동작)
- **크기**: M (2 파일)
- **의존성**: Tasks 2 (price search), 7 (active alerts)
- **참조**:
  - `resend` npm 패키지 (`bun add resend`)
  - https://resend.com/docs/api-reference/emails/send-email
  - next-best-practices — route-handlers (CRON_SECRET 헤더로 무단 접근 차단)
- **구현 대상**:
  - `services/email.ts` — `sendPriceDropAlert(alert: PriceAlert, hit: { type, currentPrice, previousPrice, bookingUrl }): Promise<void>` (Resend SDK)
  - `app/api/cron/check-prices/route.ts` — `GET /api/cron/check-prices` (Authorization: Bearer CRON_SECRET 검증) → `getActiveAlerts()` → 각 alert에 대해 `fetchDayPrices()` → 목표가 이하 감지 시 `sendPriceDropAlert()` → `recordNotification()`
- **수용 기준**:
  - [ ] `GET /api/cron/check-prices` CRON_SECRET 헤더 없음 → 401 응답
  - [ ] 올바른 CRON_SECRET → 200 응답, body에 처리된 alert 수 포함
  - [ ] 항공 가격이 `flight_target_price` 이하인 alert → Resend API 호출됨 (Human review: 실제 이메일 수신 확인)
  - [ ] 호텔 가격이 `hotel_target_price` 이하인 alert → Resend API 호출됨 (Human review)
  - [ ] 이메일 제목에 "가격 하락 알림" 포함 (Human review)
  - [ ] 이메일 본문에 항공편명/호텔명, 현재 가격, 하락 금액, 예약 링크, 취소 링크 포함 (Human review)
  - [ ] 알림 발송 후 `last_notified_at` 업데이트됨 → 다음 cron 실행 시 중복 발송 안 됨
- **검증**:
  - `bun run test -- services/email` (Resend mock)
  - Human review — 테스트 이메일 주소로 알림 강제 트리거, 내용 확인, 증거 `artifacts/family-fly/evidence/task-9-email.png` 저장

---

## 미결정 항목

- **공항 자동완성 데이터**: Combobox에 제공할 공항 목록 소스 — 정적 JSON (ICN, GMP, NRT 등 주요 공항 하드코딩) vs Amadeus Airport Search API. MVP에서는 정적 목록으로 시작 권장
- **Cron 실행 주기**: Next.js 배포 환경에 따라 Vercel Cron (vercel.json 설정) vs 외부 cron 서비스 — 로컬 개발에서는 수동 curl로 검증. 배포 시 결정
- **호텔 도시 코드**: Amadeus Hotel API는 도시 코드(예: TYO)를 요구 — IATA 공항 코드(NRT)에서 도시 코드로 변환 필요. 정적 매핑 또는 Amadeus City Search API 사용 여부
