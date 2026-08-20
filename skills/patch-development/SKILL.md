---
name: patch-development
description: Rule and guideline for Patch-based Development in AI Studio to minimize token count, avoid hallucinations, and promote clean file decomposition.
---

# Patch-based Development (패치 기반 개발 구조)

This skill overrides default full-file writing behaviors to ensure incremental, low-token, and highly-maintainable development that prevents hallucinations.

---

## 1. Core Principles (Patch 원칙)

1. **Original File Preservation (원본 파일 보존)**:
   - Keep baseline files read-only and intact.
   - For standalone HTML apps, store the baseline as `standalone/*_base.html` and versioned edits as `standalone/*_v2.html`, `standalone/*_v3.html` etc.
   - For full-stack React projects, avoid single giant files. Move to a modular architecture representing separate layers.

2. **Decoupled Patch Units (패치 단위의 명백한 분리)**:
   - Separated into **CSS Patch**, **HTML Patch**, and **JS Patch** layers if operating on templates.
   - Keep components segregated by functional blocks.

3. **Surgical Precision replacing (정밀 구획 교체)**:
   - NEVER overwrite entire files of large scale.
   - Locate exact target strings and utilize the `edit_file` or `multi_edit_file` tool to replace precise lines.
   - Perform a `view_file` on targeted sections right before updating to avoid drift.

4. **Structured Multi-file Layout (기능별 독립 파일 분할)**:
   - For any complex or evolving fullstack app, **absolutely refuse single massive files** (e.g., extremely long App.tsx or single-file servers).
   - Divide into logical sub-components, router endpoints, or utility modules.

---

## 2. File Naming Conventions (파일 명명 규칙)

- **Standalone Mode**:
  - `standalone/기구물 비전 검사_base.html` : Baseline read-only template.
  - `standalone/기구물 비전 검사_v2.html`   : Accumulated patches version 2.
  - `standalone/기구물 비전 검사_v3.html`   : Accumulated patches version 3.

- **Full-stack Mode**:
  - `fullstack/backend/routers/channels.py` : Separated by back-end operational modules.
  - `fullstack/frontend/src/components/`     : Separated by individual UI components.

---

## 3. Best Practices for Developers
- Always declare strict states first.
- If introducing logic, build modular testable JS/TS files.
- Run `lint_applet` and `compile_applet` after applying small patches to immediately check validity.
