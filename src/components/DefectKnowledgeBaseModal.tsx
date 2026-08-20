import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Database, 
  BrainCircuit, 
  Sparkles, 
  Download, 
  Trash2, 
  X, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Flame,
  FileSpreadsheet,
  FlaskConical
} from "lucide-react";
import { DefectRecord, ThemeStyles } from "../types";
import { exportDefectDbJson } from "../utils/defectLearner";

interface DefectKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  defectList: DefectRecord[];
  onDeleteDefect: (id: string) => void;
  onTriggerLearnAi: () => void;
  onLoadScenarioSeed?: () => void;
  isLearning: boolean;
  theme: "dark" | "light";
  t: ThemeStyles;
}

export const DefectKnowledgeBaseModal: React.FC<DefectKnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  defectList,
  onDeleteDefect,
  onTriggerLearnAi,
  onLoadScenarioSeed,
  isLearning,
  theme,
  t,
}) => {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedImageModal, setSelectedImageModal] = useState<DefectRecord | null>(null);

  if (!isOpen) return null;

  // 필터링 목록
  const filteredList = defectList.filter((item) => {
    const matchType = filterType === "ALL" || item.defectType === filterType;
    const matchSearch =
      !searchKeyword ||
      item.serial.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (item.defectType && item.defectType.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (item.feedbackNote && item.feedbackNote.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (item.aiReason && item.aiReason.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchType && matchSearch;
  });

  // 불량 유형 통계
  const typeStats: Record<string, number> = {};
  defectList.forEach((d) => {
    typeStats[d.defectType] = (typeStats[d.defectType] || 0) + 1;
  });

  const learnedCount = defectList.filter((d) => d.isLearned).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-5xl h-[85vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all ${
          theme === "light"
            ? "bg-white border-slate-300 text-slate-900"
            : "bg-[#0e0e18] border-[#222238] text-slate-100"
        }`}
      >
        {/* 상단 헤더 */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#141424] border-[#222236]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-600/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                불량유형 지식베이스 & AI 피드백 학습 센터
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono font-bold border border-red-500/30">
                  {defectList.length}건 백업됨
                </span>
              </h2>
              <p className="text-xs text-[#8e8e9f]">
                실제 검사 중 수집된 결함 스냅샷 및 작업자 피드백을 기반으로 VLM AI 프롬프트 규칙을 자가 학습(Self-Calibration)합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onLoadScenarioSeed && (
              <button
                onClick={onLoadScenarioSeed}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 flex items-center gap-1.5 transition cursor-pointer"
                title="10건의 불량 지식 및 20건의 검사 이력 시나리오 데이터셋 로드"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                🧪 시나리오 테스트 데이터셋 로드
              </button>
            )}

            <button
              onClick={() => exportDefectDbJson(defectList)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer hover:bg-slate-500/10"
              style={{ borderColor: theme === "light" ? "#cbd5e1" : "#2e2e46" }}
            >
              <Download className="w-3.5 h-3.5" />
              JSON 백업
            </button>

            {/* AI 학습 실행 버튼 */}
            <button
              onClick={onTriggerLearnAi}
              disabled={isLearning || defectList.length === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg transition cursor-pointer ${
                isLearning || defectList.length === 0
                  ? "bg-slate-600 opacity-60 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-purple-600/30 animate-pulse"
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              {isLearning ? "AI 학습 최적화 중..." : "🧠 AI 불량 지식 학습 (Active Learning)"}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-500/20 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 요약 통계 배너 */}
        <div
          className={`px-6 py-3 border-b grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0 text-xs ${
            theme === "light" ? "bg-slate-100/70 border-slate-200" : "bg-[#111120] border-[#1e1e32]"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[#8e8e9f]">총 누적 불량 레코드</span>
            <span className="text-base font-bold font-mono text-red-500">{defectList.length}건</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#8e8e9f]">AI VLM 학습 반영 상태</span>
            <span className="text-base font-bold font-mono text-purple-400">
              {learnedCount} / {defectList.length} ({(defectList.length > 0 ? (learnedCount / defectList.length) * 100 : 0).toFixed(0)}%)
            </span>
          </div>
          <div className="flex flex-col md:col-span-2">
            <span className="text-[#8e8e9f]">빈출 불량 유형 분포</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {Object.entries(typeStats).map(([type, count]) => (
                <span
                  key={type}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono"
                >
                  {type}: {count}
                </span>
              ))}
              {Object.keys(typeStats).length === 0 && (
                <span className="text-[11px] text-[#8e8e9f]">아직 등록된 불량 데이터가 없습니다.</span>
              )}
            </div>
          </div>
        </div>

        {/* 필터 및 검색 바 */}
        <div className="px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b shrink-0" style={{ borderColor: theme === "light" ? "#e2e8f0" : "#1e1e32" }}>
          {/* 유형 탭 필터 */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterType === "ALL"
                  ? "bg-blue-600 text-white shadow-sm"
                  : theme === "light"
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-[#18182a] text-slate-400 hover:bg-[#222238]"
              }`}
            >
              전체 ({defectList.length})
            </button>
            {Object.keys(typeStats).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterType === type
                    ? "bg-red-600 text-white shadow-sm"
                    : theme === "light"
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    : "bg-[#18182a] text-slate-400 hover:bg-[#222238]"
                }`}
              >
                {type} ({typeStats[type]})
              </button>
            ))}
          </div>

          {/* 검색 인풋 */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="시리얼 / 모델 / 메모 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className={`text-xs pl-8 pr-3 py-1.5 rounded-lg border focus:outline-none w-52 transition ${t.inputBg}`}
            />
          </div>
        </div>

        {/* 불량 리스트 갤러리 그리드 */}
        <div className="flex-1 p-6 overflow-y-auto">
          {filteredList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#8e8e9f] space-y-2">
              <Database className="w-10 h-10 opacity-30" />
              <p className="text-sm font-semibold">해당 조건의 불량 기록이 없습니다.</p>
              <p className="text-xs max-w-sm">
                검사 중 불량(NG)이 발생하면 자동으로 캡처된 스냅샷과 진단 피드백이 이곳 불량 지식베이스에 아카이빙됩니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredList.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-md ${
                    theme === "light" ? "bg-white border-slate-200 hover:border-red-300" : "bg-[#121220] border-[#222238] hover:border-red-500/40"
                  }`}
                >
                  {/* 카드 헤더 */}
                  <div className="p-3 pb-2 flex items-center justify-between border-b" style={{ borderColor: theme === "light" ? "#f1f5f9" : "#1a1a2e" }}>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        {item.defectType}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                          item.severity === "CRITICAL"
                            ? "bg-red-600 text-white"
                            : item.severity === "MAJOR"
                            ? "bg-amber-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteDefect(item.id)}
                      title="불량 데이터 삭제"
                      className="p-1 text-slate-400 hover:text-red-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 캡처 이미지 뷰어 */}
                  <div
                    onClick={() => setSelectedImageModal(item)}
                    className="h-36 relative overflow-hidden bg-black/50 cursor-pointer group flex items-center justify-center"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.defectType}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                      <ExternalLink className="w-4 h-4" /> 크게 보기
                    </div>
                    <div className="absolute bottom-1 right-2 text-[9px] font-mono text-white/80 bg-black/60 px-1.5 py-0.5 rounded">
                      CV {item.similarityCV}%
                    </div>
                  </div>

                  {/* 카드 상세 정보 */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="font-bold">{item.serial}</span>
                        <span className="text-[#8e8e9f]">{item.time}</span>
                      </div>
                      <div className="text-[10px] text-[#8e8e9f] font-mono truncate">
                        모델: {item.barcode}
                      </div>
                      {item.feedbackNote && (
                        <div className="p-1.5 rounded text-[11px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-sans">
                          💬 {item.feedbackNote}
                        </div>
                      )}
                      {item.aiReason && !item.feedbackNote && (
                        <p className="text-[10px] text-[#8e8e9f] line-clamp-2 leading-relaxed">
                          {item.aiReason}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between text-[10px]" style={{ borderColor: theme === "light" ? "#f1f5f9" : "#1a1a2e" }}>
                      <span className="flex items-center gap-1 text-purple-400 font-bold">
                        <Sparkles className="w-3 h-3" /> AI 학습 연동됨
                      </span>
                      <a
                        href={item.imageUrl}
                        download={`Defect_${item.serial}_${item.defectType}.jpg`}
                        className="text-blue-400 hover:underline flex items-center gap-0.5"
                      >
                        <Download className="w-2.5 h-2.5" /> 사진 저장
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 확대 이미지 모달 */}
        {selectedImageModal && (
          <div
            onClick={() => setSelectedImageModal(null)}
            className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer"
          >
            <div className="max-w-3xl w-full max-h-[85vh] bg-[#11111e] rounded-2xl border border-red-500/30 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-3 bg-red-950/40 border-b border-red-500/20 flex justify-between items-center text-white text-xs font-bold">
                <span>{selectedImageModal.serial} - {selectedImageModal.defectType} ({selectedImageModal.time})</span>
                <button onClick={() => setSelectedImageModal(null)} className="p-1 hover:bg-white/20 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 p-4 flex items-center justify-center bg-black">
                <img src={selectedImageModal.imageUrl} alt="Enlarged Defect" className="max-h-[65vh] object-contain rounded" />
              </div>
              <div className="p-3 bg-[#161626] text-xs space-y-1">
                <p className="text-purple-400 font-semibold">AI 진단: {selectedImageModal.aiReason || "형상 불일치"}</p>
                {selectedImageModal.feedbackNote && <p className="text-blue-300">작업자 메모: {selectedImageModal.feedbackNote}</p>}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
