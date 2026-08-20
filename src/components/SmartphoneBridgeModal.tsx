import React, { useState } from "react";
import { Smartphone, QrCode, Copy, Check, ExternalLink, Radio, Camera, Scan, X, AlertCircle } from "lucide-react";
import { generateQRCodeSVG } from "../utils/qrCode";
import { ThemeStyles } from "../types";

interface SmartphoneBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  isConnected: boolean;
  deviceName?: string;
  lastReceivedTime: number;
  frameCount: number;
  lastBarcode?: string;
  theme: "dark" | "light";
  t: ThemeStyles;
  isUsingPhoneStream: boolean;
  setIsUsingPhoneStream: (val: boolean) => void;
}

export const SmartphoneBridgeModal: React.FC<SmartphoneBridgeModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  isConnected,
  deviceName,
  lastReceivedTime,
  frameCount,
  lastBarcode,
  theme,
  t,
  isUsingPhoneStream,
  setIsUsingPhoneStream,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 현재 브라우저 URL 기반 모바일 전용 링크 구성
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const mobileLink = `${currentOrigin}/?mode=mobile_node&session=${encodeURIComponent(sessionId)}`;
  const qrImageSrc = generateQRCodeSVG(mobileLink, 220);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`max-w-lg w-full rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all ${
          theme === "light" ? "bg-white border-slate-200 text-slate-800" : "bg-[#12131d] border-[#252538] text-slate-100"
        }`}
      >
        {/* 상단 헤더 */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#181926] border-[#252538]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                스마트폰 카메라 & 바코드 스캐너 무선 연동
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  DEV MODE
                </span>
              </h3>
              <p className={`text-[11px] ${t.subtext}`}>
                개발 및 테스트 단계에서 스마트폰을 고화질 무선 웹캠 및 바코드 스캐너로 활용합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 콘텐츠 */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 연결 상태 배너 */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isConnected
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : theme === "light"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-amber-950/30 border-amber-500/20 text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Radio className={`w-4 h-4 ${isConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
                {isConnected && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold">
                  {isConnected ? `스마트폰 연결됨 (${deviceName || "Mobile Device"})` : "스마트폰 연결 대기중..."}
                </div>
                <div className="text-[10px] opacity-80 font-mono">
                  {isConnected
                    ? `수신된 프레임: ${frameCount}개 | 세션 ID: ${sessionId}`
                    : "아래 QR 코드를 스마트폰 카메라로 비춰 연결해주세요."}
                </div>
              </div>
            </div>

            {isConnected && (
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/40">
                <input
                  type="checkbox"
                  checked={isUsingPhoneStream}
                  onChange={(e) => setIsUsingPhoneStream(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                메인 비전 화면에 사용
              </label>
            )}
          </div>

          {/* QR 코드 및 접속 안내 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* QR 이미지 카드 */}
            <div
              className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-2.5 ${
                theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#161724] border-[#252538]"
              }`}
            >
              <div className="bg-white p-2.5 rounded-xl shadow-md border border-slate-200">
                <img
                  src={qrImageSrc}
                  alt="스마트폰 연결 QR코드"
                  className="w-40 h-40 object-contain mx-auto"
                  crossOrigin="anonymous"
                />
              </div>
              <span className={`text-[11px] font-medium ${t.subtext}`}>
                📱 기본 카메라 앱으로 QR 코드를 스캔하세요
              </span>
            </div>

            {/* 단계별 가이드 */}
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="text-xs font-bold flex items-center gap-1.5 text-blue-400">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">1</span>
                  스마트폰 카메라로 QR 스캔
                </div>
                <p className={`text-[11px] leading-relaxed pl-5 ${t.subtext}`}>
                  별도 앱 설치 없이 스마트폰 기본 카메라로 QR 코드를 비추면 브라우저로 즉시 열립니다.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">2</span>
                  카메라 권한 허용
                </div>
                <p className={`text-[11px] leading-relaxed pl-5 ${t.subtext}`}>
                  스마트폰 고화질 후면 카메라와 바코드 스캐너가 실시간 가동됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold flex items-center gap-1.5 text-purple-400">
                  <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">3</span>
                  실시간 AOI 검사 & 바코드 입력
                </div>
                <p className={`text-[11px] leading-relaxed pl-5 ${t.subtext}`}>
                  스마트폰으로 기구물과 바코드를 비추면 PC 화면의 검사 시스템에 즉각 반영됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 모바일 URL 직접 복사 */}
          <div
            className={`p-3 rounded-xl border space-y-1.5 ${
              theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#141522] border-[#222338]"
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold flex items-center gap-1.5 ${t.subtext}`}>
                직접 접속 링크 (스마트폰 브라우저에 입력):
              </span>
              <button
                onClick={handleCopyLink}
                className="text-blue-400 hover:text-blue-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "복사됨!" : "링크 복사"}
              </button>
            </div>
            <div className="text-[11px] font-mono p-2 rounded-lg bg-black/30 border border-white/5 truncate text-slate-300 select-all">
              {mobileLink}
            </div>
          </div>

          {/* 최신 바코드 감지 상태 */}
          {lastBarcode && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5" /> 최신 스마트폰 수신 바코드:
              </span>
              <span className="font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded">
                {lastBarcode}
              </span>
            </div>
          )}
        </div>

        {/* 하단 닫기 */}
        <div
          className={`p-3.5 border-t flex justify-end gap-2 ${
            theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#181926] border-[#252538]"
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${t.btnPrimary}`}
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
