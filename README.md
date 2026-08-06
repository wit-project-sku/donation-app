# Donation-app

**키오스크 안에서 도는 기부 화면**

## About this repository

키오스크 본체가 WebView로 띄우는 기부 전용 웹앱입니다. 기부 대상을 고르는 것부터 결제, 증서 발급, 기부벽에 이름이 올라가는 것까지 흐름 전체를 담당합니다.

경로가 두 갈래입니다. **NGO 캠페인**은 캠페인 목록에서 하나를 골라 상세를 보고 금액을 정한 뒤 결제하고, 메시지를 남기고 의상을 골라 증서를 받은 다음 기부벽으로 갑니다. **학교 기부**는 학교를 고르는 것으로 시작해 같은 모양의 흐름을 따로 갑니다.

화면은 키오스크 세로 화면(2160×3840)에 맞춘 고정 크기로 그린 뒤 CSS 배율로 뷰포트에 맞춥니다. 그래서 창 크기와 무관하게 같은 비율로 보입니다. 지점에 따라 테마 색이 달라지며 이 값은 URL 쿼리로 들어옵니다.

**AR 사진 촬영은 이 앱이 하지 않습니다.** 카메라는 키오스크 본체가 다루고, 이 앱은 촬영을 요청한 뒤 결과 이미지 주소만 받습니다. 둘 사이는 브리지라는 얇은 통신 계층으로 연결됩니다.

기부 데이터는 admin-be에서 옵니다. 다만 **카드 결제만은 예외로**, 서버가 아니라 키오스크에 붙어 있는 결제 단말 에이전트를 직접 호출합니다.

## Built With

* TypeScript
* React 19
* Vite
* React Router v7 — HashRouter
* Zustand — 기부 세션 상태
* TanStack Query — 데이터 조회
* qrcode.react — 모바일 증서 QR
* Swiper — 의상 선택 캐러셀

## Getting started

### Prerequisites

* **Node.js:** v20.19.0 이상 또는 v22.12.0 이상

### Installation

1. **Repository 클론**

```bash
git clone https://github.com/wit-project-sku/donation-app.git
cd donation-app
```

2. **의존성 설치**

```bash
npm install
```

3. **환경 변수 설정**

```bash
# .env.example 파일을 복사하여 .env.local 파일을 생성하고, 각 항목을 입력합니다.
cp .env.example .env.local
```

들어가는 키는 다음과 같습니다.

```
VITE_API_BASE_URL              백엔드 주소. 비워 두면 같은 출처로 요청하고 아래 프록시가 받습니다
VITE_API_PROXY_TARGET          개발 서버가 /api 요청을 넘길 실제 백엔드
VITE_PAYMENT_API_BASE_URL      키오스크 결제 단말 에이전트 주소
VITE_PUBLIC_APP_URL            모바일 증서 QR에 들어갈 공개 주소
VITE_AR_PROCESS_API_URL        AR 합성 서비스 주소
VITE_AR_PROCESS_IMAGE_API_URL  AR 합성 이미지 주소
```

로컬 개발은 `VITE_API_BASE_URL`을 비워 두고 프록시로 붙는 쪽이 편합니다. 키오스크 WebView나 운영에서는 백엔드를 직접 가리킵니다.

VITE_로 시작하는 값은 빌드할 때 번들에 그대로 인라인되어 브라우저에서 보입니다. 비밀로 지켜야 하는 값은 넣지 마세요.

### Run Project

```bash
npm run dev
```

주소를 그대로 치면 안 됩니다. **HashRouter를 쓰기 때문에 `#/`가 필요하고, 테마를 결정하는 지점 값도 함께 넣어야** 화면이 제대로 보입니다.

```
http://localhost:5173/#/?location=insadong
```

지점 값은 insadong, osaek, hwaseong 중 하나입니다. 생략하면 인사동으로 동작합니다. 첫 화면이 뜨고 색이 해당 지점 테마로 나오면 정상입니다. 세로 비율이 아닌 창에서는 스테이지가 작게 축소되어 보입니다.

빌드는 `npm run build`이고 여기에 타입 검사가 포함돼 있습니다. 린트는 `npm run lint`, 빌드 결과 확인은 `npm run preview`입니다. 자동화된 테스트가 없으므로 변경을 확인할 때는 브라우저에서 해당 흐름을 직접 눌러 봐야 합니다.

### Before You Start

**HashRouter 전제를 깨지 마세요.** WebView 안에서는 브라우저 히스토리를 믿을 수 없어서 뒤로 가기를 직접 만든 매핑표로 처리합니다. 화면을 추가하면 그 표에도 함께 등록해야 뒤로 가기가 동작합니다. 화면 이동은 항상 전용 훅을 써야 지점 값이 유지됩니다.

**사진이 조용히 누락되는 지점이 있습니다.** 기부 상세를 보낼 때 사진은 `capturedPhotoUrl`이 `blob:`으로 시작할 때만 첨부됩니다. 원격 주소 형태로 들어오면 **에러 없이 사진만 빠진 채 전송됩니다.** 알려진 결함이니 사진 처리 코드를 손댈 때 이 분기를 반드시 유지하거나 의도적으로 확장하세요.

**결제는 다른 클라이언트를 씁니다.** 나머지 API와 달리 결제는 키오스크 단말 에이전트로 직접 가고 타임아웃이 3분입니다. 주문 식별자는 결제 전에 만들어 세션에 저장한 뒤 사진과 증서 단계까지 이어집니다.

**세션은 sessionStorage에 남습니다.** 사진 진행 상태처럼 일시적인 값은 제외됩니다. 캠페인을 새로 고르면 세션이 초기화되지만 테마를 유지하려고 기부 분류만 남깁니다.

**브라우저 단독 실행에서는 촬영이 동작하지 않습니다.** 키오스크 브리지가 없으면 촬영 요청이 무시되고 앱 내 이동으로 대체됩니다. 촬영을 포함한 흐름 전체를 확인하려면 실제 기기가 필요합니다.

## Project Structure

```
src/
├── main.tsx → App.tsx        라우트 정의와 3분 유휴 시 홈 복귀
├── pages/                    화면 하나당 파일 하나 + 같은 이름의 CSS
│                             NGO 흐름과 학교 흐름이 각각 한 벌씩
├── config/navigation.ts      라우트 목록과 뒤로 가기 매핑표
├── api/                      공통 클라이언트 + 리소스별 모듈, types.ts에 DTO 전부
├── store/donationStore.ts    기부 세션 zustand 스토어
├── utils/kioskBridge.ts      키오스크 본체와의 통신
├── hooks/                    지점 값 유지 이동, 촬영 결과 수신
├── theme/                    지점별 색과 주최자 정보
└── components/ styles/ data/ types/
```

화면을 추가할 때는 pages에 파일을 만들고 `config/navigation.ts`의 라우트와 뒤로 가기 표에 함께 등록합니다. 서버 호출은 api 폴더에 리소스별 모듈로 넣고, 공통 클라이언트가 응답 껍데기를 벗기고 실패 시 예외를 던지는 구조를 따릅니다. DTO를 앱 타입으로 바꾸는 매핑도 각 모듈 안에서 합니다.

## Deployment

키오스크 본체가 WebView로 불러가는 형태라 이 저장소만 따로 배포되지 않습니다. 정적 번들을 빌드해 호스팅하고 키오스크가 그 주소를 로드합니다.

배포는 요청받았을 때만 합니다. 작업을 시작할 때 기본 브랜치에 있다면 먼저 작업 브랜치로 분기하세요.

## References

* [Swagger](https://api-stage-v3.witteria.com/swagger-ui/index.html) — 백엔드 API 명세
* [admin-be](../admin-be/README.md) — 백엔드 저장소. 기부 도메인이 여기 있습니다
* [kiosk-electron](../kiosk-electron/README.md) — 이 앱을 띄우는 키오스크 본체
* [admin-fe](../admin-fe/README.md) — 캠페인과 학교를 관리하는 관리자 웹
* [wit-platform-docs](../wit-platform-docs/README.md) — 플랫폼 전체 그림, 온보딩, 인프라
