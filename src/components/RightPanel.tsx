import React from "react";
import { Cpu, Key, FileSpreadsheet, Download, Square, Play } from "lucide-react";
import { InspectionHistory, ThemeStyles } from "../types";
import { SimilarityTrendChart } from "./SimilarityTrendChart";
import { HistoryLogItem } from "./HistoryLogItem";

interface RightPanelProps {
  theme: "dark" | "light";
  t: ThemeStyles;
  isInspecting: boolean;
  continuousOkFrames: number;
  simHistory: number[];
  vlmEnabled: boolean;
  setVlmEnabled: (v: boolean) => void;
  showApiKeyInput: boolean;
  setShowApiKeyInput: (v: boolean) => void;
  vlmApiKey: string;
  setVlmApiKey: (v: string) => void;
  vlmPrompt: string;
  setVlmPrompt: (v: string) => void;
  vlmReport: string;
  isVlmProcessing: boolean;
  defectCount: number;
  stats: { total: number; ok: number; ng: number };
  passThreshold: number;
  toggleInspectionState: () => void;
  historyList: InspectionHistory[];
  triggerExportExcel: () => void;
  triggerExportStandaloneHTML: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  theme,
  t,
  isInspecting,
  continuousOkFrames,
  simHistory,
  vlmEnabled,
  setVlmEnabled,
  showApiKeyInput,
  setShowApiKeyInput,
  vlmApiKey,
  setVlmApiKey,
  vlmPrompt,
  setVlmPrompt,
  vlmReport,
  isVlmProcessing,
  defectCount,
  stats,
  passThreshold,
  toggleInspectionState,
  historyList,
  triggerExportExcel,
  triggerExportStandaloneHTML,
}) => {
  return (
    <div className={`w-[420px] p-4 flex flex-col gap-4 overflow-y-auto shrink-0 transition-all ${t.panelBg}`} style={{ borderLeftWidth: "1px", borderColor: theme === "light" ? "#cbd5e1" : "#191926" }}>
      
      {/* LED 계기판 */}
      <div className="space-y-2">
        <h3 className={`text-xs font-bold tracking-wider uppercase ${t.subtext}`}>인스펙션 계기판</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* 대형 LED */}
          <div className={`p-4 rounded-2xl flex flex-col items-center justify-center border text-center transition-all ${
            !isInspecting ? (theme === "light" ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-[#11111a] border-[#212130] text-[#7c7c8c]") :
            continuousOkFrames >= 20 ? "bg-[#0b2416] border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]" :
            "bg-[#251010] border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
          }`}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8e8e9f]">현재 판정</span>
            <span className="text-xl font-bold mt-1.5 font-mono">
              {!isInspecting ? "STATIC" : continuousOkFrames >= 20 ? "PASS (OK)" : "FAIL (NG)"}
            </span>
          </div>

          {/* 매치 스코어 보드 */}
          <div className={`p-4 rounded-2xl flex flex-col items-center justify-center transition-all ${t.cardBg}`}>
            <span className={`text-[10px] font-mono tracking-widest uppercase ${t.subtext}`}>CV 픽셀 유사도</span>
            <span className={`text-2xl font-bold mt-1 font-mono ${
              continuousOkFrames >= 20 ? "text-emerald-400" : "text-amber-500"
            }`}>
              {isInspecting && simHistory.length > 0 ? `${simHistory[simHistory.length - 1]}%` : "0%"}
            </span>
          </div>
        </div>
      </div>

      {/* VLM AI 인시던트 피아차 */}
      <div className={`p-3 border rounded-xl space-y-2 relative overflow-hidden transition-all ${
        theme === 'light' ? 'bg-indigo-50/40 border-indigo-200/50' : 'bg-[#110e1a] border-[#d946ef]/20'
      }`}>
        <div className="absolute right-2 top-2">
          <Cpu className={`w-4 h-4 text-purple-400 ${isVlmProcessing ? "animate-spin" : ""}`} />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-bold text-purple-300 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={vlmEnabled} 
              onChange={(e) => setVlmEnabled(e.target.checked)}
              className="rounded bg-[#0c0c14] border-purple-500/50 text-purple-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer" 
            />
            🧠 Gemini VLM 지능형 이중 검사
          </label>
          
          <button onClick={() => setShowApiKeyInput(!showApiKeyInput)} className="text-[#8e8e9f] hover:text-white p-0.5 cursor-pointer">
            <Key className="w-3.5 h-3.5" />
          </button>
        </div>

        {showApiKeyInput && (
          <div className="p-2 bg-[#0e0c14] rounded border border-purple-500/20 space-y-1 animate-fadeIn">
            <span className="text-[9px] text-[#8a8aa3] font-mono">로컬 Standalone 실 구성을 위한 Gemini API Key 지정</span>
            <input 
              type="password" 
              placeholder="AI Studio 비밀 스토어 키가 존재할 시 비워두세요" 
              value={vlmApiKey}
              onChange={(e) => setVlmApiKey(e.target.value)}
              className={`w-full text-xs font-mono rounded p-1.5 focus:outline-none transition-all ${t.inputBg}`}
            />
          </div>
        )}

        <div className="space-y-1">
          <span className="text-[10px] text-purple-400 font-bold">인코더 프롬프트:</span>
          <textarea 
            rows={2} 
            value={vlmPrompt}
            onChange={(e) => setVlmPrompt(e.target.value)}
            className={`w-full text-xs rounded-lg p-2 focus:outline-none transition-all ${
              theme === 'light' ? 'bg-white border border-indigo-200 text-slate-800' :
              'bg-[#0c0c12]/80 border border-purple-500/10 text-slate-100'
            }`}
          />
        </div>

        {vlmReport && (
          <div className={`p-2.5 rounded-lg border text-xs leading-relaxed transition-all ${
            theme === 'light' ? 'bg-white border-indigo-100 text-slate-800' :
            'bg-[#0b0c10] border-purple-500/10 text-[#c0a8cf]'
          }`}>
            <div className="text-[10px] text-purple-400 font-bold mb-1">AI 정밀 분석 리포트:</div>
            <p className="font-sans text-[11px] font-medium">{vlmReport}</p>
            {defectCount > 0 && (
              <div className="text-[10px] text-yellow-400 font-mono mt-1">
                ⚠️ 하드웨어 분석기 기준 결함 지점 {defectCount}개 히트맵 마운트.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 누적 OK, NG 통량 및 수율 */}
      <div className={`p-4 rounded-2xl relative space-y-3 shrink-0 transition-all ${t.cardBg}`}>
        <h3 className={`text-xs font-bold tracking-wider uppercase ${t.subtext}`}>누적 공정 모니터링</h3>
        <div className="grid grid-cols-4 gap-2 font-mono text-center">
          <div className={`p-2 rounded-xl border ${
            theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' :
            'bg-[#151522] border-transparent text-white'
          }`}>
            <div className="text-[9px] opacity-70">TOTAL</div>
            <div className="text-sm font-bold mt-1">{stats.total}</div>
          </div>
          <div className={`p-2 rounded-xl text-emerald-400 border ${
            theme === 'light' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            'bg-[#0e2217] border-transparent'
          }`}>
            <div className="text-[9px] opacity-80">OK</div>
            <div className="text-sm font-bold mt-1">{stats.ok}</div>
          </div>
          <div className={`p-2 rounded-xl text-red-400 border ${
            theme === 'light' ? 'bg-red-50 border-red-200 text-red-700' :
            'bg-[#241313] border-transparent'
          }`}>
            <div className="text-[9px] opacity-80">NG</div>
            <div className="text-sm font-bold mt-1">{stats.ng}</div>
          </div>
          <div className={`p-2 rounded-xl text-blue-400 border ${
            theme === 'light' ? 'bg-sky-50 border-sky-200 text-sky-800' :
            'bg-[#121c25] border-transparent'
          }`}>
            <div className="text-[9px] opacity-80">수율</div>
            <div className="text-sm font-bold mt-1">
              {stats.total > 0 ? `${Math.round((stats.ok / stats.total) * 100)}%` : "0%"}
            </div>
          </div>
        </div>
      </div>

      {/* 최근 10회 검사 유사도 추이 Line Chart */}
      <SimilarityTrendChart
        historyList={historyList}
        passThreshold={passThreshold}
        theme={theme}
        t={t}
      />

      {/* 인스펙션 제어 스위치 */}
      <button 
        onClick={toggleInspectionState}
        className={`w-full py-3.5 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition shadow-lg ${
          isInspecting ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-slate-900"
        }`}
      >
        {isInspecting ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isInspecting ? "검사 임시 중지" : "검사 개시 (연속 감지)"}
      </button>

      {/* 역사적 기록 로그 보드 */}
      <div className={`flex-1 min-h-[140px] flex flex-col border rounded-2xl overflow-hidden transition-all ${t.logBg}`} style={{ borderColor: theme === "light" ? "#cbd5e1" : "#212130" }}>
        <div className={`py-2 px-3.5 border-b flex justify-between items-center shrink-0 transition-all ${
          theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#151522] border-[#212130]'
        }`}>
          <span className={`text-xs font-bold ${t.subtext}`}>실시간 로그로그 ({historyList.length})</span>
          <div className="flex gap-2">
            <button onClick={triggerExportExcel} className="text-[#3b82f6] hover:underline text-[11px] font-mono flex items-center gap-0.5 cursor-pointer">
              <FileSpreadsheet className="w-3 h-3" /> 엑셀출력
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto font-mono text-[11px] p-1.5 space-y-1" style={{ borderColor: theme === "light" ? "#f1f5f9" : "#1e1e2d" }}>
          {historyList.length === 0 ? (
            <div className={`h-full flex items-center justify-center text-center p-4 ${t.subtext}`}>
              대기중...<br />제품 검사 시 기동 로그가 자동 누계됩니다.
            </div>
          ) : (
            historyList.map(item => (
              <HistoryLogItem
                key={item.id}
                item={item}
                theme={theme}
                t={t}
              />
            ))
          )}
        </div>
      </div>

      {/* 에지 독립형 AOI.html 내보내기 배너 */}
      <div className={`p-3 rounded-2xl flex items-center justify-between shadow-md shrink-0 border transition-all ${
        theme === 'light' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' :
        'bg-gradient-to-r from-blue-900/20 via-[#141424] to-purple-950/20 border-blue-500/10'
      }`}>
        <div className="space-y-0.5">
          <span className={`text-xs font-bold flex items-center gap-1 ${theme === 'light' ? 'text-indigo-600' : 'text-blue-300'}`}>독립형 에디션 변환</span>
          <p className={`text-[10px] leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-[#71718c]'}`}>로컬 PC 더블클릭 기동용 AOI.html</p>
        </div>
        
        <button 
          onClick={triggerExportStandaloneHTML}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> HTML 추출
        </button>
      </div>

    </div>
  );
};
