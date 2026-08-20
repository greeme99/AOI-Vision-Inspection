import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Activity } from "lucide-react";
import { InspectionHistory, ThemeStyles } from "../types";

interface SimilarityTrendChartProps {
  historyList: InspectionHistory[];
  passThreshold: number;
  theme: "dark" | "light";
  t: ThemeStyles;
}

export const SimilarityTrendChart: React.FC<SimilarityTrendChartProps> = ({
  historyList,
  passThreshold,
  theme,
  t,
}) => {
  // 최근 최대 10회 검사 히스토리 추출 (시간순: 오래된 것 -> 최신)
  const recentItems = historyList.slice(-10);

  const chartData = recentItems.map((item, idx) => ({
    name: `#${idx + 1}`,
    serial: item.serial,
    similarity: Number(item.similarityCV) || 0,
    result: item.result,
    time: item.time,
    barcode: item.barcode,
  }));

  // 통계 계산
  const avgSimilarity =
    chartData.length > 0
      ? Math.round(
          chartData.reduce((acc, curr) => acc + curr.similarity, 0) /
            chartData.length
        )
      : 0;

  const minSim =
    chartData.length > 0
      ? Math.min(...chartData.map((d) => d.similarity))
      : 0;
  const maxSim =
    chartData.length > 0
      ? Math.max(...chartData.map((d) => d.similarity))
      : 0;

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPass = data.similarity >= passThreshold;
      return (
        <div
          className={`p-2.5 rounded-xl border shadow-xl text-xs font-mono backdrop-blur-md ${
            theme === "light"
              ? "bg-white/95 border-slate-200 text-slate-800"
              : "bg-[#11111a]/95 border-[#28283c] text-slate-100"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-1 font-bold">
            <span className="text-blue-400">{data.serial}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                data.result === "OK" || isPass
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {data.result || (isPass ? "OK" : "NG")}
            </span>
          </div>
          <div className="flex justify-between gap-4 text-[11px]">
            <span className="text-[#888899]">유사도:</span>
            <span
              className={`font-bold ${
                isPass ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {data.similarity}%
            </span>
          </div>
          <div className="flex justify-between gap-4 text-[10px] text-[#888899]">
            <span>시간:</span>
            <span>{data.time}</span>
          </div>
          {data.barcode && (
            <div className="text-[10px] text-[#888899] truncate max-w-[140px] mt-0.5">
              {data.barcode}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // 점 커스텀 렌더링 (합격/불합격 색상 분기)
  const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isPass = payload.similarity >= passThreshold;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        stroke={isPass ? "#10b981" : "#ef4444"}
        strokeWidth={2}
        fill={theme === "light" ? "#ffffff" : "#11111a"}
      />
    );
  };

  return (
    <div
      className={`p-3.5 rounded-2xl border relative space-y-2.5 transition-all ${t.cardBg}`}
      style={{
        borderColor: theme === "light" ? "#cbd5e1" : "#212130",
      }}
    >
      {/* 헤더 및 요약 배지 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          <h4 className={`text-xs font-bold tracking-wider ${t.accentLabel}`}>
            최근 10회 유사도 추이 (Line Chart)
          </h4>
        </div>
        {chartData.length > 0 && (
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-[#888899]">평균:</span>
            <span
              className={`font-bold ${
                avgSimilarity >= passThreshold
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {avgSimilarity}%
            </span>
            <span className="text-[#888899] border-l pl-2 border-slate-500/20">
              범위: {minSim}%~{maxSim}%
            </span>
          </div>
        )}
      </div>

      {/* 라인 차트 렌더링 영역 */}
      <div className="w-full h-36">
        {chartData.length === 0 ? (
          <div
            className={`h-full flex flex-col items-center justify-center text-center p-3 text-[11px] rounded-xl border border-dashed ${
              theme === "light"
                ? "bg-slate-50/70 border-slate-200 text-slate-400"
                : "bg-[#11111a]/50 border-[#222233] text-[#6b6b7b]"
            }`}
          >
            <Activity className="w-5 h-5 text-blue-400/50 mb-1 animate-pulse" />
            검사 데이터 대기중...
            <span className="text-[9px] mt-0.5 text-[#888899]">
              검사가 실행되면 최근 10회의 유사도 변화 곡선이 실시간으로 그려집니다.
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 10, left: -24, bottom: 0 }}
            >
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === "light" ? "#e2e8f0" : "#1f1f2e"}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 10,
                  fill: theme === "light" ? "#64748b" : "#717180",
                  fontFamily: "monospace",
                }}
                axisLine={{ stroke: theme === "light" ? "#cbd5e1" : "#28283a" }}
                tickLine={false}
              />
              <YAxis
                domain={[40, 100]}
                ticks={[50, 70, 90, 100]}
                tick={{
                  fontSize: 9,
                  fill: theme === "light" ? "#64748b" : "#717180",
                  fontFamily: "monospace",
                }}
                axisLine={{ stroke: theme === "light" ? "#cbd5e1" : "#28283a" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* 합격 기준 임계값 참조선 */}
              <ReferenceLine
                y={passThreshold}
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `기준(${passThreshold}%)`,
                  position: "insideTopLeft",
                  fill: "#10b981",
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
              />
              <Line
                type="monotone"
                dataKey="similarity"
                stroke="url(#lineGrad)"
                strokeWidth={2.5}
                dot={<CustomizedDot />}
                activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
                isAnimationActive={true}
                animationDuration={400}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 범례 및 안내 가이드 */}
      <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-[#888899] border-t border-dashed border-slate-500/15">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> 합격 (≥{passThreshold}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> 불합격 (&lt;{passThreshold}%)
          </span>
        </div>
        <span>최신 {chartData.length}/10회</span>
      </div>
    </div>
  );
};
