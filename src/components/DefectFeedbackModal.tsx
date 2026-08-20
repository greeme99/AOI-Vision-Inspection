import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  AlertTriangle, 
  Database, 
  Sparkles, 
  CheckCircle, 
  X, 
  Tag, 
  Flame, 
  BrainCircuit, 
  Clock, 
  Save, 
  RotateCcw,
  Camera
} from "lucide-react";
import { DefectRecord, DefectItem, ThemeStyles } from "../types";

interface DefectFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defectCandidate: {
    id: string;
    time: string;
    serial: string;
    barcode: string;
    imageUrl: string;
    similarityCV: number;
    similarityAI?: number;
    aiReason?: string;
    defects?: DefectItem[];
  } | null;
  onBackupAndLearn: (record: DefectRecord) => void;
  onOverrideFalsePositive: (id: string) => void;
  theme: "dark" | "light";
  t: ThemeStyles;
}

const COMMON_DEFECT_TYPES = [
  "표면 스크래치",
  "나사/체결 누락",
  "틈새/유격 뒤틀림",
  "외관 크랙/파손",
  "이물/오염 부착",
  "치수/형상 변형",
  "사출 버/미성형",
  "기타 결함"
];

export const DefectFeedbackModal: React.FC<DefectFeedbackModalProps> = ({
  isOpen,
  onClose,
  defectCandidate,
  onBackupAndLearn,
  onOverrideFalsePositive,
  theme,
  t,
}) => {
  const [selectedType, setSelectedType] = useState<string>("표면 스크래치");
  const [customType, setCustomType] = useState<string>("");
  const [severity, setSeverity] = useState<"CRITICAL" | "MAJOR" | "MINOR">("MAJOR");
  const [feedbackNote, setFeedbackNote] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(15);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(true);

  // 초기화 및 자동 불량 유형 추천
  useEffect(() => {
    if (defectCandidate) {
      setCountdown(15);
      setIsAutoSaving(true);
      setFeedbackNote("");
      
      const reason = defectCandidate.aiReason || "";
      if (reason.includes("나사") || reason.includes("체결")) {
        setSelectedType("나사/체결 누락");
      } else if (reason.includes("틈새") || reason.includes("유격")) {
        setSelectedType("틈새/유격 뒤틀림");
      } else if (reason.includes("크랙") || reason.includes("파손")) {
        setSelectedType("외관 크랙/파손");
      } else if (reason.includes("이물") || reason.includes("오염")) {
        setSelectedType("이물/오염 부착");
      } else if (reason.includes("스크래치") || reason.includes("흠집")) {
        setSelectedType("표면 스크래치");
      } else {
        setSelectedType("표면 스크래치");
      }
    }
  }, [defectCandidate]);

  // 카운트다운 타이머
  useEffect(() => {
    if (!isOpen || !isAutoSaving || !defectCandidate) return;

    if (countdown <= 0) {
      handleSave();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown, isAutoSaving, defectCandidate]);

  if (!isOpen || !defectCandidate) return null;

  const handleSave = () => {
    const finalType = customType.trim() ? customType.trim() : selectedType;
    const record: DefectRecord = {
      id: defectCandidate.id,
      timestamp: Date.now(),
      time: defectCandidate.time,
      serial: defectCandidate.serial,
      barcode: defectCandidate.barcode,
      imageUrl: defectCandidate.imageUrl,
      defectType: finalType,
      severity,
      similarityCV: defectCandidate.similarityCV,
      similarityAI: defectCandidate.similarityAI,
      aiReason: defectCandidate.aiReason,
      feedbackNote: feedbackNote.trim() || undefined,
      defects: defectCandidate.defects,
      isLearned: true,
    };

    onBackupAndLearn(record);
    onClose();
  };

  const handleOverride = () => {
    onOverrideFalsePositive(defectCandidate.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all ${
          theme === "light"
            ? "bg-white border-red-200 text-slate-900"
            : "bg-[#11111d] border-red-500/30 text-slate-100"
        }`}
      >
        {/* 모달 상단 헤더 */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                🚨 불량(NG) 발생: 실시간 불량유형 백업 및 AI 학습 피드백
              </h3>
              <p className="text-[11px] opacity-90 font-mono">
                {defectCandidate.serial} | {defectCandidate.barcode} | {defectCandidate.time}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 모달 본문 콘텐츠 */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* 1. 불량 스냅샷 이미지 & 분석 수치 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 캡처 이미지 */}
            <div
              className={`rounded-xl border overflow-hidden relative flex flex-col items-center justify-center ${
                theme === "light" ? "bg-slate-100 border-slate-200" : "bg-[#0a0a12] border-[#222238]"
              }`}
            >
              <img
                src={defectCandidate.imageUrl}
                alt="Defect Snapshot"
                className="w-full h-44 object-contain"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-red-400 font-mono text-[10px] flex items-center gap-1 border border-red-500/30">
                <Camera className="w-3 h-3" /> 결함 캡처 스냅샷
              </div>
            </div>

            {/* AI 분석 메타데이터 */}
            <div className="space-y-2 text-xs flex flex-col justify-between">
              <div
                className={`p-3 rounded-xl border space-y-1.5 ${
                  theme === "light" ? "bg-red-50/50 border-red-100" : "bg-[#18111e] border-red-500/20"
                }`}
              >
                <div className="flex justify-between font-mono">
                  <span className="text-[#8e8e9f]">CV 픽셀 유사도:</span>
                  <span className="font-bold text-red-400">{defectCandidate.similarityCV}%</span>
                </div>
                {defectCandidate.similarityAI !== undefined && (
                  <div className="flex justify-between font-mono">
                    <span className="text-[#8e8e9f]">Gemini VLM 신뢰도:</span>
                    <span className="font-bold text-purple-400">{defectCandidate.similarityAI}%</span>
                  </div>
                )}
                <div className="pt-1 border-t border-dashed border-red-500/20">
                  <span className="font-bold text-[11px] text-purple-400 flex items-center gap-1">
                    <BrainCircuit className="w-3 h-3" /> VLM 지능형 진단:
                  </span>
                  <p className="text-[11px] mt-0.5 leading-relaxed font-sans opacity-90">
                    {defectCandidate.aiReason || "기준 양품과의 형상 불일치 및 픽셀 차이 감지"}
                  </p>
                </div>
              </div>

              {/* 심각도 선택 */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold flex items-center gap-1 text-amber-400">
                  <Flame className="w-3 h-3" /> 결함 심각도 등급:
                </span>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                  {(["CRITICAL", "MAJOR", "MINOR"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setSeverity(lvl);
                        setIsAutoSaving(false);
                      }}
                      className={`py-1.5 rounded-lg font-bold border transition cursor-pointer ${
                        severity === lvl
                          ? lvl === "CRITICAL"
                            ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30"
                            : lvl === "MAJOR"
                            ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30"
                            : "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30"
                          : theme === "light"
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-[#161626] text-slate-400 border-[#26263a]"
                      }`}
                    >
                      {lvl === "CRITICAL" ? "🔴 치명(Critical)" : lvl === "MAJOR" ? "🟠 중결함(Major)" : "🟡 경결함(Minor)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. 불량 유형 태그 선택 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1 text-blue-400">
                <Tag className="w-3.5 h-3.5" /> 불량 유형 분류 (선택 시 AI 학습 지식베이스에 분류 등록):
              </span>
              <span className="text-[10px] text-[#8e8e9f]">원클릭 칩 선택</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_DEFECT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedType(type);
                    setCustomType("");
                    setIsAutoSaving(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    selectedType === type && !customType
                      ? "bg-red-500/20 text-red-400 border-red-500 shadow-sm"
                      : theme === "light"
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      : "bg-[#161626] hover:bg-[#202036] text-slate-300 border-[#26263a]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="직접 불량 유형 입력 (필요 시)"
              value={customType}
              onChange={(e) => {
                setCustomType(e.target.value);
                setIsAutoSaving(false);
              }}
              className={`w-full text-xs rounded-lg px-2.5 py-1.5 border focus:outline-none transition ${t.inputBg}`}
            />
          </div>

          {/* 3. 작업자 보정 메모 */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">작업자 보정 피드백 & 결함 조치 메모:</span>
            <textarea
              rows={2}
              placeholder="예: 상단 좌측 볼트 체결 누락 확인. 다음 검사 시 해당 위치 집중 검사 권장."
              value={feedbackNote}
              onChange={(e) => {
                setFeedbackNote(e.target.value);
                setIsAutoSaving(false);
              }}
              className={`w-full text-xs rounded-lg p-2 border focus:outline-none transition ${t.inputBg}`}
            />
          </div>
        </div>

        {/* 모달 하단 액션 버튼 */}
        <div
          className={`px-5 py-3 border-t flex flex-wrap items-center justify-between gap-3 ${
            theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#0d0d16] border-[#202034]"
          }`}
        >
          {/* 오탐 정정 버튼 */}
          <button
            onClick={handleOverride}
            className="px-3 py-2 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            양품 오탐 정정 (PASS로 변경)
          </button>

          <div className="flex items-center gap-2">
            {isAutoSaving && (
              <span className="text-[11px] font-mono text-[#8e8e9f] flex items-center gap-1">
                <Clock className="w-3 h-3 text-red-400 animate-spin" />
                {countdown}초 후 자동 백업
              </span>
            )}

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              불량 DB 백업 & AI 학습 파이프라인 등록
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
