import React, { useMemo } from "react";
import { motion } from "motion/react";
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  X, 
  Layers, 
  Zap, 
  FileSpreadsheet,
  HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from "recharts";
import { DefectRecord, InspectionHistory, ThemeStyles } from "../types";

interface DefectParetoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defectList: DefectRecord[];
  historyList: InspectionHistory[];
  theme: "dark" | "light";
  t: ThemeStyles;
}

interface ParetoDataPoint {
  category: string;
  count: number;
  percentage: number;
  cumulativePercentage: number;
  cumulativeCount: number;
  isVitalFew: boolean; // 80% 이내 주요 결함
}

const BAR_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#eab308", // yellow-500
  "#8b5cf6", // purple-500
  "#3b82f6", // blue-500
  "#06b6d4", // cyan-500
  "#64748b", // slate-500
];

export const DefectParetoModal: React.FC<DefectParetoModalProps> = ({
  isOpen,
  onClose,
  defectList,
  historyList,
  theme,
  t,
}) => {
  // 파레토 데이터 집계 및 계산
  const paretoData: ParetoDataPoint[] = useMemo(() => {
    const counts: Record<string, number> = {};

    // 1. defectList에서 추출
    defectList.forEach((d) => {
      const type = d.defectType || "기타 결함";
      counts[type] = (counts[type] || 0) + 1;
    });

    // 2. defectList가 적을 경우 historyList의 NG 레코드도 보완 추출
    historyList.forEach((h) => {
      if (h.result === "NG") {
        if (h.defectLabels && h.defectLabels.length > 0) {
          h.defectLabels.forEach((lbl) => {
            if (!defectList.some((d) => d.id === h.id)) {
              counts[lbl] = (counts[lbl] || 0) + 1;
            }
          });
        } else if (h.reason && !defectList.some((d) => d.id === h.id)) {
          let cat = "기타 결함";
          if (h.reason.includes("스크래치") || h.reason.includes("흠집")) cat = "표면 스크래치";
          else if (h.reason.includes("나사") || h.reason.includes("체결")) cat = "나사/체결 누락";
          else if (h.reason.includes("틈새") || h.reason.includes("유격")) cat = "틈새/유격 뒤틀림";
          else if (h.reason.includes("크랙") || h.reason.includes("파손")) cat = "외관 크랙/파손";
          else if (h.reason.includes("이물") || h.reason.includes("오염")) cat = "이물/오염 부착";
          counts[cat] = (counts[cat] || 0) + 1;
        }
      }
    });

    // 기본 예시 데이터 보완 (데이터가 없을 때 시각적 구조 제공용)
    if (Object.keys(counts).length === 0) {
      counts["표면 스크래치"] = 12;
      counts["나사/체결 누락"] = 7;
      counts["틈새/유격 뒤틀림"] = 4;
      counts["사출 버/미성형"] = 2;
      counts["이물/오염 부착"] = 1;
    }

    const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0);

    // 내림차순 정렬
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    let runningSum = 0;
    return sorted.map(([category, count]) => {
      runningSum += count;
      const cumulativePercentage = Math.round((runningSum / totalCount) * 1000) / 10;
      const percentage = Math.round((count / totalCount) * 1000) / 10;
      return {
        category,
        count,
        percentage,
        cumulativePercentage,
        cumulativeCount: runningSum,
        isVitalFew: cumulativePercentage <= 82, // 80% 컷오프
      };
    });
  }, [defectList, historyList]);

  if (!isOpen) return null;

  const totalDefectCount = paretoData.reduce((acc, cur) => acc + cur.count, 0);
  const vitalFewCategories = paretoData.filter((d) => d.isVitalFew).map((d) => d.category);

  const exportParetoCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "순위,결함 유형,발생 건수,점유율(%),누적 점유율(%),80/20 중점관리여부\n";
    paretoData.forEach((d, idx) => {
      csvContent += `${idx + 1},"${d.category}",${d.count},${d.percentage}%,${d.cumulativePercentage}%,${d.isVitalFew ? "핵심 관리(Vital Few)" : "일반"}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AOI_Defect_Pareto_Analysis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-5xl h-[88vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all ${
          theme === "light"
            ? "bg-white border-slate-300 text-slate-900"
            : "bg-[#0e0e18] border-[#24243a] text-slate-100"
        }`}
      >
        {/* 상단 헤더 */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#141424] border-[#222236]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 text-white shadow-md shadow-red-600/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                결함 유형별 파레토(Pareto) 80/20 분석 대시보드
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono font-bold border border-red-500/30">
                  총 {totalDefectCount}건 분석
                </span>
              </h2>
              <p className="text-xs text-[#8e8e9f]">
                발생 빈도가 높은 핵심 결함 상위 20%를 식별하여 공정 불량의 80%를 사전에 집중 개선합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportParetoCsv}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer hover:bg-slate-500/10"
              style={{ borderColor: theme === "light" ? "#cbd5e1" : "#2e2e46" }}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              CSV 내보내기
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-500/20 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 80/20 핵심 불량 진단 카드 배너 */}
        <div
          className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            theme === "light"
              ? "bg-gradient-to-r from-red-50 to-amber-50 border-red-100"
              : "bg-gradient-to-r from-red-950/25 via-[#141424] to-amber-950/20 border-red-500/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-red-400 flex items-center gap-1">
                🎯 중점 개선 관리 대상 (Vital Few Defects):
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1 font-bold">
                {vitalFewCategories.map((cat, i) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[11px]"
                  >
                    #{i + 1} {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-right font-mono">
            <div className="text-[#8e8e9f]">상위 결함 점유율</div>
            <div className="text-base font-bold text-red-400">
              {paretoData[0] ? `${paretoData[0].cumulativePercentage}%` : "0%"} 누적
            </div>
          </div>
        </div>

        {/* 본문: 파레토 차트 & 통계 테이블 */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* 1. 파레토 복합 차트 (Bar + 누적 Line) */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              theme === "light" ? "bg-slate-50/70 border-slate-200" : "bg-[#111120] border-[#222238]"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold">불량 빈도수(Bar) 및 누적 점유율 곡선(Line)</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> 발생 건수 (EA)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-amber-400 inline-block" /> 누적 비율 (%)
                </span>
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="w-3 h-0.5 bg-red-500 border border-dashed border-red-400 inline-block" /> 80% 기준선
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={paretoData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === "light" ? "#e2e8f0" : "#1e1e32"}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: theme === "light" ? "#64748b" : "#8e8e9f", fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  {/* 왼쪽 Y축: 발생 건수 */}
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tick={{ fill: theme === "light" ? "#64748b" : "#8e8e9f", fontSize: 11, fontFamily: "monospace" }}
                    domain={[0, "auto"]}
                    allowDecimals={false}
                  />
                  {/* 오른쪽 Y축: 누적 백분율 */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#f59e0b", fontSize: 11, fontFamily: "monospace" }}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === "light" ? "#ffffff" : "#141424",
                      borderColor: theme === "light" ? "#cbd5e1" : "#2e2e46",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontFamily: "monospace",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                    }}
                    formatter={(val: any, name: string) => {
                      if (name === "누적 점유율") return [`${val}%`, name];
                      return [`${val}건`, name];
                    }}
                  />
                  {/* 80% 파레토 기준선 */}
                  <ReferenceLine
                    yAxisId="right"
                    y={80}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{
                      value: "80% 파레토 컷오프",
                      position: "insideTopRight",
                      fill: "#ef4444",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  />
                  {/* 막대 차트 (발생 빈도) */}
                  <Bar
                    yAxisId="left"
                    dataKey="count"
                    name="발생 건수"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  >
                    {paretoData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                  {/* 꺾은선 차트 (누적 점유율) */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulativePercentage"
                    name="누적 점유율"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#f59e0b" }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. 파레토 통계 상세 테이블 */}
          <div
            className={`rounded-2xl border overflow-hidden transition-all ${
              theme === "light" ? "bg-white border-slate-200" : "bg-[#111120] border-[#222238]"
            }`}
          >
            <div
              className={`px-4 py-3 border-b flex justify-between items-center ${
                theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#141424] border-[#1e1e32]"
              }`}
            >
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                불량 유형별 발생 통계 및 누적 비중표
              </span>
              <span className="text-[11px] text-[#8e8e9f] font-mono">총 {paretoData.length}개 유형</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead
                  className={`border-b text-[11px] ${
                    theme === "light" ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-[#161628] text-slate-400 border-[#222238]"
                  }`}
                >
                  <tr>
                    <th className="py-2.5 px-4">순위</th>
                    <th className="py-2.5 px-4 font-sans">결함 유형 카테고리</th>
                    <th className="py-2.5 px-4 text-right">발생 건수</th>
                    <th className="py-2.5 px-4 text-right">점유율 (%)</th>
                    <th className="py-2.5 px-4 text-right">누적 점유율 (%)</th>
                    <th className="py-2.5 px-4 text-center font-sans">80/20 중점 관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: theme === "light" ? "#f1f5f9" : "#1a1a2c" }}>
                  {paretoData.map((row, idx) => (
                    <tr
                      key={row.category}
                      className={`hover:bg-opacity-50 transition ${
                        row.isVitalFew
                          ? theme === "light"
                            ? "bg-red-50/30"
                            : "bg-red-950/10"
                          : ""
                      }`}
                    >
                      <td className="py-2.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-2.5 px-4 font-sans font-bold flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}
                        />
                        {row.category}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold">{row.count} EA</td>
                      <td className="py-2.5 px-4 text-right text-blue-400 font-bold">{row.percentage}%</td>
                      <td className="py-2.5 px-4 text-right text-amber-400 font-bold">{row.cumulativePercentage}%</td>
                      <td className="py-2.5 px-4 text-center">
                        {row.isVitalFew ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            🎯 중점 관리 (Vital)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            일반 관리
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
