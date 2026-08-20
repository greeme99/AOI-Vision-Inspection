import React from "react";
import { Sliders, Zap, ShieldCheck, Sparkles, Gauge } from "lucide-react";
import { ThemeStyles } from "../types";

interface CenterPanelProps {
  theme: "dark" | "light";
  t: ThemeStyles;
  drawingMode: "none" | "rect" | "auto";
  setDrawingMode: (v: "none" | "rect" | "auto") => void;
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  outputCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  diffCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleRoiMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleRoiMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleRoiMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  binaryThreshold: number;
  setBinaryThreshold: (v: number) => void;
  passThreshold: number;
  setPassThreshold: (v: number) => void;
  currentPreset: "precision" | "standard" | "speed" | "custom";
  applyPreset: (preset: "precision" | "standard" | "speed") => void;
  deepLearningEnabled: boolean;
  vlmEnabled: boolean;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
  theme,
  t,
  drawingMode,
  setDrawingMode,
  showGrid,
  setShowGrid,
  videoRef,
  outputCanvasRef,
  diffCanvasRef,
  handleRoiMouseDown,
  handleRoiMouseMove,
  handleRoiMouseUp,
  binaryThreshold,
  setBinaryThreshold,
  passThreshold,
  setPassThreshold,
  currentPreset,
  applyPreset,
  deepLearningEnabled,
  vlmEnabled,
}) => {
  return (
    <div className={`flex-1 p-5 flex flex-col justify-between overflow-hidden transition-all ${t.screenBg}`}>
      <div className={`flex items-center justify-between shrink-0 mb-3 rounded-xl px-4 py-2 text-xs transition-all ${t.cardBg}`}>
        <div className="flex items-center gap-3">
          <span className={`font-semibold ${t.textTitle}`}>인터랙션 ROI 조율 및 측정 격자선:</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setDrawingMode(drawingMode === "rect" ? "none" : "rect")}
              className={`px-3 py-1 rounded text-[11px] font-medium border transition-all cursor-pointer ${
                drawingMode === "rect" ? "bg-blue-600 border-blue-500 text-white shadow-sm" : t.btnGray
              }`}
            >
              사각형 그리기
            </button>
            <button 
              onClick={() => setDrawingMode(drawingMode === "auto" ? "none" : "auto")}
              className={`px-3 py-1 rounded text-[11px] font-medium border transition-all cursor-pointer ${
                drawingMode === "auto" ? "bg-purple-600 border-purple-500 text-white shadow-sm" : t.btnGray
              }`}
            >
              자석 윤곽선 그리기
            </button>
          </div>
        </div>

        <label className={`flex items-center gap-1.5 cursor-pointer select-none ${t.subtext}`}>
          <input 
            type="checkbox" 
            checked={showGrid} 
            onChange={(e) => setShowGrid(e.target.checked)} 
            className="rounded bg-[#141421] border-[#212133] text-blue-500 focus:ring-0" 
          />
          격자선 오버레이
        </label>
      </div>

      {/* 비디오 뷰포트 정렬 */}
      <div className={`flex-1 flex items-center justify-center relative rounded-2xl border overflow-hidden group transition-all ${
        theme === 'light' ? 'bg-[#e2e8f0] border-slate-300' : 'bg-[#020204] border-[#1b1b2a]'
      }`}>
        <video ref={videoRef} className="hidden" />
        <canvas 
          ref={outputCanvasRef} 
          onMouseDown={handleRoiMouseDown}
          onMouseMove={handleRoiMouseMove}
          onMouseUp={handleRoiMouseUp}
          className="max-h-full max-w-full object-contain cursor-crosshair scale-x-1" 
        />
        
        {/* 드로잉 활성화 안내 배너 */}
        {drawingMode !== "none" && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg animate-bounce">
            💡 영상 영역 위를 드래그하여 검사 영역(ROI)을 지정해 주십시오.
          </div>
        )}
      </div>

      {/* 중앙 하단 세부 전처리 및 감도 프리셋 튜닝 패널 */}
      <div className={`mt-4 shrink-0 border rounded-2xl p-3.5 space-y-3 transition-all ${t.cardBg}`} style={{ borderColor: theme === "light" ? "#cbd5e1" : "#212130" }}>
        
        {/* 1. 검사 감도 튜닝 프리셋 헤더 및 버튼 그룹 */}
        <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: theme === "light" ? "#e2e8f0" : "#202032" }}>
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-400" />
            <span className={`text-xs font-bold ${t.accentLabel}`}>검사 감도 튜닝 프리셋</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              currentPreset === "precision" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
              currentPreset === "standard" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
              currentPreset === "speed" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
              "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}>
              {currentPreset === "precision" ? "🎯 정밀 검사 모드" :
               currentPreset === "standard" ? "⚖️ 일반 표준 모드" :
               currentPreset === "speed" ? "⚡ 고속 실시간 모드" : "🔧 사용자 정의"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 정밀 모드 버튼 */}
            <button
              onClick={() => applyPreset("precision")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentPreset === "precision"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/25 border border-purple-400"
                  : theme === "light"
                  ? "bg-slate-100 hover:bg-purple-50 text-slate-700 border border-slate-200"
                  : "bg-[#141424] hover:bg-purple-950/40 text-slate-300 border border-[#24243a]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              정밀 검사
            </button>

            {/* 일반 모드 버튼 */}
            <button
              onClick={() => applyPreset("standard")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentPreset === "standard"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400"
                  : theme === "light"
                  ? "bg-slate-100 hover:bg-blue-50 text-slate-700 border border-slate-200"
                  : "bg-[#141424] hover:bg-blue-950/40 text-slate-300 border border-[#24243a]"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              일반 검사
            </button>

            {/* 고속 모드 버튼 */}
            <button
              onClick={() => applyPreset("speed")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentPreset === "speed"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25 border border-emerald-400"
                  : theme === "light"
                  ? "bg-slate-100 hover:bg-emerald-50 text-slate-700 border border-slate-200"
                  : "bg-[#141424] hover:bg-emerald-950/40 text-slate-300 border border-[#24243a]"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              고속 검사
            </button>
          </div>
        </div>

        {/* 2. 전처리 캔버스 및 미세 파라미터 제어 */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-0.5 pr-3 border-r shrink-0" style={{ borderColor: theme === "light" ? "#cbd5e1" : "#212135" }}>
            <span className={`text-[11px] font-bold ${t.accentLabel}`}>AbsDiff 픽셀 디팩트</span>
            <span className={`text-[9px] ${t.subtext}`}>실시간 이진화 마스크</span>
          </div>
          
          <div className={`w-[90px] h-[55px] rounded-lg border overflow-hidden shrink-0 flex items-center justify-center transition-all ${
            theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-[#020205] border-[#212133]'
          }`}>
            <canvas ref={diffCanvasRef} className="w-full h-full object-contain scale-x-1" />
          </div>

          <div className={`flex-1 flex gap-5 text-xs ${t.subtext}`}>
            {/* 이진화 임계값 슬라이더 */}
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[11px]">이진화 가공 조도조절 (AbsDiff Threshold)</span>
                <span className="font-mono font-bold text-blue-400">{binaryThreshold}</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="180" 
                value={binaryThreshold} 
                onChange={(e) => setBinaryThreshold(Number(e.target.value))}
                className="w-full accent-blue-500 bg-[#1e1e2d] h-1.5 rounded cursor-pointer" 
              />
              <div className="flex justify-between text-[9px] text-[#717182] font-mono">
                <span>민감(35)</span>
                <span>표준(50)</span>
                <span>둔감(65)</span>
              </div>
            </div>

            {/* 유사도 합격 역치 */}
            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-right font-semibold text-[11px]">매치 패스 컷오프</span>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold transition-all ${t.inputBg}`}>
                <input 
                  type="number" 
                  min="50" 
                  max="100" 
                  value={passThreshold} 
                  onChange={(e) => setPassThreshold(Number(e.target.value))}
                  className="w-8 bg-transparent text-center focus:outline-none text-xs" 
                />
                <span className="text-xs text-blue-400">%</span>
              </div>
              <span className="text-[9px] text-[#717182] text-right font-mono">
                {passThreshold >= 97 ? "엄격" : passThreshold >= 95 ? "표준" : "여유"}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

