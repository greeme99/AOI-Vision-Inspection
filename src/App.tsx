import React, { useState, useEffect, useRef } from "react";
import { Cpu, Smartphone, Database, BrainCircuit, Sparkles, BarChart3, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MasterItem, InspectionHistory, ThemeStyles, CameraZoomCapabilities, DefectRecord, DefectItem } from "./types";
import { exportStandaloneHTML } from "./utils/standaloneExporter";
import { detectBarcodeFromElement } from "./utils/barcodeScanner";
import { buildEnhancedVlmPrompt } from "./utils/defectLearner";
import { playOkSound, playNgSound, setSoundEnabled } from "./utils/audioAlert";
import { LeftPanel } from "./components/LeftPanel";
import { CenterPanel } from "./components/CenterPanel";
import { RightPanel } from "./components/RightPanel";
import { SaveMasterModal, ActiveOkModal } from "./components/Modals";
import { MobileDevNode } from "./components/MobileDevNode";
import { SmartphoneBridgeModal } from "./components/SmartphoneBridgeModal";
import { DefectFeedbackModal } from "./components/DefectFeedbackModal";
import { DefectKnowledgeBaseModal } from "./components/DefectKnowledgeBaseModal";
import { DefectParetoModal } from "./components/DefectParetoModal";

// 글로벌 브라우저 전역 객체 타이핑 선언
const cv = (window as any).cv;
const tf = (window as any).tf;
const mobilenet = (window as any).mobilenet;
const XLSX = (window as any).XLSX;

export default function App() {
  // --- 스마트폰 개발/테스트 브릿지 모드 ---
  const [sessionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("session") || "dev-vlm-session";
    }
    return "dev-vlm-session";
  });
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("mode") === "mobile_node";
    }
    return false;
  });
  const [showPhoneBridgeModal, setShowPhoneBridgeModal] = useState(false);
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [phoneDeviceName, setPhoneDeviceName] = useState("");
  const [phoneFrameCount, setPhoneFrameCount] = useState(0);
  const [phoneLastBarcode, setPhoneLastBarcode] = useState("");
  const [isUsingPhoneStream, setIsUsingPhoneStream] = useState(false);
  const phoneImageElementRef = useRef<HTMLImageElement | null>(null);
  const lastPhonePullTimeRef = useRef<number>(0);

  // --- 시스템 상태 ---
  const [isLoaderReady, setIsLoaderReady] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("OpenCV.js 및 AI 라이브러리 엔진 적재 중...");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [fps, setFps] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);

  // --- 카메라 회전, 반전 및 줌(Zoom) 설정 ---
  const [cameraAngle, setCameraAngle] = useState<number>(0); // 0, 90, 180, 270
  const [isFlipped, setIsFlipped] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [zoomCapabilities, setZoomCapabilities] = useState<CameraZoomCapabilities>({
    supported: false,
    min: 1.0,
    max: 4.0,
    step: 0.1,
  });
  const [showGrid, setShowGrid] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // --- 알고리즘 계수 튜닝 및 감도 프리셋 ---
  const [currentPreset, setCurrentPreset] = useState<"precision" | "standard" | "speed" | "custom">("standard");
  const [passThreshold, setPassThreshold] = useState<number>(95);
  const [binaryThreshold, setBinaryThreshold] = useState<number>(50);
  const [deepLearningEnabled, setDeepLearningEnabled] = useState(false);
  const [dlPassThreshold, setDlPassThreshold] = useState<number>(90);

  const applyPreset = (preset: "precision" | "standard" | "speed") => {
    setCurrentPreset(preset);
    if (preset === "precision") {
      // 정밀 모드: 미세 결함/크랙/스크래치 탐지, 높은 유사도 기준, 딥러닝/VLM 풀가동
      setBinaryThreshold(35);
      setPassThreshold(97);
      setDeepLearningEnabled(true);
      setDlPassThreshold(92);
      setVlmEnabled(true);
    } else if (preset === "standard") {
      // 일반 모드: 균형 잡힌 속도와 신뢰성
      setBinaryThreshold(50);
      setPassThreshold(95);
      setDeepLearningEnabled(false);
      setDlPassThreshold(90);
      setVlmEnabled(true);
    } else if (preset === "speed") {
      // 고속 모드: 대량 고속 생산라인, 노이즈 필터링 완화, 딜레이 없는 초고속 실시간 OpenCV
      setBinaryThreshold(65);
      setPassThreshold(90);
      setDeepLearningEnabled(false);
      setDlPassThreshold(85);
      setVlmEnabled(false);
    }
  };

  const handleManualBinaryThresholdChange = (val: number) => {
    setBinaryThreshold(val);
    setCurrentPreset("custom");
  };

  const handleManualPassThresholdChange = (val: number) => {
    setPassThreshold(val);
    setCurrentPreset("custom");
  };

  // --- VLM 지능형 진단 (Smart Inspection) ---
  const [vlmEnabled, setVlmEnabled] = useState(true);
  const [vlmPrompt, setVlmPrompt] = useState(
    "조립 완료된 하우징 부위에 미세한 틈새, 뒤틀림이 있거나 표면에 스크래치, 찍힘 불량이 발견되는지 돋보기처럼 판정해 줘. 결함 원인의 상세 위치와 사유를 설명해줘."
  );
  const [vlmApiKey, setVlmApiKey] = useState("");
  const [isVlmProcessing, setIsVlmProcessing] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // --- 마스터 양품 레지스트리 ---
  const [masterList, setMasterList] = useState<Record<string, MasterItem>>({});
  const [selectedMasterName, setSelectedMasterName] = useState<string>("");
  
  // --- 결함 실시간 상태 ---
  const [detectedDefects, setDetectedDefects] = useState<Array<{ x: number; y: number; w: number; h: number; label: string }>>([]);
  const [vlmReport, setVlmReport] = useState<string>("");
  const [defectCount, setDefectCount] = useState(0);

  // --- 바코드 연동 관리 ---
  const [barcodeValue, setBarcodeValue] = useState("");
  const [extractedBarcode, setExtractedBarcode] = useState("");
  const [barcodeMatchStatus, setBarcodeMatchStatus] = useState<"READY" | "MATCHED" | "NOT_FOUND">("READY");

  // --- 누적 통계 모니터링 ---
  const [stats, setStats] = useState({ total: 0, ok: 0, ng: 0 });
  const [historyList, setHistoryList] = useState<InspectionHistory[]>([]);
  const [simHistory, setSimHistory] = useState<number[]>([]);

  // --- 이미지 저장 폴더 연동 ---
  const [saveFolderHandle, setSaveFolderHandle] = useState<any>(null);
  const [saveFolderName, setSaveFolderName] = useState("");

  // --- 모달 제어 ---
  const [showSaveMasterModal, setShowSaveMasterModal] = useState(false);
  const [newMasterName, setNewMasterName] = useState("");
  const [activeOkModal, setActiveOkModal] = useState(false);

  // --- 불량 유형 DB 및 자가 학습 상태 ---
  const [defectList, setDefectList] = useState<DefectRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aoi_defect_db");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });
  const [showDefectFeedbackModal, setShowDefectFeedbackModal] = useState(false);
  const [showDefectKnowledgeBaseModal, setShowDefectKnowledgeBaseModal] = useState(false);
  const [showParetoModal, setShowParetoModal] = useState(false);
  const [isSoundAlertEnabled, setIsSoundAlertEnabled] = useState(true);
  const [defectCandidate, setDefectCandidate] = useState<{
    id: string;
    time: string;
    serial: string;
    barcode: string;
    imageUrl: string;
    similarityCV: number;
    similarityAI?: number;
    aiReason?: string;
    defects?: DefectItem[];
  } | null>(null);
  const [isAiLearning, setIsAiLearning] = useState(false);

  // 사운드 알람 토글
  const toggleSoundAlert = () => {
    const next = !isSoundAlertEnabled;
    setIsSoundAlertEnabled(next);
    setSoundEnabled(next);
    if (next) {
      playOkSound();
    }
  };

  // 불량 DB 백업 및 AI 학습 파이프라인 등록 핸들러
  const handleBackupAndLearnDefect = (record: DefectRecord) => {
    const updated = [record, ...defectList.filter(d => d.id !== record.id)].slice(0, 200);
    setDefectList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("aoi_defect_db", JSON.stringify(updated));
    }
    // VLM 지능형 프롬프트에 불량 이력 피드백 자가 인젝션
    const enhanced = buildEnhancedVlmPrompt(vlmPrompt, updated);
    setVlmPrompt(enhanced.prompt);

    // 판정 홀딩 해제 후 검사 재개
    setTimeout(() => {
      isFrozenRef.current = false;
      setIsInspecting(true);
    }, 1000);
  };

  // 작업자 양품 오탐 정정(False Positive Override) 핸들러
  const handleOverrideFalsePositive = (id: string) => {
    setStats(prev => ({
      ...prev,
      ok: prev.ok + 1,
      ng: Math.max(0, prev.ng - 1),
    }));
    setHistoryList(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              result: "OK",
              reason: `(작업자 수동 승인) ${item.reason || ""}`,
            }
          : item
      )
    );
    // 판정 홀딩 해제
    setTimeout(() => {
      isFrozenRef.current = false;
      setIsInspecting(true);
    }, 800);
  };

  // 불량 DB 레코드 삭제
  const handleDeleteDefect = (id: string) => {
    const updated = defectList.filter(d => d.id !== id);
    setDefectList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("aoi_defect_db", JSON.stringify(updated));
    }
  };

  // 수동 AI 불량 지식 학습(Active Learning) 실행
  const handleTriggerLearnAi = () => {
    setIsAiLearning(true);
    setTimeout(() => {
      const enhanced = buildEnhancedVlmPrompt(vlmPrompt, defectList);
      setVlmPrompt(enhanced.prompt);
      setIsAiLearning(false);
    }, 1200);
  };

  // --- 캔버스 및 미디어 참조 ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- ROI 및 인터랙션 내부 데이터 ---
  const roiRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const [roiState, setRoiState] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [drawingMode, setDrawingMode] = useState<"none" | "rect" | "auto">("none");
  const isDrawingROIRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // --- 내부 판정 안정화 상태머신 ---
  const stableFramesRef = useRef(0);
  const continuousOkFramesRef = useRef(0);
  const [continuousOkFrames, setContinuousOkFrames] = useState(0);
  const isFrozenRef = useRef(false);
  const trackingPointRef = useRef({ x: 0, y: 0, found: false });

  // --- DL Model 임베딩용 내부 참조 ---
  const dlModelRef = useRef<any>(null);
  const [isDlLoaded, setIsDlLoaded] = useState(false);

  // --- 로컬 캐시 마스터 매트(OpenCV) ---
  const masterMatRef = useRef<any>(null);
  const roiMaskRef = useRef<any>(null);
  const roiModeRef = useRef<"rect" | "auto_contour">("rect");
  const roiContoursRef = useRef<Array<{ x: number; y: number }>>([]);
  const masterImageBlobDataRef = useRef<Blob | null>(null);

  // --- 1. 라이브러리 검출 및 에지 하드웨어 상태 초기화 ---
  useEffect(() => {
    let checkAttempts = 0;
    const loaderInterval = setInterval(() => {
      checkAttempts++;
      if (typeof (window as any).cv !== "undefined" && (window as any).cv.Mat) {
        clearInterval(loaderInterval);
        setLoaderMessage("OpenCV.js WASM 기동 성공. 이어서 딥러닝 임베딩 엔진(TFJS) 완비 중...");
        
        // MobileNet 로딩
        if (typeof (window as any).mobilenet !== "undefined") {
          (window as any).mobilenet.load({ version: 2, alpha: 1.0 }).then((model: any) => {
            dlModelRef.current = model;
            setIsDlLoaded(true);
            setIsLoaderReady(true);
            initSystemEnvironment();
          }).catch((err: any) => {
            console.error("TFJS MobileNet 적재 실패:", err);
            setIsLoaderReady(true);
            initSystemEnvironment();
          });
        } else {
          setIsLoaderReady(true);
          initSystemEnvironment();
        }
      } else if (checkAttempts > 50) {
        clearInterval(loaderInterval);
        setLoaderMessage("OpenCV Engine 타임아웃. 네트웍 연결망과 스크립트 도메인 권한을 검토하세요.");
      }
    }, 200);

    // 로컬 스토리지 데이터 백업 복원
    try {
      const savedConfig = localStorage.getItem("VLM_AOI_SETTINGS_V2");
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.passThreshold) setPassThreshold(Number(config.passThreshold));
        if (config.binaryThreshold) setBinaryThreshold(Number(config.binaryThreshold));
        if (config.deepLearningEnabled) setDeepLearningEnabled(Boolean(config.deepLearningEnabled));
        if (config.dlPassThreshold) setDlPassThreshold(Number(config.dlPassThreshold));
        if (config.vlmEnabled) setVlmEnabled(Boolean(config.vlmEnabled));
        if (config.vlmPrompt) setVlmPrompt(config.vlmPrompt);
        if (config.vlmApiKey) setVlmApiKey(config.vlmApiKey);
        if (config.registry) setMasterList(config.registry);
        if (config.stats) setStats(config.stats);
        if (config.theme) setTheme(config.theme);
        if (config.historyList) {
          setHistoryList(config.historyList);
          // 히스토리 유사도 수집
          const simList = config.historyList.slice(-20).map((h: any) => Number(h.similarityCV));
          setSimHistory(simList);
        }
      }
    } catch (e) {
      console.warn("로컬 설정 복원 중 무시 가능한 예외 발생:", e);
    }

    return () => {
      clearInterval(loaderInterval);
    };
  }, []);

  const initSystemEnvironment = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        // 스마트폰 후면 카메라가 있으면 우선 선택
        const backCam = videoDevices.find(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("후면") || d.label.toLowerCase().includes("environment"));
        setSelectedCamera(backCam ? backCam.deviceId : videoDevices[0].deviceId);
      }
    } catch (err) {
      console.warn("로컬 미디어 입출력 장치 검색 불능:", err);
    }
  };

  // --- 스마트폰 브릿지 실시간 폴링 및 자동 수신 ---
  useEffect(() => {
    if (isMobileMode) return; // 모바일 노드 모드일 때는 PC 폴링 불필요

    const bridgeInterval = setInterval(async () => {
      try {
        const since = lastPhonePullTimeRef.current;
        const res = await fetch(`/api/dev-bridge/pull?sessionId=${encodeURIComponent(sessionId)}&since=${since}`);
        if (!res.ok) return;
        const data = await res.json();

        setPhoneConnected(Boolean(data.connected));
        if (data.deviceName) setPhoneDeviceName(data.deviceName);

        if (data.lastUpdatedAt && data.lastUpdatedAt > lastPhonePullTimeRef.current) {
          lastPhonePullTimeRef.current = data.lastUpdatedAt;
        }

        // 1. 스마트폰에서 바코드 수신 감지 시 자동 주입
        if (data.barcode) {
          setPhoneLastBarcode(data.barcode);
          applyBarcode(data.barcode);
          // 서버에 수신 완료 통보
          fetch("/api/dev-bridge/clear-barcode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          }).catch(() => {});
        }

        // 2. 스마트폰에서 비디오 프레임 수신 시 주입
        if (data.frameImage) {
          setPhoneFrameCount(prev => prev + 1);
          if (isUsingPhoneStream) {
            if (!phoneImageElementRef.current) {
              phoneImageElementRef.current = new Image();
            }
            phoneImageElementRef.current.onload = () => {
              renderPhoneFrameToCanvas();
            };
            phoneImageElementRef.current.src = data.frameImage;
          }
        }
      } catch (e) {
        // 백엔드 통신 오류 무시
      }
    }, 350);

    return () => clearInterval(bridgeInterval);
  }, [sessionId, isMobileMode, isUsingPhoneStream, masterList]);

  // 스마트폰 프레임을 PC 캔버스에 렌더링하고 비전 루프 연결
  const renderPhoneFrameToCanvas = () => {
    if (!phoneImageElementRef.current || !outputCanvasRef.current) return;
    const img = phoneImageElementRef.current;
    if (img.width === 0 || img.height === 0) return;

    if (!isCameraActive) {
      setIsCameraActive(true);
    }

    const canvas = outputCanvasRef.current;
    if (canvas.width !== img.width || canvas.height !== img.height) {
      canvas.width = img.width;
      canvas.height = img.height;
      if (roiRef.current.w === 0) {
        roiRef.current = {
          x: Math.round(img.width * 0.1),
          y: Math.round(img.height * 0.1),
          w: Math.round(img.width * 0.8),
          h: Math.round(img.height * 0.8),
        };
        setRoiState({ ...roiRef.current });
      }
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // 스마트폰 프레임 수신 시 비전 분석 또는 오버레이 렌더링
      if (isInspecting && (masterMatRef.current || Object.keys(masterList).length > 0)) {
        analyzeFrame(ctx);
      } else {
        drawUserOverlay(ctx);
      }
    }
  };

  // --- 바코드 공통 처리 및 품목 자동 선택 ---
  const applyBarcode = (val: string) => {
    const cleanVal = val.trim();
    setBarcodeValue(cleanVal);

    let modelCode = cleanVal;
    if (cleanVal.length >= 14) {
      modelCode = cleanVal.substring(4, 14);
    } else if (cleanVal.includes("_")) {
      modelCode = cleanVal;
    }
    setExtractedBarcode(modelCode);

    // 1. 완벽 일치 검색
    if (masterList[modelCode]) {
      setBarcodeMatchStatus("MATCHED");
      handleSelectMasterChange(modelCode);
    } else {
      // 2. 부분 일치 검색
      const matchedKey = Object.keys(masterList).find(
        k => k.toLowerCase().includes(modelCode.toLowerCase()) || modelCode.toLowerCase().includes(k.toLowerCase())
      );
      if (matchedKey) {
        setBarcodeMatchStatus("MATCHED");
        handleSelectMasterChange(matchedKey);
      } else {
        setBarcodeMatchStatus("NOT_FOUND");
      }
    }
  };

  // --- 2. 로컬 스토리지에 세팅 자동 동기화 ---
  const persistSettings = (
    updatedMasterList = masterList, 
    updatedStats = stats, 
    updatedHistory = historyList,
    updatedTheme = theme
  ) => {
    try {
      const configObj = {
        passThreshold,
        binaryThreshold,
        deepLearningEnabled,
        dlPassThreshold,
        vlmEnabled,
        vlmPrompt,
        vlmApiKey,
        registry: updatedMasterList,
        stats: updatedStats,
        historyList: updatedHistory,
        theme: updatedTheme
      };
      localStorage.setItem("VLM_AOI_SETTINGS_V2", JSON.stringify(configObj));
    } catch (e) {
      console.warn("용량 제한으로 설정 동기화 패스:", e);
    }
  };

  // --- 3. 실시간 카메라 연결 핸들러 ---
  const toggleCamera = async () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      await startCamera(selectedCamera);
    }
  };

  const startCamera = async (deviceId: string) => {
    if (!videoRef.current) return;
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } } : { width: { ideal: 640 }, height: { ideal: 480 } }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;

      // 카메라 트랙의 하드웨어 줌 지원 여부 분석
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = typeof (videoTrack as any).getCapabilities === "function" ? (videoTrack as any).getCapabilities() : null;
        if (capabilities && capabilities.zoom) {
          const zMin = Number(capabilities.zoom.min) || 1.0;
          const zMax = Number(capabilities.zoom.max) || 5.0;
          const zStep = Number(capabilities.zoom.step) || 0.1;
          setZoomCapabilities({
            supported: true,
            min: zMin,
            max: zMax,
            step: zStep,
          });
          const settings: any = typeof (videoTrack as any).getSettings === "function" ? (videoTrack as any).getSettings() : null;
          if (settings && settings.zoom) {
            setZoomLevel(settings.zoom);
          } else {
            setZoomLevel(zMin);
          }
        } else {
          // 하드웨어 줌 미지원 장치: 디지털 줌 스케일링 기본 제공
          setZoomCapabilities({
            supported: false,
            min: 1.0,
            max: 4.0,
            step: 0.1,
          });
        }
      }

      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
        setIsCameraActive(true);
        // 비전 연쇄 프로세스 기동
        setupCanvasDimensions();
        requestAnimationFrame(inspectionLoop);
      };
    } catch (err) {
      alert("카메라 장치 연결 실패. 호스트 장치 소켓 권한을 확인하세요.");
    }
  };

  const handleZoomChange = async (val: number) => {
    setZoomLevel(val);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (track && zoomCapabilities.supported) {
        try {
          await (track as any).applyConstraints({
            advanced: [{ zoom: val }],
          });
        } catch (e) {
          console.warn("카메라 트랙 줌 제약 적용 실패 (소프트웨어 줌으로 대체):", e);
        }
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsInspecting(false);
  };

  const setupCanvasDimensions = () => {
    if (!videoRef.current || !outputCanvasRef.current) return;
    const vW = videoRef.current.videoWidth || 640;
    const vH = videoRef.current.videoHeight || 480;

    // 회전값에 따라 출력 캔버스 스펙 동적 치환
    if (cameraAngle === 90 || cameraAngle === 270) {
      outputCanvasRef.current.width = vH;
      outputCanvasRef.current.height = vW;
    } else {
      outputCanvasRef.current.width = vW;
      outputCanvasRef.current.height = vH;
    }

    if (roiRef.current.w === 0) {
      roiRef.current = { 
        x: Math.round(outputCanvasRef.current.width * 0.1), 
        y: Math.round(outputCanvasRef.current.height * 0.1), 
        w: Math.round(outputCanvasRef.current.width * 0.8), 
        h: Math.round(outputCanvasRef.current.height * 0.8) 
      };
      setRoiState({ ...roiRef.current });
    }
  };

  useEffect(() => {
    if (isCameraActive) {
      setupCanvasDimensions();
    }
  }, [cameraAngle]);

  // --- 4. 딥러닝 임베딩(Cosine Similarity) ---
  const calculateDLEmbedding = (canvas: HTMLCanvasElement): number[] | null => {
    if (!isDlLoaded || !dlModelRef.current) return null;
    try {
      const tensor = tf.browser.fromPixels(canvas);
      const embedding = dlModelRef.current.infer(tensor, true);
      const arr = Array.from(embedding.dataSync()) as number[];
      tensor.dispose();
      embedding.dispose();
      return arr;
    } catch (e) {
      console.warn("임베딩 백본 에러:", e);
      return null;
    }
  };

  // --- 5. 실시간 비전 및 전처리 루프 ---
  const lastLoopTimeRef = useRef(performance.now());
  
  const inspectionLoop = () => {
    if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
    
    const now = performance.now();
    const gap = now - lastLoopTimeRef.current;
    lastLoopTimeRef.current = now;
    setFps(Math.round(1000 / gap));

    try {
      if (!isFrozenRef.current) {
        performRealtimeVisionProcessing();
      }
    } catch (e) {
      console.error("비전 가공 프레임 에러:", e);
    }

    if (isCameraActive) {
      requestAnimationFrame(inspectionLoop);
    }
  };

  const performRealtimeVisionProcessing = () => {
    const mainCtx = outputCanvasRef.current?.getContext("2d", { willReadFrequently: true });
    if (!mainCtx || !outputCanvasRef.current || !videoRef.current) return;
    const outW = outputCanvasRef.current.width;
    const outH = outputCanvasRef.current.height;

    // 1) 캔버스 투영 (기하학적 트랜스폼 반영)
    mainCtx.save();
    mainCtx.clearRect(0, 0, outW, outH);
    mainCtx.translate(outW / 2, outH / 2);
    if (isFlipped) {
      mainCtx.scale(-1, 1);
    }
    mainCtx.rotate((cameraAngle * Math.PI) / 180);
    // 하드웨어 미디어 트랙 줌 미지원 시 소프트웨어 디지털 줌 스케일링 연계
    if (!zoomCapabilities.supported && zoomLevel > 1.0) {
      mainCtx.scale(zoomLevel, zoomLevel);
    }
    mainCtx.drawImage(
      videoRef.current, 
      -videoRef.current.videoWidth / 2, 
      -videoRef.current.videoHeight / 2, 
      videoRef.current.videoWidth, 
      videoRef.current.videoHeight
    );
    mainCtx.restore();

    // 격자가이드 라인 가시화
    if (showGrid) {
      mainCtx.strokeStyle = "rgba(0, 245, 255, 0.15)";
      mainCtx.lineWidth = 1;
      // 가로 가이드
      for (let i = 1; i < 6; i++) {
        mainCtx.beginPath();
        mainCtx.moveTo(0, (outH / 6) * i);
        mainCtx.lineTo(outW, (outH / 6) * i);
        mainCtx.stroke();
      }
      // 세로 가이드
      for (let i = 1; i < 8; i++) {
        mainCtx.beginPath();
        mainCtx.moveTo((outW / 8) * i, 0);
        mainCtx.lineTo((outW / 8) * i, outH);
        mainCtx.stroke();
      }
    }

    // 2) 검사 활성화 시 정밀 분석 연쇄 기동
    if (isInspecting && (masterMatRef.current || Object.keys(masterList).length > 0)) {
      analyzeFrame(mainCtx);
    } else {
      drawUserOverlay(mainCtx);
    }
  };

  const analyzeFrame = (ctx2d: CanvasRenderingContext2D) => {
    const startTime = performance.now();
    const outW = outputCanvasRef.current!.width;
    const outH = outputCanvasRef.current!.height;

    // 1) OpenCV Mat 생성
    const imgData = ctx2d.getImageData(0, 0, outW, outH);
    const src = new cv.Mat(outH, outW, cv.CV_8UC4);
    src.data.set(imgData.data);

    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

    // 하이브리드 검사 대상 양품 확보
    let targetMasterMat = masterMatRef.current;
    let targetRoi = roiRef.current;
    let targetRoiMode = roiModeRef.current;
    let targetMask = roiMaskRef.current;

    // 만약 다중 로디드 상태이고, 매칭 대상이 바코드로 정립되었다면 해당 객체 우선 대입
    if (selectedMasterName && masterList[selectedMasterName]) {
      const activeEntry = masterList[selectedMasterName];
      targetRoi = activeEntry.savedRoi;
      targetRoiMode = activeEntry.roiMode;
    }

    if (!targetMasterMat || targetMasterMat.cols <= 0) {
      src.delete(); gray.delete();
      return;
    }

    // 2) 현재 프레임의 지정 ROI 자르기
    const rx = Math.max(0, Math.min(Math.round(targetRoi.x), gray.cols - 1));
    const ry = Math.max(0, Math.min(Math.round(targetRoi.y), gray.rows - 1));
    const rw = Math.max(2, Math.min(Math.round(targetRoi.w), gray.cols - rx));
    const rh = Math.max(2, Math.min(Math.round(targetRoi.h), gray.rows - ry));

    const roiRect = new cv.Rect(rx, ry, rw, rh);
    const frameRoiPatch = gray.roi(roiRect);

    // 양품 템플릿과 현재 ROI간 크기 균질 정합
    const mW = targetMasterMat.cols;
    const mH = targetMasterMat.rows;
    const resizedFramePatch = new cv.Mat();
    if (rw !== mW || rh !== mH) {
      cv.resize(frameRoiPatch, resizedFramePatch, new cv.Size(mW, mH), 0, 0, cv.INTER_LINEAR);
    } else {
      frameRoiPatch.copyTo(resizedFramePatch);
    }

    // 3) 패턴 유사도 상관계수(TM_CCOEFF_NORMED) 연산
    let patternScore = 100;
    try {
      const matchResult = new cv.Mat();
      cv.matchTemplate(resizedFramePatch, targetMasterMat, matchResult, cv.TM_CCOEFF_NORMED);
      const mm = cv.minMaxLoc(matchResult);
      patternScore = Math.max(0, mm.maxVal * 100);
      matchResult.delete();
    } catch (err) {
      patternScore = 50;
    }

    // 4) 픽셀 AbsDiff 미세 결함 마스크 연출
    const diffMat = new cv.Mat();
    cv.absdiff(targetMasterMat, resizedFramePatch, diffMat);

    // 자석 ROI 마스크 적용
    if (targetRoiMode === "auto_contour" && targetMask && targetMask.cols === diffMat.cols && targetMask.rows === diffMat.rows) {
      const maskedDiff = new cv.Mat();
      cv.bitwise_and(diffMat, targetMask, maskedDiff);
      diffMat.delete();
      cv.GaussianBlur(maskedDiff, diffMat, new cv.Size(3, 3), 0);
    }

    // 이진화 거름망 통과
    const binaryMat = new cv.Mat();
    cv.threshold(diffMat, binaryMat, binaryThreshold, 255, cv.THRESH_BINARY);

    // 5) 미세 이물/불량 노이즈 외곽선 검출
    const contoursList = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(binaryMat, contoursList, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const detectedLocals: Array<{ x: number; y: number; w: number; h: number; label: string }> = [];
    let defectPixTotal = 0;

    for (let i = 0; i < contoursList.size(); ++i) {
      const cnt = contoursList.get(i);
      const area = cv.contourArea(cnt);
      if (area > 30) { // 검출 역치
        defectPixTotal += area;
        const bRect = cv.boundingRect(cnt);
        
        // 원본 캔버스 좌표 조대 환산
        const ratioX = rw / mW;
        const ratioY = rh / mH;
        detectedLocals.push({
          x: Math.round(rx + bRect.x * ratioX),
          y: Math.round(ry + bRect.y * ratioY),
          w: Math.round(bRect.width * ratioX),
          h: Math.round(bRect.height * ratioY),
          label: "변화"
        });
      }
      cnt.delete();
    }

    setDetectedDefects(detectedLocals);
    setDefectCount(detectedLocals.length);

    // 서브 채널 캔버스(실시간 픽셀 차이 디스플레이)에 이진화 결함 매트 투사
    if (diffCanvasRef.current) {
      const subCtx = diffCanvasRef.current.getContext("2d");
      if (subCtx) {
        diffCanvasRef.current.width = mW;
        diffCanvasRef.current.height = mH;
        const diffImgData = subCtx.createImageData(mW, mH);
        
        const dataU8 = binaryMat.data;
        for (let idx = 0; idx < dataU8.length; idx++) {
          const val = dataU8[idx];
          const offset = idx * 4;
          if (val > 100) {
            diffImgData.data[offset] = 239;     // R
            diffImgData.data[offset + 1] = 68;  // G
            diffImgData.data[offset + 2] = 68;  // B
            diffImgData.data[offset + 3] = 230; // A
          } else {
            diffImgData.data[offset] = 15;
            diffImgData.data[offset + 1] = 15;
            diffImgData.data[offset + 2] = 25;
            diffImgData.data[offset + 3] = 180;
          }
        }
        subCtx.putImageData(diffImgData, 0, 0);
      }
    }

    // 픽셀 표면 비매칭 스코어 계량화
    const defectRatio = (defectPixTotal / (mW * mH)) * 100;
    const surfaceScore = Math.max(0, 100 - defectRatio * 2);

    const finalSimValue = Math.round(Math.min(patternScore, surfaceScore) * 10) / 10;
    const isOK = finalSimValue >= passThreshold;

    setProcessingTime(Math.round(performance.now() - startTime));

    trackingPointRef.current = { x: rx, y: ry, found: true };

    stableFramesRef.current++;

    if (isOK) {
      continuousOkFramesRef.current++;
    } else {
      continuousOkFramesRef.current = 0;
    }
    setContinuousOkFrames(continuousOkFramesRef.current);

    // 전사적 판정 확고화
    if (stableFramesRef.current >= 5) {
      drawAdvancedOverlay(ctx2d, rx, ry, rw, rh, finalSimValue, isOK);
      commitInspectionDecision(isOK, finalSimValue);
    } else {
      ctx2d.strokeStyle = "#ffeb3b";
      ctx2d.lineWidth = 1.5;
      ctx2d.strokeRect(rx, ry, rw, rh);
    }

    src.delete(); gray.delete(); frameRoiPatch.delete();
    resizedFramePatch.delete(); diffMat.delete(); binaryMat.delete();
    contoursList.delete(); hierarchy.delete();
  };

  // --- 6. 실시간 정밀 안내 가이드라인 렌더러 ---
  const drawUserOverlay = (ctx2d: CanvasRenderingContext2D) => {
    const rx = roiState.x;
    const ry = roiState.y;
    const rw = roiState.w;
    const rh = roiState.h;

    if (drawingMode === "auto" && roiContoursRef.current.length > 2) {
      ctx2d.beginPath();
      ctx2d.moveTo(roiContoursRef.current[0].x, roiContoursRef.current[0].y);
      for (let i = 1; i < roiContoursRef.current.length; i++) {
        ctx2d.lineTo(roiContoursRef.current[i].x, roiContoursRef.current[i].y);
      }
      ctx2d.closePath();
      ctx2d.strokeStyle = "#a855f7";
      ctx2d.lineWidth = 3;
      ctx2d.stroke();

      ctx2d.strokeStyle = "rgba(168, 85, 247, 0.25)";
      ctx2d.setLineDash([4, 4]);
      ctx2d.strokeRect(rx, ry, rw, rh);
      ctx2d.setLineDash([]);
      drawTargetLabel(ctx2d, "Smart Contour ROI", rx, ry - 6, "#a855f7");
    } else {
      ctx2d.strokeStyle = "#3b82f6";
      ctx2d.lineWidth = 2;
      ctx2d.strokeRect(rx, ry, rw, rh);
      drawTargetLabel(ctx2d, "Inspection Area ROI", rx, ry - 6, "#3b82f6");
    }

    // 실시간 드래그 형상 가시화
    if (isDrawingROIRef.current && dragStartRef.current) {
      ctx2d.strokeStyle = "rgba(234, 179, 8, 0.75)";
      ctx2d.setLineDash([6, 6]);
      ctx2d.strokeRect(
        dragStartRef.current.x,
        dragStartRef.current.y,
        roiState.x - dragStartRef.current.x,
        roiState.y - dragStartRef.current.y
      );
      ctx2d.setLineDash([]);
    }
  };

  const drawAdvancedOverlay = (
    ctx2d: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number,
    similarity: number, isOK: boolean
  ) => {
    const color = isOK ? "#10b981" : "#ef4444";
    ctx2d.strokeStyle = color;
    ctx2d.lineWidth = 3;
    ctx2d.strokeRect(rx, ry, rw, rh);

    drawTargetLabel(ctx2d, `Active ROI - CV Match: ${similarity}%`, rx, ry - 6, color);

    detectedDefects.forEach(defect => {
      ctx2d.strokeStyle = "#f59e0b";
      ctx2d.lineWidth = 1.5;
      ctx2d.strokeRect(defect.x, defect.y, defect.w, defect.h);
      ctx2d.fillStyle = "rgba(245, 158, 11, 0.1)";
      ctx2d.fillRect(defect.x, defect.y, defect.w, defect.h);
    });

    if (vlmEnabled && detectedDefects.length > 0) {
      detectedDefects.forEach((defect) => {
        if (defect.label !== "변화") {
          ctx2d.strokeStyle = "#d946ef";
          ctx2d.lineWidth = 2;
          ctx2d.strokeRect(defect.x, defect.y, defect.w, defect.h);
          drawTargetLabel(ctx2d, `${defect.label}`, defect.x, defect.y - 4, "#d946ef", "10px");
        }
      });
    }
  };

  const drawTargetLabel = (
    ctx2d: CanvasRenderingContext2D, text: string, x: number, y: number,
    color: string, fontSize = "12px"
  ) => {
    ctx2d.save();
    ctx2d.font = `bold ${fontSize} 'Spline Sans Mono', monospace`;
    const labelW = ctx2d.measureText(text).width + 10;
    ctx2d.fillStyle = color;
    ctx2d.fillRect(x, y - 14, labelW, 16);
    ctx2d.fillStyle = "#ffffff";
    ctx2d.fillText(text, x + 5, y - 2);
    ctx2d.restore();
  };

  // --- 7. 판정 머신 최종 결정 커밋 ---
  const commitInspectionDecision = async (isOK: boolean, similarity: number) => {
    if (isFrozenRef.current) return;

    if (isOK && continuousOkFramesRef.current < 20) {
      return; 
    }

    isFrozenRef.current = true;
    setIsInspecting(false); // 가공은 돌리되 판정 홀딩

    const updateStats = {
      total: stats.total + 1,
      ok: stats.ok + (isOK ? 1 : 0),
      ng: stats.ng + (isOK ? 0 : 1),
    };
    setStats(updateStats);

    const dateObj = new Date();
    const timeStr = dateObj.toLocaleTimeString("ko-KR", { hour12: false }) + `.${String(dateObj.getMilliseconds()).padStart(3, "0")}`;
    const uniqueId = `AOI-${Date.now()}`;
    
    const updatedSimHistory = [...simHistory, similarity].slice(-20);
    setSimHistory(updatedSimHistory);

    let aiReason = "";
    let finalOK = isOK;
    let computedAISimilarity = undefined;

    if (vlmEnabled) {
      setIsVlmProcessing(true);
      try {
        const cap64 = outputCanvasRef.current!.toDataURL("image/jpeg", 0.85);
        const vlmResult = await callVlmAIApi(cap64, vlmPrompt);
        
        if (vlmResult) {
          aiReason = vlmResult.reason;
          computedAISimilarity = vlmResult.confidence;
          if (vlmResult.result === "NG") {
            finalOK = false; 
          }
          setVlmReport(vlmResult.reason);
          
          if (vlmResult.defects && vlmResult.defects.length > 0) {
            const outW = outputCanvasRef.current!.width;
            const outH = outputCanvasRef.current!.height;
            const absoluteDefects = vlmResult.defects.map((def: any) => ({
              x: Math.round((def.x / 100) * outW - ((def.w / 100) * outW) / 2),
              y: Math.round((def.y / 100) * outH - ((def.h / 100) * outH) / 2),
              w: Math.round((def.w / 100) * outW),
              h: Math.round((def.h / 100) * outH),
              label: `${def.label} (${vlmResult.confidence}%)`
            }));
            setDetectedDefects(absoluteDefects);
            setDefectCount(absoluteDefects.length);
          }
        }
      } catch (err: any) {
        aiReason = `VLM 진단 채널 전송 지연: ${err.message || err}`;
      }
      setIsVlmProcessing(false);
    }

    // 결함 레이블 목록 수집
    const currentDefectLabels: string[] = [];
    if (detectedDefects.length > 0) {
      detectedDefects.forEach(d => {
        if (d.label && !currentDefectLabels.includes(d.label)) {
          currentDefectLabels.push(d.label);
        }
      });
    }

    const newHistory: InspectionHistory = {
      id: uniqueId,
      time: timeStr,
      barcode: extractedBarcode || "NON-BARCODE",
      serial: `#${String(updateStats.total).padStart(4, "0")}`,
      result: finalOK ? "OK" : "NG",
      similarityCV: similarity,
      similarityAI: computedAISimilarity,
      reason: aiReason,
      defects: detectedDefects.length > 0 ? [...detectedDefects] : undefined,
      defectLabels: currentDefectLabels.length > 0 ? currentDefectLabels : undefined,
    };

    const updatedHistory = [newHistory, ...historyList].slice(0, 100);
    setHistoryList(updatedHistory);
    persistSettings(masterList, updateStats, updatedHistory);

    if (finalOK) {
      playOkSound(); // 🔔 합격(OK) 화음 차임음 재생

      outputCanvasRef.current!.toBlob(async (blob) => {
        if (blob) {
          masterImageBlobDataRef.current = blob;
          await saveCapturedImage(blob, uniqueId);
        }
      }, "image/jpeg", 0.90);

      setActiveOkModal(true);
    } else {
      playNgSound(); // 🚨 불합격(NG) 2회 경고 비프음 재생

      // 🚨 불량(NG) 발생 시: 불량 캔버스 스냅샷 캡처 및 불량 피드백 & DB 백업 모달 즉시 기동
      let defectSnapshotUrl = "";
      if (outputCanvasRef.current) {
        defectSnapshotUrl = outputCanvasRef.current.toDataURL("image/jpeg", 0.90);
        outputCanvasRef.current.toBlob(async (blob) => {
          if (blob) {
            await saveCapturedImage(blob, `DEFECT_${uniqueId}`);
          }
        }, "image/jpeg", 0.90);
      }

      setDefectCandidate({
        id: uniqueId,
        time: timeStr,
        serial: `#${String(updateStats.total).padStart(4, "0")}`,
        barcode: extractedBarcode || "NON-BARCODE",
        imageUrl: defectSnapshotUrl,
        similarityCV: similarity,
        similarityAI: computedAISimilarity,
        aiReason: aiReason,
        defects: detectedDefects.length > 0 ? [...detectedDefects] : undefined,
      });

      setShowDefectFeedbackModal(true);
    }
  };

  const callVlmAIApi = async (base64Image: string, promptText: string) => {
    if (vlmApiKey) {
      try {
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const genApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${vlmApiKey}`;
        const requestBody = {
          contents: [
            {
              parts: [
                { text: `당신은 자동 광학 검사(AOI) 비전 AI 시스템입니다. 다음 이미지의 결함을 정밀 분석하여 판정 결과를 지정된 JSON스키마 형식으로 출력해 주십시오. 프롬프트: ${promptText}` },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                result: { type: "STRING" },
                reason: { type: "STRING" },
                confidence: { type: "INTEGER" },
                defects: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      x: { type: "INTEGER" },
                      y: { type: "INTEGER" },
                      w: { type: "INTEGER" },
                      h: { type: "INTEGER" },
                      label: { type: "STRING" }
                    },
                    required: ["x", "y", "w", "h", "label"]
                  }
                }
              },
              required: ["result", "reason", "confidence", "defects"]
            }
          }
        };

        const response = await fetch(genApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });
        const resJson = await response.json();
        if (resJson.candidates?.[0]?.content?.parts?.[0]?.text) {
          return JSON.parse(resJson.candidates[0].content.parts[0].text);
        }
      } catch (err) {
        console.warn("로컬 브라우저 디렉트 VLM 전송 트러블:", err);
      }
    }

    try {
      const response = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          prompt: promptText
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err: any) {
      console.error("서버 VLM 연동 에러:", err);
      return {
        result: "NG",
        reason: `VLM 연동 실패: ${err.message || err}. API Key 설정 상태를 확인해 주세요.`,
        confidence: 50,
        defects: []
      };
    }
  };

  const saveCapturedImage = async (blob: Blob, code: string) => {
    const filename = `AOI_OK_${code}.jpg`;
    if (saveFolderHandle) {
      try {
        const fileHandle = await saveFolderHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (e) {
        console.warn("액세스 폴더 세이브 거부됨. 다운로드 포트로 바이패스.");
      }
    }

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 8. ROI 드래그 마우스 이벤트 바인딩 ---
  const handleRoiMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode === "none" || !outputCanvasRef.current) return;
    const rect = outputCanvasRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const scaleX = outputCanvasRef.current.width / rect.width;
    const scaleY = outputCanvasRef.current.height / rect.height;

    const canvasX = Math.round(isFlipped ? (rect.width - rawX) * scaleX : rawX * scaleX);
    const canvasY = Math.round(rawY * scaleY);

    dragStartRef.current = { x: canvasX, y: canvasY };
    setRoiState({ x: canvasX, y: canvasY, w: 2, h: 2 });
    isDrawingROIRef.current = true;
  };

  const handleRoiMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingROIRef.current || !dragStartRef.current || !outputCanvasRef.current) return;
    const rect = outputCanvasRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const scaleX = outputCanvasRef.current.width / rect.width;
    const scaleY = outputCanvasRef.current.height / rect.height;

    const canvasX = Math.round(isFlipped ? (rect.width - rawX) * scaleX : rawX * scaleX);
    const canvasY = Math.round(rawY * scaleY);

    setRoiState(prev => ({
      ...prev,
      w: canvasX - dragStartRef.current!.x,
      h: canvasY - dragStartRef.current!.y
    }));
  };

  const handleRoiMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingROIRef.current || !dragStartRef.current) return;
    isDrawingROIRef.current = false;

    const rx = Math.min(dragStartRef.current.x, roiState.x);
    const ry = Math.min(dragStartRef.current.y, roiState.y);
    const rw = Math.max(8, Math.abs(roiState.w));
    const rh = Math.max(8, Math.abs(roiState.h));

    const finalRoi = { x: rx, y: ry, w: rw, h: rh };
    roiRef.current = finalRoi;
    setRoiState(finalRoi);

    if (drawingMode === "auto") {
      performSmartContourExtraction(finalRoi);
    } else {
      roiModeRef.current = "rect";
      if (roiMaskRef.current) {
        roiMaskRef.current.delete();
        roiMaskRef.current = null;
      }
      roiContoursRef.current = [];
    }

    setDrawingMode("none");
  };

  // --- 9. 스마트 자석 윤곽선(Auto Contour) ROI 알고리즘 ---
  const performSmartContourExtraction = (rect: { x: number; y: number; w: number; h: number }) => {
    const outW = outputCanvasRef.current!.width;
    const outH = outputCanvasRef.current!.height;
    const mainCtx = outputCanvasRef.current!.getContext("2d");
    if (!mainCtx) return;

    const imgData = mainCtx.getImageData(0, 0, outW, outH);
    const src = new cv.Mat(outH, outW, cv.CV_8UC4);
    src.data.set(imgData.data);

    const rx = Math.max(0, rect.x);
    const ry = Math.max(0, rect.y);
    const rw = Math.min(rect.w, outW - rx);
    const rh = Math.min(rect.h, outH - ry);

    const croppedRect = new cv.Rect(rx, ry, rw, rh);
    const roiMat = src.roi(croppedRect);

    const gray = new cv.Mat();
    cv.cvtColor(roiMat, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

    const edges = new cv.Mat();
    cv.Canny(gray, edges, 50, 150, 3, false);

    const morphMat = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
    cv.dilate(edges, edges, morphMat, new cv.Point(-1, -1), 2);
    cv.erode(edges, edges, morphMat, new cv.Point(-1, -1), 2);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = -1;
    let maxIdx = -1;
    for (let i = 0; i < contours.size(); ++i) {
      const area = cv.contourArea(contours.get(i));
      if (area > maxArea) {
        maxArea = area;
        maxIdx = i;
      }
    }

    if (maxIdx !== -1 && maxArea > 40) {
      const bestContour = contours.get(maxIdx);
      const bRect = cv.boundingRect(bestContour);

      const resolvedRoi = {
        x: rx + bRect.x,
        y: ry + bRect.y,
        w: bRect.width,
        h: bRect.height
      };

      const mask = cv.Mat.zeros(resolvedRoi.h, resolvedRoi.w, cv.CV_8UC1);
      const offsetContour = bestContour.clone();
      const ox = rx - resolvedRoi.x;
      const oy = ry - resolvedRoi.y;

      for (let k = 0; k < offsetContour.rows; k++) {
        offsetContour.data32S[k * 2] += ox;
        offsetContour.data32S[k * 2 + 1] += oy;
      }

      const tempContoursList = new cv.MatVector();
      tempContoursList.push_back(offsetContour);
      cv.drawContours(mask, tempContoursList, 0, new cv.Scalar(255), -1, cv.LINE_8, hierarchy, 0);

      if (roiMaskRef.current) roiMaskRef.current.delete();
      roiMaskRef.current = mask;
      roiModeRef.current = "auto_contour";

      const points: Array<{ x: number; y: number }> = [];
      const data32 = bestContour.data32S;
      for (let m = 0; m < data32.length; m += 2) {
        points.push({ x: rx + data32[m], y: ry + data32[m + 1] });
      }
      roiContoursRef.current = points;
      roiRef.current = resolvedRoi;
      setRoiState(resolvedRoi);

      offsetContour.delete();
      tempContoursList.delete();
    } else {
      roiModeRef.current = "rect";
      roiContoursRef.current = [];
      if (roiMaskRef.current) {
        roiMaskRef.current.delete();
        roiMaskRef.current = null;
      }
    }

    src.delete(); roiMat.delete(); gray.delete(); edges.delete();
    morphMat.delete(); contours.delete(); hierarchy.delete();
  };

  // --- 10. 기준 정상 이미지 캡처 등록 ---
  const handleRegisterMasterClick = () => {
    if (!isCameraActive) {
      alert("기준 양품 캡처를 위해 먼저 카메라 연결을 개시해 주십시오.");
      return;
    }
    setNewMasterName(`PRODUCT_CODE_${Object.keys(masterList).length + 1}`);
    setShowSaveMasterModal(true);
  };

  const confirmRegisterMaster = () => {
    if (!newMasterName.trim()) {
      alert("정밀 식별을 위해 고유 부품명을 지정하십시오.");
      return;
    }

    const mainCtx = outputCanvasRef.current!.getContext("2d");
    if (!mainCtx) return;

    const rx = roiRef.current.x;
    const ry = roiRef.current.y;
    const rw = roiRef.current.w;
    const rh = roiRef.current.h;

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = rw;
    cropCanvas.height = rh;
    cropCanvas.getContext("2d")!.drawImage(outputCanvasRef.current!, rx, ry, rw, rh, 0, 0, rw, rh);
    const dataURL = cropCanvas.toDataURL("image/png");

    const tempMat = cv.imread(cropCanvas);
    const grayMat = new cv.Mat();
    cv.cvtColor(tempMat, grayMat, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(grayMat, grayMat, new cv.Size(5, 5), 0);

    if (masterMatRef.current) masterMatRef.current.delete();
    masterMatRef.current = grayMat;

    let dlEmbedArr: number[] | undefined = undefined;
    if (isDlLoaded) {
      const embed = calculateDLEmbedding(cropCanvas);
      if (embed) dlEmbedArr = embed;
    }

    const newRegistryItem: MasterItem = {
      name: newMasterName,
      dataURL: dataURL,
      savedRoi: { ...roiRef.current },
      roiMode: roiModeRef.current,
      roiContours: [...roiContoursRef.current],
      dlEmbedding: dlEmbedArr
    };

    const nextRegistry = { ...masterList, [newMasterName]: newRegistryItem };
    setMasterList(nextRegistry);
    setSelectedMasterName(newMasterName);
    persistSettings(nextRegistry);

    tempMat.delete();
    setShowSaveMasterModal(false);
    alert(`정상 기준품 [${newMasterName}]이 비전 대시보드에 편입되었습니다.`);
  };

  const deleteMasterItem = (key: string) => {
    if (!confirm(`기준양품 [${key}]을 목록에서 제거하시겠습니까?`)) return;
    const nextList = { ...masterList };
    delete nextList[key];
    setMasterList(nextList);
    if (selectedMasterName === key) {
      setSelectedMasterName("");
      if (masterMatRef.current) {
        masterMatRef.current.delete();
        masterMatRef.current = null;
      }
    }
    persistSettings(nextList);
  };

  const handleSelectMasterChange = (name: string) => {
    setSelectedMasterName(name);
    if (!name || !masterList[name]) {
      if (masterMatRef.current) {
        masterMatRef.current.delete();
        masterMatRef.current = null;
      }
      return;
    }

    const item = masterList[name];
    const img = new Image();
    img.onload = () => {
      const tc = document.createElement("canvas");
      tc.width = item.savedRoi.w;
      tc.height = item.savedRoi.h;
      tc.getContext("2d")!.drawImage(img, 0, 0);

      const rawMat = cv.imread(tc);
      const mMat = new cv.Mat();
      cv.cvtColor(rawMat, mMat, cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(mMat, mMat, new cv.Size(5, 5), 0);

      if (masterMatRef.current) masterMatRef.current.delete();
      masterMatRef.current = mMat;

      roiRef.current = item.savedRoi;
      setRoiState(item.savedRoi);
      roiModeRef.current = item.roiMode;
      roiContoursRef.current = item.roiContours;

      if (item.roiMode === "auto_contour" && item.roiContours.length > 2) {
        try {
          const mask = cv.Mat.zeros(item.savedRoi.h, item.savedRoi.w, cv.CV_8UC1);
          const ptsMat = cv.matFromArray(item.roiContours.length, 1, cv.CV_32SC2, item.roiContours.flatMap(p => [p.x - item.savedRoi.x, p.y - item.savedRoi.y]));
          const mContours = new cv.MatVector();
          mContours.push_back(ptsMat);
          cv.drawContours(mask, mContours, 0, new cv.Scalar(255), -1, cv.LINE_8, new cv.Mat(), 0);
          
          if (roiMaskRef.current) roiMaskRef.current.delete();
          roiMaskRef.current = mask;

          ptsMat.delete();
          mContours.delete();
        } catch (err) {
          console.error("ROI 마스크 복구 중 실효적 오류 발생:", err);
        }
      }

      rawMat.delete();
    };
    img.src = item.dataURL;
  };

  // --- 11. 바코드 리더 입력 모듈 연동 ---
  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyBarcode(e.target.value);
  };

  // --- 12. 다렉토리 매니저 ---
  const selectLocalSaveFolder = async () => {
    try {
      if ((window as any).showDirectoryPicker) {
        const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
        setSaveFolderHandle(handle);
        setSaveFolderName(handle.name);
      } else {
        alert("현재 사용중인 뷰어는 직접 저장을 지원하지 않아 기본 다운로드 포트를 활용합니다.");
      }
    } catch (err) {
      console.warn("폴더 바인딩 보류:", err);
    }
  };

  // --- 13. OK 팝업 확인 후 후속 작업 연속 개시 ---
  const triggerNextInspection = () => {
    setActiveOkModal(false);
    
    setBarcodeValue("");
    setExtractedBarcode("");
    setBarcodeMatchStatus("READY");
    setDetectedDefects([]);
    setDefectCount(0);
    setVlmReport("");

    isFrozenRef.current = false;
    setIsInspecting(true);

    setTimeout(() => {
      const barcodeInput = document.getElementById("inspection-barcode-input");
      if (barcodeInput) barcodeInput.focus();
    }, 150);
  };

  const toggleInspectionState = () => {
    if (!isInspecting) {
      if (!masterMatRef.current && Object.keys(masterList).length === 0) {
        alert("비교 검증을 위해 먼저 기준 양품(Master Image)을 등록해 주십시오.");
        return;
      }
      setIsInspecting(true);
      isFrozenRef.current = false;
      stableFramesRef.current = 0;
      continuousOkFramesRef.current = 0;
      setContinuousOkFrames(0);
    } else {
      setIsInspecting(false);
      isFrozenRef.current = false;
    }
  };

  // --- 14. 엑셀 수율 결과 리포팅 추출 ---
  const triggerExportExcel = () => {
    if (historyList.length === 0) {
      alert("출력할 인스펙션 이력이 비어 있습니다.");
      return;
    }

    const sheetData = historyList.map(h => ({
      "인스펙션 시간": h.time,
      "부품 일련번호": h.serial,
      "바코드 모델명": h.barcode,
      "판정 결과": h.result,
      "CV 유사도 (%)": h.similarityCV,
      "AI 신뢰도 (%)": h.similarityAI || "-",
      "세부 진단 내역": h.reason || "-"
    }));

    if (XLSX) {
      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "검사 결과로그");
      XLSX.writeFile(workbook, `VLM_AOI_INSPECTION_REPORTS_${Date.now()}.xlsx`);
    } else {
      alert("SheetJS 라이브러리 연동 준비중입니다. 조금 뒤 다운로드해 주세요.");
    }
  };

  const handleExportHTML = () => {
    exportStandaloneHTML(masterList, stats, passThreshold, binaryThreshold, vlmApiKey, vlmPrompt);
  };

  // --- 테마 기반 동적 스타일클래스 맵 ---
  const t: ThemeStyles = {
    bodyBg: theme === "light" ? "bg-[#f4f5f7] text-[#1e293b]" : "bg-[#0a0a0f] text-[#dee2e6]",
    headerBg: theme === "light" ? "bg-[#ffffff] border-b border-[#cbd5e1] shadow-sm relative z-20" : "bg-[#11111a] border-[#212130] shadow-lg relative z-20",
    headerTitle: theme === "light" ? "text-slate-800" : "text-blue-400",
    headerDesc: theme === "light" ? "text-[#5e6e82]" : "text-[#8e8e9f]",
    headerVal: theme === "light" ? "text-[#0f172a]" : "text-white",
    panelBg: theme === "light" ? "bg-[#ffffff] border-r border-[#cbd5e1]" : "bg-[#0c0c14] border-r border-[#191926]", 
    cardBg: theme === "light" ? "bg-[#ffffff] border border-[#cbd5e1] shadow-sm rounded-2xl" : "bg-[#11111a] border border-[#212130] rounded-2xl",
    cardHeading: theme === "light" ? "text-slate-700 bg-slate-50 border-b border-slate-100 px-3.5 py-2 font-bold rounded-t-xl" : "text-blue-400 bg-blue-500/5 border-b border-[#212130] px-3.5 py-2 font-bold rounded-t-xl",
    inputBg: theme === "light" ? "bg-[#f8fafc] border border-[#cbd5e1] text-[#0f172a] focus:bg-white focus:border-indigo-500" : "bg-[#141421] border border-[#212133] text-[#ccc] focus:border-blue-500",
    accentText: theme === "light" ? "text-[#475569]" : "text-blue-400",
    accentLabel: theme === "light" ? "text-slate-700" : "text-blue-400",
    subtext: theme === "light" ? "text-[#64748b]" : "text-[#8e8e9f]",
    screenBg: theme === "light" ? "bg-[#f8fafc]" : "bg-[#07070a]",
    screenBorder: theme === "light" ? "border-[#cbd5e1]" : "border-[#1b1b2a]",
    barBg: theme === "light" ? "bg-slate-200" : "bg-[#090910]",
    modalBg: theme === "light" ? "bg-white border border-[#cbd5e1] text-slate-800 rounded-2xl shadow-2xl" : "bg-[#14141e] border border-[#28283a] text-white rounded-2xl",
    modalLabel: theme === "light" ? "text-[#334155]" : "text-[#a3a3b3]",
    logBg: theme === "light" ? "bg-[#ffffff] border border-[#cbd5e1]" : "bg-[#11111a] border-[#212130]",
    logItemBg: theme === "light" ? "hover:bg-slate-150 border-b border-slate-100" : "hover:bg-[#151522]/50 border-b border-[#1e1e2d]",
    textTitle: theme === "light" ? "text-slate-800" : "text-slate-200",
    btnPrimary: theme === "light" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
    btnSecondary: theme === "light" ? "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200" : "bg-[#1a1a2b] hover:bg-[#212138] text-blue-300 border border-blue-500/20",
    btnGray: theme === "light" ? "bg-slate-50 hover:bg-indigo-50 border border-[#cbd5e1] text-slate-600 hover:text-slate-800" : "bg-[#161622] border border-[#222238] text-[#8e8e9f] hover:text-white",
  };

  const handleThemeChange = (nextTheme: "dark" | "light") => {
    setTheme(nextTheme);
    persistSettings(masterList, stats, historyList, nextTheme);
  };

  // 모바일 노드 모드일 때는 스마트폰 전용 카메라/바코드 전송 화면 즉시 렌더링
  if (isMobileMode) {
    return (
      <MobileDevNode
        sessionId={sessionId}
        onExitMobileMode={() => {
          setIsMobileMode(false);
          if (typeof window !== "undefined") {
            window.history.replaceState({}, "", window.location.pathname);
          }
        }}
      />
    );
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-sans antialiased transition-colors duration-200 ${t.bodyBg}`}>
      {/* 1. 최상단 헤더 계기 레벨 */}
      <header className={`flex justify-between items-center py-3.5 px-6 shrink-0 transition-all ${t.headerBg}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className={`text-sm font-bold tracking-tight bg-clip-text text-transparent flex items-center gap-2 ${
              theme === "light" ? "bg-gradient-to-r from-slate-800 to-indigo-700" :
              "bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400"
            }`}>
              AOI-Vision Inspection
              <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono">1단계 개선 완료</span>
            </div>
            <p className={`text-[11px] transition-all ${t.headerDesc}`}>실시간 OpenCV 필터 분석 및 Gemini VLM 인텔리전트 외관 결함 검사</p>
          </div>
        </div>

        <div className={`flex items-center gap-4 text-xs font-mono transition-all ${t.subtext}`}>
          {/* 1순위: 결함 유형별 파레토 분석 대시보드 버튼 */}
          <button
            onClick={() => setShowParetoModal(true)}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer border ${
              theme === "light"
                ? "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
            <span>파레토 분석 (80/20)</span>
          </button>

          {/* 불량유형 DB & AI 피드백 학습 센터 버튼 */}
          <button
            onClick={() => setShowDefectKnowledgeBaseModal(true)}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer border ${
              defectList.length > 0
                ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                : "bg-slate-500/10 border-slate-500/30 text-slate-400 hover:bg-slate-500/20"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>불량유형 DB ({defectList.length})</span>
            {defectList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-[10px] flex items-center gap-0.5 font-sans">
                <BrainCircuit className="w-3 h-3" /> AI 학습
              </span>
            )}
          </button>

          {/* 2순위: 청각적 피드백 사운드 알람 토글 버튼 */}
          <button
            onClick={toggleSoundAlert}
            title={isSoundAlertEnabled ? "사운드 알람 켜짐 (OK/NG 판정 비프음)" : "사운드 알람 꺼짐 (음소거)"}
            className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer border ${
              isSoundAlertEnabled
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20"
            }`}
          >
            {isSoundAlertEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-sans">사운드 ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-sans">음소거</span>
              </>
            )}
          </button>

          {/* 개발 단계: 스마트폰 연동 버튼 */}
          <button
            onClick={() => setShowPhoneBridgeModal(true)}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer border ${
              phoneConnected 
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20" 
                : "bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{phoneConnected ? `📱 ${phoneDeviceName || "스마트폰"} 연동됨` : "📱 스마트폰 카메라/스캐너 연결"}</span>
            {phoneConnected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />}
          </button>

          <div className={`flex items-center gap-1 rounded-lg p-0.5 border shrink-0 font-sans transition-all ${
            theme === 'light' ? 'bg-[#f1f3f5] border-[#cbd5e1]' : 'bg-[#141421] border-[#212133]'
          }`}>
            <button
              onClick={() => handleThemeChange("dark")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                theme === "dark" ? "bg-blue-600 text-white shadow-sm" : `${t.subtext} hover:opacity-80`
              }`}
            >
              어둠(다크)
            </button>
            <button
              onClick={() => handleThemeChange("light")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                theme === "light" ? "bg-white text-slate-800 shadow-sm" : `${t.subtext} hover:opacity-80`
              }`}
            >
              밝음(라이트)
            </button>
          </div>

          <div className="flex items-center gap-1.5 border-l pl-4 border-[#cbd5e1] dark:border-[#212130]" style={{ borderColor: theme === "light" ? "#cbd5e1" : "#212130" }}>
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            FPS: <span className={`font-bold transition-all ${t.headerVal}`}>{fps}</span>
          </div>
          <div className="flex items-center gap-1.5">
            Latency: <span className={`font-bold transition-all ${t.headerVal}`}>{processingTime}ms</span>
          </div>
          <div className="flex items-center gap-2 border-l pl-4" style={{ borderColor: theme === "light" ? "#cbd5e1" : "#212130" }}>
            <span className={`w-2.5 h-2.5 rounded-full ${isLoaderReady ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-amber-400"}`} />
            OpenCV.js
          </div>
          <div className="flex items-center gap-2 border-l pl-4" style={{ borderColor: theme === "light" ? "#cbd5e1" : "#212130" }}>
            <span className={`w-2.5 h-2.5 rounded-full ${isDlLoaded ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-neutral-600"}`} />
            TF Engine
          </div>
        </div>
      </header>

      {/* 내부 라이브러리 탑재 대기 오버레이 */}
      <AnimatePresence>
        {!isLoaderReady && (
          <motion.div 
            initial={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-[#07070a] z-50 flex flex-col justify-center items-center gap-4"
          >
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <div className="text-sm font-semibold text-blue-400 font-mono tracking-wider">{loaderMessage}</div>
            <p className="text-xs text-[#6e6e7f]">최초 구동 시 인터넷 회선 상태에 따라 2~4초 소요될 수 있습니다.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. 대시보드 3 패널 스페이스 */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        <LeftPanel
          theme={theme}
          t={t}
          selectedCamera={selectedCamera}
          setSelectedCamera={setSelectedCamera}
          cameras={cameras}
          toggleCamera={toggleCamera}
          isCameraActive={isCameraActive}
          isFlipped={isFlipped}
          setIsFlipped={setIsFlipped}
          cameraAngle={cameraAngle}
          setCameraAngle={setCameraAngle}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          zoomCapabilities={zoomCapabilities}
          handleZoomChange={handleZoomChange}
          masterList={masterList}
          selectedMasterName={selectedMasterName}
          handleRegisterMasterClick={handleRegisterMasterClick}
          handleSelectMasterChange={handleSelectMasterChange}
          deleteMasterItem={deleteMasterItem}
          barcodeValue={barcodeValue}
          handleBarcodeChange={handleBarcodeChange}
          barcodeMatchStatus={barcodeMatchStatus}
          extractedBarcode={extractedBarcode}
          saveFolderName={saveFolderName}
          selectLocalSaveFolder={selectLocalSaveFolder}
          openPhoneBridgeModal={() => setShowPhoneBridgeModal(true)}
          phoneConnected={phoneConnected}
          phoneDeviceName={phoneDeviceName}
          isUsingPhoneStream={isUsingPhoneStream}
          setIsUsingPhoneStream={setIsUsingPhoneStream}
        />

        <CenterPanel
          theme={theme}
          t={t}
          drawingMode={drawingMode}
          setDrawingMode={setDrawingMode}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          videoRef={videoRef}
          outputCanvasRef={outputCanvasRef}
          diffCanvasRef={diffCanvasRef}
          handleRoiMouseDown={handleRoiMouseDown}
          handleRoiMouseMove={handleRoiMouseMove}
          handleRoiMouseUp={handleRoiMouseUp}
          binaryThreshold={binaryThreshold}
          setBinaryThreshold={handleManualBinaryThresholdChange}
          passThreshold={passThreshold}
          setPassThreshold={handleManualPassThresholdChange}
          currentPreset={currentPreset}
          applyPreset={applyPreset}
          deepLearningEnabled={deepLearningEnabled}
          vlmEnabled={vlmEnabled}
        />

        <RightPanel
          theme={theme}
          t={t}
          isInspecting={isInspecting}
          continuousOkFrames={continuousOkFrames}
          simHistory={simHistory}
          vlmEnabled={vlmEnabled}
          setVlmEnabled={setVlmEnabled}
          showApiKeyInput={showApiKeyInput}
          setShowApiKeyInput={setShowApiKeyInput}
          vlmApiKey={vlmApiKey}
          setVlmApiKey={setVlmApiKey}
          vlmPrompt={vlmPrompt}
          setVlmPrompt={setVlmPrompt}
          vlmReport={vlmReport}
          isVlmProcessing={isVlmProcessing}
          defectCount={defectCount}
          stats={stats}
          passThreshold={passThreshold}
          toggleInspectionState={toggleInspectionState}
          historyList={historyList}
          triggerExportExcel={triggerExportExcel}
          triggerExportStandaloneHTML={handleExportHTML}
        />
      </div>

      <SaveMasterModal
        theme={theme}
        showSaveMasterModal={showSaveMasterModal}
        newMasterName={newMasterName}
        setNewMasterName={setNewMasterName}
        setShowSaveMasterModal={setShowSaveMasterModal}
        confirmRegisterMaster={confirmRegisterMaster}
      />

      <ActiveOkModal
        activeOkModal={activeOkModal}
        triggerNextInspection={triggerNextInspection}
      />

      <SmartphoneBridgeModal
        isOpen={showPhoneBridgeModal}
        onClose={() => setShowPhoneBridgeModal(false)}
        sessionId={sessionId}
        isConnected={phoneConnected}
        deviceName={phoneDeviceName}
        lastReceivedTime={lastPhonePullTimeRef.current}
        frameCount={phoneFrameCount}
        lastBarcode={phoneLastBarcode}
        theme={theme}
        t={t}
        isUsingPhoneStream={isUsingPhoneStream}
        setIsUsingPhoneStream={setIsUsingPhoneStream}
      />

      <DefectFeedbackModal
        isOpen={showDefectFeedbackModal}
        onClose={() => setShowDefectFeedbackModal(false)}
        defectCandidate={defectCandidate}
        onBackupAndLearn={handleBackupAndLearnDefect}
        onOverrideFalsePositive={handleOverrideFalsePositive}
        theme={theme}
        t={t}
      />

      <DefectKnowledgeBaseModal
        isOpen={showDefectKnowledgeBaseModal}
        onClose={() => setShowDefectKnowledgeBaseModal(false)}
        defectList={defectList}
        onDeleteDefect={handleDeleteDefect}
        onTriggerLearnAi={handleTriggerLearnAi}
        isLearning={isAiLearning}
        theme={theme}
        t={t}
      />

      <DefectParetoModal
        isOpen={showParetoModal}
        onClose={() => setShowParetoModal(false)}
        defectList={defectList}
        historyList={historyList}
        theme={theme}
        t={t}
      />
    </div>
  );
}
