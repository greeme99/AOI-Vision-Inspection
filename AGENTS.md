# AI Coding Agent Custom Directive: Patch-based Development Structure

To minimize token cost, avoid system-level hallucinations, and ensure optimal incremental development, we strictly adhere to the **Patch-based Development (패치 기반 개발 구조)** model.

---

## 1. 3대 패치 개발 원칙 (Three Patch Principles)

1. **원본 파일 영구 보존 (Baseline Preservation)**
   - 원형을 이루는 베이스 코드는 읽기 전용(`_base`)으로 보존하고 신규 패치는 버전 업그레이드 복제본(`_v2`, `_v3`)에 차곡차곡 누적합니다.
   
2. **패치 단위 분리 세분화 (Decoupled Patch Units)**
   - CSS 스타일링 변경, HTML 레이아웃 개편, JS/TS 비즈니스 로직 수정은 각각 독립된 모듈 혹은 블록 단위의 패치로 별도 개발/교체합니다.
   - 모든 수정은 파일 전체 덮어쓰기가 아닌, `edit_file` 및 `multi_edit_file` 도구를 사용해 정확한 변경 부위만 타겟팅합니다.

3. **고집적 단일 거대 파일 금지 (Anti-Giant Single File)**
   - 풀스택 개발 시, 절대로 하나의 거대한 파일에 모든 비즈니스 로직과 UI를 몰아넣지 마십시오 (예: 단일 App.tsx 개발 지양).
   - 레이아웃, 공통 상태 관리, 기능 모듈, 세부 화면 카테고리는 반드시 별도의 피처 폴더와 서브 컴포넌트로 분리합니다.

---

## 2. 파일 명명 & 디렉토리 격리 가이드 (Target Conventions)

- **독립 실행형 파일군 (Standalone Context)**:
  - `standalone/기구물 비전 검사_base.html` (최초 원형 버전, 수정 불가)
  - `standalone/기구물 비전 검사_v2.html` (v2 누적 개량 패치본)
  - `standalone/기구물 비전 검사_v3.html` (v3 누적 개량 패치본)

- **풀스택 앱 파일군 (Fullstack Context)**:
  - `fullstack/backend/routers/channels.py` (백엔드 라우터 및 연동 로직 분할)
  - `fullstack/frontend/src/components/` (프론트엔드 UI 컴포넌트 분할)

---

## 3. 코드 분할 조치 준수 사항
- 어떠한 상황에서도 1000라인 이상의 거대 코드를 한 파일로 보존하지 말 것.
- 새로운 피처 추가나 화면 개선 시 우선적으로 컴포넌트 분리 계획을 세우고, 서브 컴포넌트를 리팩토링한 뒤 최소한의 인터페이스만 부모(App.tsx 등)에 복원할 것.
