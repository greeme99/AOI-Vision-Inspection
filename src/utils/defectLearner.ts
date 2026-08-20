import { DefectRecord } from "../types";

/**
 * 누적된 불량 DB 기록들을 분석하여 Gemini VLM을 위한 In-Context Few-Shot 학습 가이드라인 프롬프트를 생성합니다.
 */
export function buildEnhancedVlmPrompt(
  basePrompt: string,
  defectList: DefectRecord[]
): { prompt: string; learnedCount: number } {
  if (!defectList || defectList.length === 0) {
    return { prompt: basePrompt, learnedCount: 0 };
  }

  // 유형별로 불량 패턴 집계
  const typeCounts: Record<string, number> = {};
  const recentDefectNotes: string[] = [];

  defectList.forEach((d) => {
    typeCounts[d.defectType] = (typeCounts[d.defectType] || 0) + 1;
    if (d.feedbackNote || d.aiReason) {
      const note = d.feedbackNote ? `[${d.defectType}] ${d.feedbackNote}` : `[${d.defectType}] ${d.aiReason}`;
      if (!recentDefectNotes.includes(note)) {
        recentDefectNotes.push(note);
      }
    }
  });

  // 상위 빈출 불량 유형 요약
  const topPatterns = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => `${type}(${count}건)`)
    .join(", ");

  // 최근 실제 불량 교정 사례 (최대 4개)
  const fewShotExamples = recentDefectNotes
    .slice(-4)
    .map((note, idx) => `  - 사례${idx + 1}: ${note}`)
    .join("\n");

  const feedbackLearningSection = `

[⚡ 현장 불량유형 DB 피드백 학습 규칙 (Active Learned Knowledge)]
- 본 검사 라인의 주요 빈출 불량 유형: ${topPatterns}
- 실제 발생된 과거 결함 및 작업자 보정 학습 사례:
${fewShotExamples}
위 학습된 현장 결함 사례를 우선적으로 대조하여 유사한 불량 발생 시 정확한 결함 유형과 위치를 지목해 주십시오.`;

  return {
    prompt: basePrompt.split("[⚡ 현장 불량유형 DB")[0].trim() + feedbackLearningSection,
    learnedCount: defectList.length,
  };
}

/**
 * 불량 DB 전체를 JSON 파일로 백업 다운로드
 */
export function exportDefectDbJson(defectList: DefectRecord[]) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(defectList, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `AOI_Defect_Knowledge_DB_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
