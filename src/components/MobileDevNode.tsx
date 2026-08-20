import React, { useState, useEffect, useRef } from "react";
import { Camera, RefreshCw, Zap, Scan, Send, CheckCircle2, ArrowLeft, Radio, Sparkles } from "lucide-react";
import { detectBarcodeFromElement } from "../utils/barcodeScanner";

interface MobileDevNodeProps {
  sessionId: string;
  onExitMobileMode?: () => void;
}

export const MobileDevNode: React.FC<MobileDevNodeProps> = ({
  sessionId,
  onExitMobileMode,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [isAutoStreaming, setIsAutoStreaming] = useState(true);
  const [fps, setFps] = useState(5); // 5fps 스트리밍
  
  // 바코드 스캔 상태
  const [isBarcodeScanning, setIsBarcodeScanning] = useState(true);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>("");
  const [barcodeBox, setBarcodeBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  
  // 전송 상태
  const [sendCount, setSendCount] = useState(0);
  const [lastSendStatus, setLastSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const trackRef = useRef<MediaStreamTrack | null>(null);
  const streamIntervalRef = useRef<any>(null);
  const scanIntervalRef = useRef<any>(null);

  // 1. 카메라 기동
  useEffect(() => {
    startMobileCamera();
    return () => {
      stopMobileCamera();
    };
  }, [facingMode]);

  const startMobileCamera = async () => {
    stopMobileCamera();
    setErrorMessage("");
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraActive(true);
          setConnectionStatus("connected");
        };
      }

      const videoTrack = stream.getVideoTracks()[0];
      trackRef.current = videoTrack;

      // 플래시/Torch 지원 여부 확인
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities?.();
        if (capabilities && capabilities.torch) {
          setHasTorchSupport(true);
        }
      }
    } catch (err: any) {
      console.error("모바일 카메라 기동 실패:", err);
      setErrorMessage("카메라 권한을 승인하거나 지원되는 브라우저에서 실행해주세요.");
      setConnectionStatus("disconnected");
    }
  };

  const stopMobileCamera = () => {
    if (trackRef.current) {
      trackRef.current.stop();
      trackRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // 플래시/Torch 제어
  const toggleTorch = async () => {
    if (!trackRef.current || !hasTorchSupport) return;
    try {
      const nextTorch = !isTorchOn;
      await (trackRef.current as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn("Torch 제어 실패:", e);
    }
  };

  // 비프음 & 햅틱 진동 피드백
  const triggerScanFeedback = () => {
    try {
      if ("vibrate" in navigator) {
        navigator.vibrate([80, 50, 80]);
      }
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // 오디오 제약 무시
    }
  };

  // 2. 바코드 감지 루프
  useEffect(() => {
    if (!isCameraActive || !isBarcodeScanning) return;

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      
      const detected = await detectBarcodeFromElement(videoRef.current);
      if (detected && detected.rawValue && detected.rawValue !== lastScannedBarcode) {
        setLastScannedBarcode(detected.rawValue);
        triggerScanFeedback();
        
        if (detected.boundingBox && videoRef.current) {
          const vW = videoRef.current.videoWidth || 1;
          const vH = videoRef.current.videoHeight || 1;
          setBarcodeBox({
            x: (detected.boundingBox.x / vW) * 100,
            y: (detected.boundingBox.y / vH) * 100,
            w: (detected.boundingBox.width / vW) * 100,
            h: (detected.boundingBox.height / vH) * 100,
          });
          setTimeout(() => setBarcodeBox(null), 2000);
        }

        // 서버 브릿지에 바코드 즉시 전송
        sendBarcodeToServer(detected.rawValue);
      }
    }, 300);

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isCameraActive, isBarcodeScanning, lastScannedBarcode]);

  // 3. 실시간 프레임 전송 루프
  useEffect(() => {
    if (!isCameraActive || !isAutoStreaming) return;

    const intervalMs = Math.round(1000 / fps);
    streamIntervalRef.current = setInterval(() => {
      captureAndSendFrame();
    }, intervalMs);

    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [isCameraActive, isAutoStreaming, fps]);

  const captureFrameBase64 = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const v = videoRef.current;
    if (v.videoWidth === 0 || v.videoHeight === 0) return null;

    const canvas = canvasRef.current;
    // 전송 효율을 위해 적정 해상도 640x480 리사이즈
    const targetW = 640;
    const targetH = Math.round((v.videoHeight / v.videoWidth) * targetW) || 480;
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, targetW, targetH);

    return canvas.toDataURL("image/jpeg", 0.65);
  };

  const captureAndSendFrame = async () => {
    const frameBase64 = captureFrameBase64();
    if (!frameBase64) return;

    try {
      setLastSendStatus("sending");
      const res = await fetch("/api/dev-bridge/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          frameImage: frameBase64,
          deviceName: `${navigator.platform || "스마트폰"} (${facingMode === "environment" ? "후면" : "전면"})`,
          isStreaming: isAutoStreaming,
        }),
      });
      if (res.ok) {
        setSendCount((prev) => prev + 1);
        setLastSendStatus("success");
      } else {
        setLastSendStatus("error");
      }
    } catch (e) {
      setLastSendStatus("error");
    }
  };

  const sendBarcodeToServer = async (code: string) => {
    if (!code) return;
    try {
      await fetch("/api/dev-bridge/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          barcode: code,
          deviceName: "스마트폰 바코드 스캐너",
        }),
      });
    } catch (e) {
      console.warn("바코드 전송 실패:", e);
    }
  };

  const handleManualBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    setLastScannedBarcode(manualBarcode.trim());
    triggerScanFeedback();
    sendBarcodeToServer(manualBarcode.trim());
    setManualBarcode("");
  };

  const handlePresetBarcode = (code: string) => {
    setLastScannedBarcode(code);
    triggerScanFeedback();
    sendBarcodeToServer(code);
  };

  return (
    <div className="fixed inset-0 bg-[#0b0c12] text-slate-100 flex flex-col font-sans select-none z-50 overflow-hidden">
      {/* 캔버스 (숨김 프레임 캡처용) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 상단 네비게이션 헤더 */}
      <div className="p-3 bg-[#13141f] border-b border-[#232338] flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-2">
          {onExitMobileMode && (
            <button
              onClick={onExitMobileMode}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              스마트폰 개발 노드 브릿지
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              세션: <span className="text-blue-300 font-bold">{sessionId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
            connectionStatus === "connected" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300"
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            전송: {sendCount}프레임
          </span>
        </div>
      </div>

      {/* 메인 카메라 뷰파인더 */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover"
        />

        {/* 바코드 감지 타겟 오버레이 */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
          <div className="w-64 h-48 border-2 border-dashed border-emerald-400/50 rounded-2xl relative flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <div className="flex justify-between text-[10px] text-emerald-400 font-mono font-bold">
              <span>┌ SCAN AREA</span>
              <span>┐</span>
            </div>
            <div className="text-center text-[11px] text-emerald-300/80 bg-black/40 py-1 px-2 rounded-full mx-auto backdrop-blur-sm">
              기구물 및 바코드를 박스에 맞추세요
            </div>
            <div className="flex justify-between text-[10px] text-emerald-400 font-mono font-bold">
              <span>└</span>
              <span>┘</span>
            </div>
          </div>
        </div>

        {/* 바코드 실시간 바운딩 박스 표시 */}
        {barcodeBox && (
          <div
            className="absolute border-2 border-emerald-400 bg-emerald-400/20 rounded pointer-events-none transition-all duration-150 animate-pulse"
            style={{
              left: `${barcodeBox.x}%`,
              top: `${barcodeBox.y}%`,
              width: `${barcodeBox.w}%`,
              height: `${barcodeBox.h}%`,
            }}
          />
        )}

        {/* 카메라 제어 플로팅 오버레이 버튼들 */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {hasTorchSupport && (
            <button
              onClick={toggleTorch}
              className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${
                isTorchOn
                  ? "bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_#fbbf24]"
                  : "bg-black/60 text-white border-white/20"
              }`}
              title="조명(플래시)"
            >
              <Zap className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setFacingMode(facingMode === "environment" ? "user" : "environment")}
            className="p-2.5 rounded-full bg-black/60 text-white border border-white/20 backdrop-blur-md active:scale-95"
            title="전/후면 카메라 전환"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* 최신 인식 바코드 안내 칩 */}
        {lastScannedBarcode && (
          <div className="absolute bottom-3 left-3 right-3 bg-emerald-950/90 border border-emerald-500/40 p-2.5 rounded-xl backdrop-blur-md flex items-center justify-between text-xs shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-emerald-300 font-medium">스마트폰 바코드 인식 및 PC 전송 완료</div>
                <div className="font-mono font-bold text-white truncate max-w-[200px]">{lastScannedBarcode}</div>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">전송완료</span>
          </div>
        )}
      </div>

      {/* 하단 개발용 컨트롤 및 바코드 리더 영역 */}
      <div className="p-3 bg-[#11111a] border-t border-[#212130] space-y-2.5 shrink-0">
        {/* 스트리밍 모드 및 수동 캡처 버튼 */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setIsAutoStreaming(!isAutoStreaming)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
              isAutoStreaming
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : "bg-neutral-800 text-slate-300 border-neutral-700"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isAutoStreaming ? "animate-spin" : ""}`} />
            {isAutoStreaming ? "실시간 스트리밍 중 (ON)" : "스트리밍 일시정지 (OFF)"}
          </button>

          <button
            onClick={captureAndSendFrame}
            className="py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            단일 캡처 전송
          </button>
        </div>

        {/* 바코드 빠른 테스트 주입 & 수동 입력 */}
        <div className="space-y-1.5 pt-1 border-t border-dashed border-[#232338]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Scan className="w-3.5 h-3.5 text-blue-400" /> 바코드 수동/프리셋 전송
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handlePresetBarcode("PROD_A_01")}
                className="px-2 py-0.5 rounded bg-[#1c2230] hover:bg-blue-900/40 text-blue-300 text-[10px] font-mono border border-blue-500/20"
              >
                PROD_A_01
              </button>
              <button
                onClick={() => handlePresetBarcode("MOTOR_HOUSING")}
                className="px-2 py-0.5 rounded bg-[#1c2230] hover:bg-blue-900/40 text-blue-300 text-[10px] font-mono border border-blue-500/20"
              >
                MOTOR_H
              </button>
            </div>
          </div>

          <form onSubmit={handleManualBarcodeSubmit} className="flex gap-1.5">
            <input
              type="text"
              placeholder="직접 바코드 입력 후 전송..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 text-xs font-mono rounded-lg px-2.5 py-1.5 bg-[#0b0c12] border border-[#2c2c3e] text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1"
            >
              <Send className="w-3 h-3" /> 전송
            </button>
          </form>
        </div>

        {errorMessage && (
          <div className="text-[11px] text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-500/30 text-center">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};
