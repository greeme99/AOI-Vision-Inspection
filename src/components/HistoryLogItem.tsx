import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, Sparkles, Tag, Clock, Barcode } from "lucide-react";
import { InspectionHistory, ThemeStyles } from "../types";

interface HistoryLogItemProps {
  item: InspectionHistory;
  theme: "dark" | "light";
  t: ThemeStyles;
}

export const HistoryLogItem: React.FC<HistoryLogItemProps> = ({ item, theme, t }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isOK = item.result === "OK";

  // 결함 레이블 추출
  const defectLabels: string[] = [];
  if (item.defectLabels && item.defectLabels.length > 0) {
    defectLabels.push(...item.defectLabels);
  } else if (item.defects && item.defects.length > 0) {
    item.defects.forEach((d) => {
      if (d.label && !defectLabels.includes(d.label)) {
        defectLabels.push(d.label);
      }
    });
  }

  // reason 분석에서 결함 키워드 보완
  if (defectLabels.length === 0 && !isOK) {
    if (item.reason) {
      if (item.reason.includes("스크래치") || item.reason.includes("흠집")) defectLabels.push("표면 스크래치");
      if (item.reason.includes("나사") || item.reason.includes("체결")) defectLabels.push("나사/체결 불량");
      if (item.reason.includes("틈새") || item.reason.includes("유격")) defectLabels.push("틈새/유격 뒤틀림");
      if (item.reason.includes("크랙") || item.reason.includes("파손")) defectLabels.push("외관 크랙/파손");
      if (defectLabels.length === 0) defectLabels.push("CV 형상/치수 불일치");
    } else {
      defectLabels.push("CV 유사도 기준 미달");
    }
  }

  return (
    <div
      className={`p-2.5 flex items-start gap-2 relative transition-all rounded-xl cursor-pointer ${
        isHovered
          ? theme === "light"
            ? "bg-blue-50/80 shadow-sm"
            : "bg-[#181828]/90 shadow-sm"
          : "hover:bg-opacity-40"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderBottomWidth: "1px",
        borderBottomColor: theme === "light" ? "#f1f5f9" : "#1e1e2d",
      }}
    >
      {/* 1. 결과별(OK/NG) 색상 구분 태그 */}
      <div className="shrink-0 pt-0.5">
        {isOK ? (
          <span
            className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all ${
              theme === "light"
                ? "bg-emerald-100/90 text-emerald-800 border border-emerald-300"
                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            OK
          </span>
        ) : (
          <span
            className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all ${
              theme === "light"
                ? "bg-red-100/90 text-red-800 border border-red-300"
                : "bg-red-500/15 text-red-400 border border-red-500/30"
            }`}
          >
            <XCircle className="w-3 h-3 text-red-500" />
            NG
          </span>
        )}
      </div>

      {/* 2. 아이템 본문 정보 */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold">
            <span className={`font-mono ${t.textTitle}`}>{item.serial}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                isOK
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {item.similarityCV}%
            </span>
          </div>
          <span className="text-[10px] text-[#64748b] font-mono flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {item.time}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className={`truncate flex items-center gap-1 ${t.subtext}`}>
            <Barcode className="w-3 h-3 opacity-60" />
            {item.barcode}
          </span>
          {!isOK && defectLabels.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 truncate max-w-[110px]">
              {defectLabels[0]}
            </span>
          )}
        </div>

        {item.reason && (
          <p className="text-[10px] text-purple-400 bg-purple-950/15 px-2 py-1 rounded font-sans line-clamp-1 leading-normal">
            {item.reason}
          </p>
        )}
      </div>

      {/* 3. 마우스 호버 시 상세 결함 레이블 플로팅 툴팁 (Floating Tooltip) */}
      {isHovered && (
        <div
          className={`absolute left-[-16px] bottom-[105%] w-[320px] p-3.5 rounded-2xl border shadow-2xl z-50 pointer-events-none animate-fadeIn backdrop-blur-xl ${
            theme === "light"
              ? "bg-white/95 border-slate-300 text-slate-800 shadow-slate-400/30"
              : "bg-[#10101c]/95 border-[#2f2f48] text-slate-100 shadow-black/80"
          }`}
        >
          {/* 툴팁 헤더 */}
          <div className="flex items-center justify-between border-b pb-2 mb-2" style={{ borderColor: theme === "light" ? "#e2e8f0" : "#242438" }}>
            <div className="flex items-center gap-1.5">
              {isOK ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 정상 양품 판정 (PASS)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> 결함 불합격 판정 (FAIL)
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-[#8e8e9f]">{item.time}</span>
          </div>

          {/* 메타 스펙 */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-2.5">
            <div className={`p-1.5 rounded-lg border ${theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#161626] border-[#252538]"}`}>
              <div className="text-[9px] text-[#8e8e9f]">시리얼 / 모델</div>
              <div className="font-bold truncate mt-0.5">{item.serial}</div>
              <div className="text-[10px] text-[#8e8e9f] truncate">{item.barcode}</div>
            </div>

            <div className={`p-1.5 rounded-lg border ${theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#161626] border-[#252538]"}`}>
              <div className="text-[9px] text-[#8e8e9f]">CV 픽셀 유사도</div>
              <div className={`text-sm font-bold mt-0.5 ${isOK ? "text-emerald-400" : "text-red-400"}`}>
                {item.similarityCV}%
              </div>
              {item.similarityAI !== undefined && (
                <div className="text-[9px] text-purple-400 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> AI 신뢰도 {item.similarityAI}%
                </div>
              )}
            </div>
          </div>

          {/* 상세 결함 레이블 리스트 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <Tag className="w-3 h-3 text-blue-400" />
              <span>상세 결함 진단 레이블</span>
            </div>

            {isOK ? (
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>모든 조립 포인트 및 표면 형상이 양품 기준치(Threshold)를 만족합니다.</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex flex-wrap gap-1">
                  {defectLabels.map((lbl, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1"
                    >
                      <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                      {lbl}
                    </span>
                  ))}
                </div>

                {item.reason && (
                  <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/20 text-purple-300 text-[10px] font-sans leading-relaxed">
                    <span className="font-bold text-purple-400 block mb-0.5">VLM 진단 사유:</span>
                    {item.reason}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 툴팁 하단 화살표 꼬리 */}
          <div
            className={`absolute left-8 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 ${
              theme === "light" ? "border-t-white" : "border-t-[#10101c]"
            }`}
          />
        </div>
      )}
    </div>
  );
};
