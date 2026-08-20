# 🔍 AOI-Vision Inspection (스마트 비전 AI 검사 시스템)

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=flat-square&logo=github)](https://greeme99.github.io/AOI-Vision-Inspection/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

> **AOI-Vision Inspection**은 산업용 PCB, 기구물, 반도체 및 전자 부품의 품질 검사를 위해 개발된 **지능형 VLM(Vision-Language Model) 기반 자동 광학 검사(Automated Optical Inspection) 웹 시스템**입니다.  
> 초고속 로컬 비전 처리 알고리즘과 멀티모달 AI 추론을 결합하여 결함을 실시간으로 감지하고, 불량 데이터를 스스로 학습하여 검사 정확도를 능동적으로 진화시킵니다.

---

## 🌐 서비스 및 배포 접속 URL

| 환경 | 접속 URL | 설명 |
| :--- | :--- | :--- |
| 🚀 **GitHub Pages (운영 배포)** | [https://greeme99.github.io/AOI-Vision-Inspection/](https://greeme99.github.io/AOI-Vision-Inspection/) | 상용 글로벌 CDN 정적 웹 배포 버전 |
| ⚡ **Shared Production App** | [https://ais-pre-wzl5zwcrdcpso3h3yn2wia-650867111857.asia-east1.run.app](https://ais-pre-wzl5zwcrdcpso3h3yn2wia-650867111857.asia-east1.run.app) | Cloud Run 컨테이너 실시간 공유 인스턴스 |
| 🛠️ **Development App** | [https://ais-dev-wzl5zwcrdcpso3h3yn2wia-650867111857.asia-east1.run.app](https://ais-dev-wzl5zwcrdcpso3h3yn2wia-650867111857.asia-east1.run.app) | 실시간 핫리로드 개발 테스트 환경 |
| 📦 **GitHub Repository** | [https://github.com/greeme99/AOI-Vision-Inspection](https://github.com/greeme99/AOI-Vision-Inspection) | 공식 소스코드 형상관리 원격 저장소 |

---

## ✨ 핵심 기능 (Key Features)

### 1. 📊 파레토(Pareto 80/20) 복합 결함 분석 대시보드
- 결함 유형별 발생 빈도 및 **누적 점유율 곡선(80/20 임계치 가이드)** 실시간 시각화.
- 주요 불량 요인(스크래치, 납땜 불량, 미세 크랙 등)을 집중 관리할 수 있는 우선순위 지표 제공.
- 실시간 분석 리포트 CSV 및 이미지 내보내기 지원.

### 2. 🔊 Web Audio API 기반 무지연 청각 알람 (Audio Alert Engine)
- 비동기 사운드 파일 다운로드 방식 대신 **Web Audio API 오실레이터(Oscillator)**를 통한 직접 파형 합성.
- 판정 즉시 **0ms 레이턴시**로 명확한 OK 청각음(High Melodic Arpeggio) 및 NG 경고음(Low Staccato Alert) 출력.
- 알람 음소거(Mute) 및 볼륨 세밀 조절 기능 내장.

### 3. 🧠 불량 지식베이스(Knowledge Base) & AI 자가 학습(Active Learning)
- 검출된 NG 스냅샷 및 오탐/미탐 사례를 **피드백 모달**을 통해 실시간 DB로 등록.
- 수집된 결함 데이터를 VLM 프롬프트의 Few-Shot Example로 자동 반영하여 **현장 환경에 맞춰 검사 AI가 스스로 학습하고 진화**.
- JSON 불량 DB 가져오기/내보내기 백업 파이프라인 탑재.

### 4. 🔍 듀얼 줌(하드웨어 광학 줌 & 소프트웨어 디지털 줌) 제어
- 산업용 USB/CSI 카메라의 **MediaTrackConstraints 광학 줌 API** 직접 연동.
- 광학 줌 미지원 디바이스를 위한 캔버스 기반 고해상도 **디지털 줌 & 팬(Pan) 컨트롤러** 제공.

### 5. 🎛️ 검사 감도 원클릭 프리셋 & 파라미터 튜닝
- `엄격(Strict)`, `표준(Standard)`, `유연(Relaxed)` 등 공정별 1-클릭 감도 프리셋 전환.
- Structural Similarity(SSIM), Edge Diff Threshold, AI Confidence Cutoff 등 상세 파라미터 실시간 조정.

### 6. 📱 스마트폰 무선 브리지(Wireless Bridge Node)
- 모바일 디바이스의 고화질 카메라를 무선 비전 노드로 연결하여 이동형 AOI 검사 환경 구성.

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Motion
- **Icons & UI**: Lucide React, Headless UI Patterns
- **Audio & Signal**: Web Audio API Sound Synthesizer
- **Vision & Barcode**: HTML5 Canvas Vision Processing, QuaggaJS Barcode Scanner, WebRTC MediaStream
- **Deployment & CI/CD**: GitHub Actions, GitHub Pages, Google Cloud Run

---

## 📜 버전 및 배포 이력 (Changelog & Version History)

### 📌 `v1.4.0` — 2026-08-20 (Current Release)
- **앱 명칭 변경 및 브랜드 일원화**: `Smart VLM-AOI Vision System` → `AOI-Vision Inspection` 으로 공식 명칭 확정.
- **GitHub 저장소 리네이밍**: `greeme99/AX-AOI` → `greeme99/AOI-Vision-Inspection` 으로 변경 및 원격 URL 동기화.
- **GitHub Pages 상용 배포 체계 구축**: `gh-pages` 브랜치 자동 빌드 및 상대 경로(`base: './'`) 최적화 적용.
- **README.md 문서화**: 개발 이력, 버전 릴리스 로그, 아키텍처 및 업데이트 가이드 공식 작성.

### 📌 `v1.3.0` — 2026-08-19
- **파레토 80/20 결함 분석 대시보드 (`DefectParetoModal`)** 추가.
- **Web Audio API 오디오 알람 엔진 (`audioAlert.ts`)** 구축 (0ms 지연의 OK/NG 합성음).
- **실시간 결함 스냅샷 피드백 모달 (`DefectFeedbackModal`)** 구현.
- **불량 지식베이스 및 Active Learning 파이프라인 (`DefectKnowledgeBaseModal`, `defectLearner.ts`)** 통합.
- **검사 감도 프리셋 튜너 (`CenterPanel`)** 및 **카메라 줌 컨트롤러 (`LeftPanel`)** 고도화.

### 📌 `v1.2.0` — 2026-08-18
- **스마트폰 무선 비전 브리지 (`SmartphoneBridgeModal`)** 모듈 개발.
- **바코드/QR 리더기 연동 (`barcodeScanner.ts`, `qrCode.ts`)** 및 시리얼 자동 매핑.
- **검사 히스토리 로깅 & 플로팅 결함 툴팁 (`HistoryLogItem`)** UI 개선.

### 📌 `v1.1.0` — 2026-08-10
- 패치 기반 개발 구조(Patch-based Development) 채택 및 모듈 분리 리팩토링.
- 유사도 트렌드 실시간 시각화 차트 (`SimilarityTrendChart`) 추가.
- 단독 실행형 HTML 내보내기 도구 (`standaloneExporter.ts`) 지원.

### 📌 `v1.0.0` — 2026-07-08
- AOI-Vision Inspection 프로젝트 초기 설계 및 프로토타입 릴리스.
- 실시간 웹캠 비디오 스트림 캡처 및 기준 이미지(Golden Sample) 대비 비전 검사 알고리즘 구현.

---

## 🔄 지속적 업데이트 및 유지관리 규칙 (Maintenance Rules)

수정사항이나 신규 기능이 추가될 경우 다음과 같은 절차에 따라 README 및 원격 배포를 갱신합니다:

1. **Changelog 기록**: 신규 기능 추가 또는 버그 수정 시 `README.md`의 **버전 및 배포 이력** 섹션에 신규 버전 번호와 수정 내역을 즉시 기록합니다.
2. **Git Commit & Push**: 메인 소스코드 변경분을 `main` 브랜치에 커밋 및 원격 푸시합니다.
3. **GitHub Pages 배포 동기화**: `npm run build` 후 최신 정적 빌드본을 `gh-pages` 브랜치에 반영하여 배포 웹 URL([https://greeme99.github.io/AOI-Vision-Inspection/](https://greeme99.github.io/AOI-Vision-Inspection/))에 실시간 적용합니다.
