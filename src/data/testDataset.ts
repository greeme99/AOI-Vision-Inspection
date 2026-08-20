import { DefectRecord, InspectionHistory, MasterItem } from "../types";

/**
 * 테스트 시나리오용 기준 골든 마스터(Golden Master) SVG 데이터 URL
 */
export const SAMPLE_GOLDEN_MASTER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <rect width="640" height="480" fill="%230f2b1d" />
  <!-- PCB 외곽 가이드선 및 마운팅 홀 -->
  <rect x="40" y="40" width="560" height="400" rx="16" fill="%23143d2b" stroke="%232e7d32" stroke-width="4" />
  <circle cx="70" cy="70" r="14" fill="%23c5a059" stroke="%23ffe082" stroke-width="3"/>
  <circle cx="570" cy="70" r="14" fill="%23c5a059" stroke="%23ffe082" stroke-width="3"/>
  <circle cx="70" cy="410" r="14" fill="%23c5a059" stroke="%23ffe082" stroke-width="3"/>
  <circle cx="570" cy="410" r="14" fill="%23c5a059" stroke="%23ffe082" stroke-width="3"/>
  
  <!-- 동박 배선 (Copper Traces) -->
  <path d="M 120 100 L 220 100 L 260 160 L 380 160 L 420 220 L 520 220" stroke="%23c5a059" stroke-width="3" fill="none" opacity="0.8"/>
  <path d="M 120 380 L 220 380 L 260 320 L 380 320 L 420 260 L 520 260" stroke="%23c5a059" stroke-width="3" fill="none" opacity="0.8"/>
  <path d="M 200 150 L 200 330" stroke="%23c5a059" stroke-width="2" fill="none" opacity="0.7"/>
  <path d="M 440 150 L 440 330" stroke="%23c5a059" stroke-width="2" fill="none" opacity="0.7"/>

  <!-- 메인 MCU 칩 (U1: QFP-64) -->
  <rect x="250" y="170" width="140" height="140" rx="8" fill="%231e1e24" stroke="%23silver" stroke-width="2"/>
  <circle cx="270" cy="190" r="4" fill="%23ffffff" />
  <text x="320" y="245" font-family="monospace" font-size="14" font-weight="bold" fill="%23e0e0e0" text-anchor="middle">ARM-Cortex-M4</text>
  <text x="320" y="265" font-family="monospace" font-size="10" fill="%23888888" text-anchor="middle">STM32F407VGT6</text>
  
  <!-- MCU 핀 (Pins) -->
  <!-- Top/Bottom Pins -->
  <line x1="270" y1="155" x2="270" y2="170" stroke="%23silver" stroke-width="4"/>
  <line x1="290" y1="155" x2="290" y2="170" stroke="%23silver" stroke-width="4"/>
  <line x1="310" y1="155" x2="310" y2="170" stroke="%23silver" stroke-width="4"/>
  <line x1="330" y1="155" x2="330" y2="170" stroke="%23silver" stroke-width="4"/>
  <line x1="350" y1="155" x2="350" y2="170" stroke="%23silver" stroke-width="4"/>
  <line x1="370" y1="155" x2="370" y2="170" stroke="%23silver" stroke-width="4"/>
  
  <line x1="270" y1="310" x2="270" y2="325" stroke="%23silver" stroke-width="4"/>
  <line x1="290" y1="310" x2="290" y2="325" stroke="%23silver" stroke-width="4"/>
  <line x1="310" y1="310" x2="310" y2="325" stroke="%23silver" stroke-width="4"/>
  <line x1="330" y1="310" x2="330" y2="325" stroke="%23silver" stroke-width="4"/>
  <line x1="350" y1="310" x2="350" y2="325" stroke="%23silver" stroke-width="4"/>
  <line x1="370" y1="310" x2="370" y2="325" stroke="%23silver" stroke-width="4"/>

  <!-- SMT 칩 저항 & 커패시터 군 (R1~R4, C1~C4) -->
  <rect x="120" y="160" width="30" height="15" fill="%23222" stroke="%23silver" stroke-width="3"/>
  <text x="135" y="152" font-family="sans-serif" font-size="9" fill="%23fff" text-anchor="middle">R1(10k)</text>
  <rect x="120" y="200" width="30" height="15" fill="%23222" stroke="%23silver" stroke-width="3"/>
  <text x="135" y="192" font-family="sans-serif" font-size="9" fill="%23fff" text-anchor="middle">R2(4.7k)</text>
  <rect x="120" y="240" width="30" height="15" fill="%238d6e63" stroke="%23silver" stroke-width="3"/>
  <text x="135" y="232" font-family="sans-serif" font-size="9" fill="%23fff" text-anchor="middle">C1(100nF)</text>
  <rect x="120" y="280" width="30" height="15" fill="%238d6e63" stroke="%23silver" stroke-width="3"/>
  <text x="135" y="272" font-family="sans-serif" font-size="9" fill="%23fff" text-anchor="middle">C2(10uF)</text>

  <!-- 파워 레귤레이터 (U2: SOT-223) -->
  <rect x="470" y="160" width="45" height="35" rx="3" fill="%23333" stroke="%23silver" stroke-width="2"/>
  <rect x="485" y="148" width="15" height="12" fill="%23silver"/>
  <rect x="475" y="195" width="8" height="12" fill="%23silver"/>
  <rect x="488" y="195" width="8" height="12" fill="%23silver"/>
  <rect x="501" y="195" width="8" height="12" fill="%23silver"/>
  <text x="492" y="182" font-family="sans-serif" font-size="9" fill="%23fff" text-anchor="middle">AMS1117</text>

  <!-- 크리스탈 발진기 (Y1: 16MHz) -->
  <rect x="470" y="250" width="50" height="25" rx="5" fill="%23cccccc" stroke="%23888888" stroke-width="2"/>
  <text x="495" y="267" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23222222" text-anchor="middle">16.000M</text>

  <!-- 바코드 & 실크스크린 마크 -->
  <rect x="120" y="340" width="100" height="28" fill="%23ffffff" stroke="%23000000" stroke-width="1"/>
  <!-- 바코드 라인들 -->
  <line x1="128" y1="345" x2="128" y2="362" stroke="%23000" stroke-width="2"/>
  <line x1="134" y1="345" x2="134" y2="362" stroke="%23000" stroke-width="3"/>
  <line x1="140" y1="345" x2="140" y2="362" stroke="%23000" stroke-width="1"/>
  <line x1="145" y1="345" x2="145" y2="362" stroke="%23000" stroke-width="4"/>
  <line x1="155" y1="345" x2="155" y2="362" stroke="%23000" stroke-width="2"/>
  <line x1="162" y1="345" x2="162" y2="362" stroke="%23000" stroke-width="3"/>
  <line x1="172" y1="345" x2="172" y2="362" stroke="%23000" stroke-width="1"/>
  <line x1="178" y1="345" x2="178" y2="362" stroke="%23000" stroke-width="4"/>
  <line x1="190" y1="345" x2="190" y2="362" stroke="%23000" stroke-width="2"/>
  <line x1="200" y1="345" x2="200" y2="362" stroke="%23000" stroke-width="3"/>
  <line x1="210" y1="345" x2="210" y2="362" stroke="%23000" stroke-width="2"/>
  <text x="170" y="366" font-family="monospace" font-size="6" fill="%23000" text-anchor="middle">AOI-PCB-M01</text>

  <text x="320" y="80" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23ffffff" text-anchor="middle">AX-AOI GOLDEN MASTER BOARD REV 2.4</text>
</svg>`;

/**
 * 결함 시각화 SVG 생성 헬퍼
 */
export function generateDefectSvg(defectType: string, description: string): string {
  let defectGraphic = "";
  if (defectType === "납 브릿지 (Solder Bridge)") {
    defectGraphic = `
      <!-- U1 핀 사이 솔더 브릿지 쇼트 결함 -->
      <circle cx="300" cy="162" r="9" fill="%23e53935" opacity="0.85" />
      <polygon points="290,160 310,160 300,165" fill="%23silver" stroke="%23e53935" stroke-width="2"/>
      <rect x="280" y="145" width="40" height="35" fill="none" stroke="%23e53935" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="300" y="140" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23e53935" text-anchor="middle">DEFECT: Solder Bridge</text>
    `;
  } else if (defectType === "부품 미삽 (Missing Component)") {
    defectGraphic = `
      <!-- R1 부품 미삽 결함: 패드만 남아있음 -->
      <rect x="120" y="160" width="30" height="15" fill="%23143d2b" stroke="%23e53935" stroke-width="2" stroke-dasharray="2,2"/>
      <line x1="120" y1="160" x2="150" y2="175" stroke="%23e53935" stroke-width="2"/>
      <line x1="150" y1="160" x2="120" y2="175" stroke="%23e53935" stroke-width="2"/>
      <text x="135" y="140" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23e53935" text-anchor="middle">DEFECT: Missing R1</text>
    `;
  } else if (defectType === "부품 오삽/틀어짐 (Misaligned Part)") {
    defectGraphic = `
      <!-- C2 부품 각도 30도 틀어짐 -->
      <g transform="rotate(30 135 287)">
        <rect x="120" y="280" width="30" height="15" fill="%238d6e63" stroke="%23e53935" stroke-width="3"/>
      </g>
      <circle cx="135" cy="287" r="22" fill="none" stroke="%23e53935" stroke-width="2" stroke-dasharray="4,4"/>
      <text x="135" y="325" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23e53935" text-anchor="middle">DEFECT: Tilt 30°</text>
    `;
  } else if (defectType === "표면 스크래치 (Surface Scratch)") {
    defectGraphic = `
      <!-- PCB 메인 영역 깊은 스크래치 -->
      <path d="M 220 200 Q 320 230 420 190" stroke="%23ffeb3b" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M 220 200 Q 320 230 420 190" stroke="%23d32f2f" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      <text x="320" y="210" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23ffeb3b" text-anchor="middle">SCRATCH (Depth: 0.15mm)</text>
    `;
  } else if (defectType === "하우징 크랙 (Crack)") {
    defectGraphic = `
      <!-- 기구물 외곽선 크랙 파손 -->
      <path d="M 540 50 L 555 75 L 545 95 L 565 120" stroke="%23ff1744" stroke-width="4" fill="none"/>
      <circle cx="550" cy="85" r="25" fill="none" stroke="%23ff1744" stroke-width="2" stroke-dasharray="3,3"/>
      <text x="550" y="135" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23ff1744" text-anchor="middle">CRACK</text>
    `;
  } else {
    defectGraphic = `
      <!-- 이물질 오염 (Contamination) -->
      <circle cx="490" cy="210" r="14" fill="%235d4037" opacity="0.9" stroke="%23ff9800" stroke-width="2"/>
      <circle cx="482" cy="205" r="5" fill="%233e2723"/>
      <text x="490" y="240" font-family="sans-serif" font-size="10" font-weight="bold" fill="%23ff9800" text-anchor="middle">CONTAMINATION</text>
    `;
  }

  return SAMPLE_GOLDEN_MASTER_SVG.replace("</svg>", `${defectGraphic}</svg>`);
}

/**
 * 10건의 불량 지식베이스(Defect Knowledge Base) 시나리오 참조 데이터셋
 */
export const SCENARIO_DEFECT_KNOWLEDGE_SEED: DefectRecord[] = [
  {
    id: "defect-seed-001",
    timestamp: Date.now() - 3600000 * 8,
    time: "2026-08-20 09:15:22",
    serial: "SN-2026-PCB-004",
    barcode: "AOI-PCB-M04",
    imageUrl: generateDefectSvg("납 브릿지 (Solder Bridge)", "U1 칩 Pin 14-15 쇼트"),
    cropImageUrl: generateDefectSvg("납 브릿지 (Solder Bridge)", "U1 칩 Pin 14-15 쇼트"),
    defectType: "납 브릿지 (Solder Bridge)",
    severity: "CRITICAL",
    similarityCV: 74.2,
    similarityAI: 71.0,
    aiReason: "MCU U1 패키지 상단 14~15번 핀 사이 리플로우 솔더링 불량으로 인한 0.8mm 납 브릿지 쇼트 감지.",
    feedbackNote: "납땜 불량 발생 시 인두기 리워크 및 솔더윅 잔여물 제거 확인 필수. 솔더 브릿지 집중 감시 요망.",
    defects: [{ x: 280, y: 145, w: 40, h: 35, label: "납 브릿지 (Solder Bridge)" }],
    isLearned: true,
  },
  {
    id: "defect-seed-002",
    timestamp: Date.now() - 3600000 * 7,
    time: "2026-08-20 10:02:11",
    serial: "SN-2026-PCB-007",
    barcode: "AOI-PCB-M07",
    imageUrl: generateDefectSvg("부품 미삽 (Missing Component)", "R1 칩 저항 미삽"),
    cropImageUrl: generateDefectSvg("부품 미삽 (Missing Component)", "R1 칩 저항 미삽"),
    defectType: "부품 미삽 (Missing Component)",
    severity: "CRITICAL",
    similarityCV: 68.5,
    similarityAI: 65.2,
    aiReason: "R1 위치(10kΩ 1608 SMT 저항)에 부품이 실장되지 않고 동박 패드만 노출됨.",
    feedbackNote: "SMT 피더 3번 노즐 흡착 에러 추정. 피더 장착 상태 및 노즐 공압 점검 조치 완료.",
    defects: [{ x: 120, y: 160, w: 30, h: 15, label: "부품 미삽 (Missing Component)" }],
    isLearned: true,
  },
  {
    id: "defect-seed-003",
    timestamp: Date.now() - 3600000 * 6,
    time: "2026-08-20 10:48:35",
    serial: "SN-2026-PCB-012",
    barcode: "AOI-PCB-M12",
    imageUrl: generateDefectSvg("부품 오삽/틀어짐 (Misaligned Part)", "C2 커패시터 30도 회전"),
    cropImageUrl: generateDefectSvg("부품 오삽/틀어짐 (Misaligned Part)", "C2 커패시터 30도 회전"),
    defectType: "부품 오삽/틀어짐 (Misaligned Part)",
    severity: "MAJOR",
    similarityCV: 82.1,
    similarityAI: 80.0,
    aiReason: "C2(10uF) 탄탈 커패시터가 정상 축 대비 시계방향으로 30도 비틀려 장착되어 한쪽 단자 오픈 위험.",
    feedbackNote: "리플로우 챔버 입구 진동으로 인한 부품 유동 발생. 레일 가이드 폭 재조정 완료.",
    defects: [{ x: 120, y: 280, w: 30, h: 25, label: "부품 오삽/틀어짐 (Misaligned Part)" }],
    isLearned: true,
  },
  {
    id: "defect-seed-004",
    timestamp: Date.now() - 3600000 * 5,
    time: "2026-08-20 11:20:04",
    serial: "SN-2026-PCB-015",
    barcode: "AOI-PCB-M15",
    imageUrl: generateDefectSvg("표면 스크래치 (Surface Scratch)", "MCU 하단 솔더마스크 긁힘"),
    cropImageUrl: generateDefectSvg("표면 스크래치 (Surface Scratch)", "MCU 하단 솔더마스크 긁힘"),
    defectType: "표면 스크래치 (Surface Scratch)",
    severity: "MINOR",
    similarityCV: 87.4,
    similarityAI: 86.0,
    aiReason: "MCU 하단 솔더레지스트 표면에 길이 12mm 가량의 선형 스크래치 발생. 동박 패턴 노출은 없음.",
    feedbackNote: "이송 지그 클램프 마찰흔으로 확인. 테프론 완충 테이프 부착으로 재발 방지 조치.",
    defects: [{ x: 220, y: 200, w: 200, h: 30, label: "표면 스크래치 (Surface Scratch)" }],
    isLearned: true,
  },
  {
    id: "defect-seed-005",
    timestamp: Date.now() - 3600000 * 4,
    time: "2026-08-20 13:05:49",
    serial: "SN-2026-PCB-018",
    barcode: "AOI-PCB-M18",
    imageUrl: generateDefectSvg("하우징 크랙 (Crack)", "우측 상단 마운팅 체결부 크랙"),
    cropImageUrl: generateDefectSvg("하우징 크랙 (Crack)", "우측 상단 마운팅 체결부 크랙"),
    defectType: "하우징 크랙 (Crack)",
    severity: "CRITICAL",
    similarityCV: 76.8,
    similarityAI: 73.5,
    aiReason: "우측 상단 서포트 홀 주변 기구물 외벽에 사출 응력으로 인한 4.5mm 관통 크랙 발생.",
    feedbackNote: "사출 금형 보압/냉각 시간 파라미터 불량. 성형 공정에 즉시 이상 통보.",
    defects: [{ x: 540, y: 50, w: 30, h: 70, label: "하우징 크랙 (Crack)" }],
    isLearned: true,
  },
  {
    id: "defect-seed-006",
    timestamp: Date.now() - 3600000 * 3,
    time: "2026-08-20 14:12:30",
    serial: "SN-2026-PCB-021",
    barcode: "AOI-PCB-M21",
    imageUrl: generateDefectSvg("이물질 오염 (Contamination)", "전원 레귤레이터 주변 플럭스 잔여물"),
    cropImageUrl: generateDefectSvg("이물질 오염 (Contamination)", "전원 레귤레이터 주변 플럭스 잔여물"),
    defectType: "이물질 오염 (Contamination)",
    severity: "MINOR",
    similarityCV: 89.2,
    similarityAI: 88.1,
    aiReason: "AMS1117 레귤레이터 IC 출력단 주변에 지름 3mm 갈색 점착성 플럭스 찌꺼기 잔류.",
    feedbackNote: "세척 공정 IPA 스프레이 노즐 막힘 청소 조치.",
    defects: [{ x: 470, y: 195, w: 40, h: 35, label: "이물질 오염 (Contamination)" }],
    isLearned: false,
  },
  {
    id: "defect-seed-007",
    timestamp: Date.now() - 3600000 * 2,
    time: "2026-08-20 15:30:18",
    serial: "SN-2026-PCB-024",
    barcode: "AOI-PCB-M24",
    imageUrl: generateDefectSvg("납 브릿지 (Solder Bridge)", "U1 Pin 22-23 솔더 볼 쇼트"),
    cropImageUrl: generateDefectSvg("납 브릿지 (Solder Bridge)", "U1 Pin 22-23 솔더 볼 쇼트"),
    defectType: "납 브릿지 (Solder Bridge)",
    severity: "CRITICAL",
    similarityCV: 72.0,
    similarityAI: 69.8,
    aiReason: "MCU 핀 간격 사이에 0.5mm 크기의 잔여 솔더 볼(Solder Ball) 흡착으로 미세 쇼트 발생.",
    feedbackNote: "솔더 페이스트 도포 스텐실 두께 0.12t 검사 및 세척 주기 단축 필요.",
    defects: [{ x: 280, y: 145, w: 40, h: 35, label: "납 브릿지 (Solder Bridge)" }],
    isLearned: false,
  },
  {
    id: "defect-seed-008",
    timestamp: Date.now() - 3600000 * 1.5,
    time: "2026-08-20 16:05:44",
    serial: "SN-2026-PCB-027",
    barcode: "AOI-PCB-M27",
    imageUrl: generateDefectSvg("부품 미삽 (Missing Component)", "C1 디커플링 커패시터 미삽"),
    cropImageUrl: generateDefectSvg("부품 미삽 (Missing Component)", "C1 디커플링 커패시터 미삽"),
    defectType: "부품 미삽 (Missing Component)",
    severity: "CRITICAL",
    similarityCV: 70.1,
    similarityAI: 67.4,
    aiReason: "C1(100nF) 세라믹 커패시터 부품 탈락으로 전원 라인 노이즈 필터링 불가.",
    feedbackNote: "릴 테이프 소진 시점 센서 미감지로 인한 공타 발생. 릴 교체 완료.",
    defects: [{ x: 120, y: 240, w: 30, h: 15, label: "부품 미삽 (Missing Component)" }],
    isLearned: false,
  },
  {
    id: "defect-seed-009",
    timestamp: Date.now() - 3600000 * 1,
    time: "2026-08-20 16:45:10",
    serial: "SN-2026-PCB-029",
    barcode: "AOI-PCB-M29",
    imageUrl: generateDefectSvg("납 브릿지 (Solder Bridge)", "MCU 하단 핀 브릿지"),
    cropImageUrl: generateDefectSvg("납 브릿지 (Solder Bridge)", "MCU 하단 핀 브릿지"),
    defectType: "납 브릿지 (Solder Bridge)",
    severity: "CRITICAL",
    similarityCV: 75.6,
    similarityAI: 72.3,
    aiReason: "MCU 하단 핀 31~32번 접합부 과다 솔더링으로 인한 브릿지 발생.",
    feedbackNote: "웨이브 솔더링 각도 보정 및 플럭스 분사량 재설정 완료.",
    defects: [{ x: 290, y: 310, w: 40, h: 25, label: "납 브릿지 (Solder Bridge)" }],
    isLearned: false,
  },
  {
    id: "defect-seed-010",
    timestamp: Date.now() - 1800000,
    time: "2026-08-20 17:15:02",
    serial: "SN-2026-PCB-030",
    barcode: "AOI-PCB-M30",
    imageUrl: generateDefectSvg("표면 스크래치 (Surface Scratch)", "PCB 실크스크린 훼손"),
    cropImageUrl: generateDefectSvg("표면 스크래치 (Surface Scratch)", "PCB 실크스크린 훼손"),
    defectType: "표면 스크래치 (Surface Scratch)",
    severity: "MINOR",
    similarityCV: 91.2,
    similarityAI: 89.0,
    aiReason: "로고 실크스크린 부위 경미한 스크래치(폭 0.05mm). 기능적 영향은 없음.",
    feedbackNote: "외관 품질 기준 판정 미달로 경미(Minor) 등급 등록.",
    defects: [{ x: 200, y: 70, w: 100, h: 20, label: "표면 스크래치 (Surface Scratch)" }],
    isLearned: false,
  },
];

/**
 * 파레토 및 E2E 테스트 검증용 20건 검사 이력 데이터셋 (OK 12건, NG 8건)
 */
export const SCENARIO_INSPECTION_HISTORY_SEED: InspectionHistory[] = [
  {
    id: "insp-001",
    time: "17:15:02",
    serial: "SN-2026-PCB-030",
    barcode: "AOI-PCB-M30",
    result: "NG",
    similarityCV: 91.2,
    similarityAI: 89.0,
    reason: "표면 스크래치 (Surface Scratch) 감지",
    defectLabels: ["표면 스크래치 (Surface Scratch)"],
  },
  {
    id: "insp-002",
    time: "17:14:20",
    serial: "SN-2026-PCB-029",
    barcode: "AOI-PCB-M29",
    result: "NG",
    similarityCV: 75.6,
    similarityAI: 72.3,
    reason: "납 브릿지 (Solder Bridge) 쇼트 감지",
    defectLabels: ["납 브릿지 (Solder Bridge)"],
  },
  {
    id: "insp-003",
    time: "17:10:45",
    serial: "SN-2026-PCB-028",
    barcode: "AOI-PCB-M28",
    result: "OK",
    similarityCV: 98.4,
    similarityAI: 97.9,
    reason: "전 부품 정상 실장 및 결함 없음",
  },
  {
    id: "insp-004",
    time: "16:45:10",
    serial: "SN-2026-PCB-027",
    barcode: "AOI-PCB-M27",
    result: "NG",
    similarityCV: 70.1,
    similarityAI: 67.4,
    reason: "부품 미삽 (Missing Component) 감지 (C1)",
    defectLabels: ["부품 미삽 (Missing Component)"],
  },
  {
    id: "insp-005",
    time: "16:40:02",
    serial: "SN-2026-PCB-026",
    barcode: "AOI-PCB-M26",
    result: "OK",
    similarityCV: 99.1,
    similarityAI: 98.5,
    reason: "모든 솔더링 및 실크스크린 정상",
  },
  {
    id: "insp-006",
    time: "16:32:19",
    serial: "SN-2026-PCB-025",
    barcode: "AOI-PCB-M25",
    result: "OK",
    similarityCV: 97.8,
    similarityAI: 96.9,
    reason: "정상 검사 완료",
  },
  {
    id: "insp-007",
    time: "15:30:18",
    serial: "SN-2026-PCB-024",
    barcode: "AOI-PCB-M24",
    result: "NG",
    similarityCV: 72.0,
    similarityAI: 69.8,
    reason: "납 브릿지 (Solder Bridge) 감지 (Pin 22-23)",
    defectLabels: ["납 브릿지 (Solder Bridge)"],
  },
  {
    id: "insp-008",
    time: "15:22:50",
    serial: "SN-2026-PCB-023",
    barcode: "AOI-PCB-M23",
    result: "OK",
    similarityCV: 98.9,
    similarityAI: 98.1,
    reason: "정상 판정",
  },
  {
    id: "insp-009",
    time: "15:10:04",
    serial: "SN-2026-PCB-022",
    barcode: "AOI-PCB-M22",
    result: "OK",
    similarityCV: 96.7,
    similarityAI: 95.8,
    reason: "정상 판정",
  },
  {
    id: "insp-010",
    time: "14:12:30",
    serial: "SN-2026-PCB-021",
    barcode: "AOI-PCB-M21",
    result: "NG",
    similarityCV: 89.2,
    similarityAI: 88.1,
    reason: "이물질 오염 (Contamination) 감지",
    defectLabels: ["이물질 오염 (Contamination)"],
  },
  {
    id: "insp-011",
    time: "14:02:15",
    serial: "SN-2026-PCB-020",
    barcode: "AOI-PCB-M20",
    result: "OK",
    similarityCV: 98.2,
    similarityAI: 97.4,
    reason: "정상 판정",
  },
  {
    id: "insp-012",
    time: "13:45:00",
    serial: "SN-2026-PCB-019",
    barcode: "AOI-PCB-M19",
    result: "OK",
    similarityCV: 99.4,
    similarityAI: 99.0,
    reason: "정상 판정",
  },
  {
    id: "insp-013",
    time: "13:05:49",
    serial: "SN-2026-PCB-018",
    barcode: "AOI-PCB-M18",
    result: "NG",
    similarityCV: 76.8,
    similarityAI: 73.5,
    reason: "하우징 크랙 (Crack) 감지",
    defectLabels: ["하우징 크랙 (Crack)"],
  },
  {
    id: "insp-014",
    time: "12:50:33",
    serial: "SN-2026-PCB-017",
    barcode: "AOI-PCB-M17",
    result: "OK",
    similarityCV: 97.9,
    similarityAI: 97.1,
    reason: "정상 판정",
  },
  {
    id: "insp-015",
    time: "12:10:14",
    serial: "SN-2026-PCB-016",
    barcode: "AOI-PCB-M16",
    result: "OK",
    similarityCV: 98.5,
    similarityAI: 98.0,
    reason: "정상 판정",
  },
  {
    id: "insp-016",
    time: "11:20:04",
    serial: "SN-2026-PCB-015",
    barcode: "AOI-PCB-M15",
    result: "NG",
    similarityCV: 87.4,
    similarityAI: 86.0,
    reason: "표면 스크래치 (Surface Scratch) 감지",
    defectLabels: ["표면 스크래치 (Surface Scratch)"],
  },
  {
    id: "insp-017",
    time: "10:48:35",
    serial: "SN-2026-PCB-012",
    barcode: "AOI-PCB-M12",
    result: "NG",
    similarityCV: 82.1,
    similarityAI: 80.0,
    reason: "부품 오삽/틀어짐 (Misaligned Part) 감지",
    defectLabels: ["부품 오삽/틀어짐 (Misaligned Part)"],
  },
  {
    id: "insp-018",
    time: "10:15:20",
    serial: "SN-2026-PCB-009",
    barcode: "AOI-PCB-M09",
    result: "OK",
    similarityCV: 99.0,
    similarityAI: 98.7,
    reason: "정상 판정",
  },
  {
    id: "insp-019",
    time: "10:02:11",
    serial: "SN-2026-PCB-007",
    barcode: "AOI-PCB-M07",
    result: "NG",
    similarityCV: 68.5,
    similarityAI: 65.2,
    reason: "부품 미삽 (Missing Component) 감지 (R1)",
    defectLabels: ["부품 미삽 (Missing Component)"],
  },
  {
    id: "insp-020",
    time: "09:15:22",
    serial: "SN-2026-PCB-004",
    barcode: "AOI-PCB-M04",
    result: "NG",
    similarityCV: 74.2,
    similarityAI: 71.0,
    reason: "납 브릿지 (Solder Bridge) 감지 (U1)",
    defectLabels: ["납 브릿지 (Solder Bridge)"],
  },
];
