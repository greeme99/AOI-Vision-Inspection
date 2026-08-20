import React from "react";
import { Camera, Layers, Trash2, Square, Play, Smartphone, Radio, Scan, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { MasterItem, ThemeStyles, CameraZoomCapabilities } from "../types";

interface LeftPanelProps {
  theme: "dark" | "light";
  t: ThemeStyles;
  selectedCamera: string;
  setSelectedCamera: (val: string) => void;
  cameras: MediaDeviceInfo[];
  toggleCamera: () => void;
  isCameraActive: boolean;
  isFlipped: boolean;
  setIsFlipped: (val: boolean) => void;
  cameraAngle: number;
  setCameraAngle: (val: number) => void;
  zoomLevel: number;
  setZoomLevel: (val: number) => void;
  zoomCapabilities: CameraZoomCapabilities;
  handleZoomChange: (val: number) => void;
  masterList: Record<string, MasterItem>;
  selectedMasterName: string;
  handleRegisterMasterClick: () => void;
  handleSelectMasterChange: (name: string) => void;
  deleteMasterItem: (name: string) => void;
  barcodeValue: string;
  handleBarcodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  barcodeMatchStatus: "READY" | "MATCHED" | "NOT_FOUND";
  extractedBarcode: string;
  saveFolderName: string;
  selectLocalSaveFolder: () => void;
  openPhoneBridgeModal: () => void;
  phoneConnected: boolean;
  phoneDeviceName?: string;
  isUsingPhoneStream: boolean;
  setIsUsingPhoneStream: (val: boolean) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  theme,
  t,
  selectedCamera,
  setSelectedCamera,
  cameras,
  toggleCamera,
  isCameraActive,
  isFlipped,
  setIsFlipped,
  cameraAngle,
  setCameraAngle,
  zoomLevel,
  setZoomLevel,
  zoomCapabilities,
  handleZoomChange,
  masterList,
  selectedMasterName,
  handleRegisterMasterClick,
  handleSelectMasterChange,
  deleteMasterItem,
  barcodeValue,
  handleBarcodeChange,
  barcodeMatchStatus,
  extractedBarcode,
  saveFolderName,
  selectLocalSaveFolder,
  openPhoneBridgeModal,
  phoneConnected,
  phoneDeviceName,
  isUsingPhoneStream,
  setIsUsingPhoneStream,
}) => {
  return (
    <div className={`w-[340px] p-4 flex flex-col gap-5 overflow-y-auto overflow-x-hidden shrink-0 transition-all ${t.panelBg}`}>
      {/* 개발 전용: 스마트폰 무선 연동 브릿지 배너 */}
      <div className={`p-3 rounded-xl border transition-all ${
        phoneConnected 
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          : theme === "light" 
          ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-slate-800"
          : "bg-gradient-to-r from-blue-950/40 via-[#131724] to-indigo-950/40 border-blue-500/20 text-slate-200"
      }`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold flex items-center gap-1.5 text-blue-400">
            <Smartphone className="w-3.5 h-3.5" /> 스마트폰 무선 브릿지
          </span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
            phoneConnected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400"
          }`}>
            <Radio className={`w-2.5 h-2.5 ${phoneConnected ? "animate-pulse" : ""}`} />
            {phoneConnected ? "스마트폰 연결됨" : "미연결 (QR 필요)"}
          </span>
        </div>
        <p className={`text-[10px] leading-relaxed mb-2 ${t.subtext}`}>
          개발 단계에서 스마트폰 카메라와 바코드 리더기를 즉시 연동해 검사합니다.
        </p>

        <div className="flex gap-1.5">
          <button
            onClick={openPhoneBridgeModal}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition cursor-pointer"
          >
            <Smartphone className="w-3 h-3" />
            스마트폰 연동 QR코드 열기
          </button>
        </div>

        {phoneConnected && (
          <div className="mt-2 pt-2 border-t border-dashed border-emerald-500/20 flex items-center justify-between text-[11px]">
            <span className="text-emerald-300 font-mono truncate max-w-[150px]">
              {phoneDeviceName || "스마트폰"}
            </span>
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isUsingPhoneStream}
                onChange={(e) => setIsUsingPhoneStream(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-0"
              />
              스마트폰 피드 적용
            </label>
          </div>
        )}
      </div>

      {/* 장치 연결 파트 */}
      <div className="space-y-3">
        <h3 className={`text-xs font-bold tracking-wider flex items-center justify-between ${t.accentLabel}`}>
          <span className="flex items-center gap-2"><Camera className="w-3.5 h-3.5" /> 카메라 입력 파이프라인</span>
          {isUsingPhoneStream && (
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded">
              📱 스마트폰 무선 피드
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <select 
            value={selectedCamera} 
            onChange={(e) => setSelectedCamera(e.target.value)}
            disabled={isUsingPhoneStream}
            className={`w-full text-xs font-mono rounded-lg p-2.5 focus:outline-none transition-all ${t.inputBg} ${isUsingPhoneStream ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {cameras.map((c) => (
              <option key={c.deviceId} value={c.deviceId} className="bg-neutral-800 text-white">
                {c.label || "카메라 노드"}
              </option>
            ))}
          </select>
          <button 
            onClick={toggleCamera}
            disabled={isUsingPhoneStream}
            className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              isUsingPhoneStream ? "opacity-50 cursor-not-allowed bg-neutral-700 text-neutral-400" :
              isCameraActive ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20" : t.btnPrimary
            }`}
          >
            {isCameraActive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isUsingPhoneStream ? "스마트폰 무선 스트림 활성 중" : isCameraActive ? "카메라 연결 종료" : "카메라 피드 연결"}
          </button>
        </div>
        
        <div className="flex items-center justify-between text-xs pt-1">
          <label className={`flex items-center gap-1.5 cursor-pointer select-none ${t.subtext}`}>
            <input 
              type="checkbox" 
              checked={isFlipped} 
              onChange={(e) => setIsFlipped(e.target.checked)} 
              className="rounded bg-[#141421] border-[#212133] text-blue-500 focus:ring-0" 
            />
            얼굴 좌우반전
          </label>
          <div className={`flex items-center gap-1.5 ${t.subtext}`}>
            <span>회전각:</span>
            <select 
              value={cameraAngle}
              onChange={(e) => setCameraAngle(Number(e.target.value))}
              className={`rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none ${t.inputBg}`}
            >
              <option value={0}>0°</option>
              <option value={90}>90°</option>
              <option value={180}>180°</option>
              <option value={270}>270°</option>
            </select>
          </div>
        </div>

        {/* 카메라 줌(Zoom) 제어 슬라이더 */}
        <div className={`p-2.5 rounded-xl border space-y-1.5 transition-all ${
          theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#11111a] border-[#212130]"
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold flex items-center gap-1.5 ${t.accentLabel}`}>
              <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
              카메라 줌 비율
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                zoomCapabilities.supported
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-blue-500/15 text-blue-400"
              }`}>
                {zoomCapabilities.supported ? "HW 광학/트랙줌" : "디지털 스케일줌"}
              </span>
              <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                {zoomLevel.toFixed(1)}x
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <ZoomOut className={`w-3.5 h-3.5 shrink-0 ${t.subtext}`} />
            <input
              type="range"
              min={zoomCapabilities.min}
              max={zoomCapabilities.max}
              step={zoomCapabilities.step}
              value={zoomLevel}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              disabled={!isCameraActive && !isUsingPhoneStream}
              className="flex-1 accent-blue-500 h-1.5 rounded-lg cursor-pointer bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <ZoomIn className={`w-3.5 h-3.5 shrink-0 ${t.subtext}`} />
            <button
              onClick={() => handleZoomChange(1.0)}
              disabled={zoomLevel === 1.0 || (!isCameraActive && !isUsingPhoneStream)}
              title="1.0x 리셋"
              className="p-1 rounded text-[10px] font-mono border hover:bg-blue-500/20 text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              style={{ borderColor: theme === "light" ? "#cbd5e1" : "#28283c" }}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <div className="flex justify-between text-[10px] font-mono text-[#888899] px-1">
            <span>{zoomCapabilities.min.toFixed(1)}x</span>
            <span>{((zoomCapabilities.min + zoomCapabilities.max) / 2).toFixed(1)}x</span>
            <span>{zoomCapabilities.max.toFixed(1)}x</span>
          </div>
        </div>
      </div>

      {/* 기준 양품 레지스트리 */}
      <div className="space-y-3 pt-3 border-t border-dashed" style={{ borderColor: theme === "light" ? "#cbd5e1" : "#191926" }}>
        <div className="flex justify-between items-center">
          <h3 className={`text-xs font-bold tracking-wider flex items-center gap-2 ${t.accentLabel}`}>
            <Layers className="w-3.5 h-3.5" /> 기준 양품(Master Image)
          </h3>
          <span className={`text-[10px] font-mono ${t.subtext}`}>총 {Object.keys(masterList).length}대</span>
        </div>
        
        <button 
          onClick={handleRegisterMasterClick}
          className={`w-full py-2 text-xs font-semibold rounded-lg transition border ${t.btnSecondary}`}
        >
          📷 현재 화면을 마스터로 등록
        </button>

        {Object.keys(masterList).length > 0 && (
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
            {Object.keys(masterList).map((key) => (
              <div 
                key={key} 
                className={`flex items-center justify-between p-2 rounded-lg text-xs border transition ${
                  selectedMasterName === key 
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm" 
                    : `${theme === 'light' ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-[#13131c] border-[#202030] hover:bg-[#1a1a26]'}`
                }`}
              >
                <div 
                  onClick={() => handleSelectMasterChange(key)}
                  className="flex items-center gap-2 cursor-pointer flex-1 overflow-hidden"
                >
                  <img src={masterList[key].dataURL} className="w-8 h-6 object-cover bg-black rounded" />
                  <span className={`truncate pr-2 font-mono font-medium ${selectedMasterName === key ? 'text-emerald-300' : theme === 'light' ? 'text-slate-800' : 'text-[#dee2e6]'}`}>{key}</span>
                </div>
                <button 
                  onClick={() => deleteMasterItem(key)}
                  className="text-red-400/70 hover:text-red-400 p-1 rounded hover:bg-red-500/15"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 바코드 연동 리더 */}
      <div className={`space-y-3 pt-3 p-2.5 rounded-xl border transition-all ${
        theme === 'light' ? 'bg-slate-50 border border-emerald-500/20' : 'bg-[#0d1612]/30 border border-emerald-500/10'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
            <Scan className="w-3.5 h-3.5" /> 스마트 바코드 리더기
          </h3>
          <div className="flex items-center gap-1.5">
            {phoneConnected && (
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                스마트폰 연동됨
              </span>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              barcodeMatchStatus === "MATCHED" ? "bg-emerald-500/20 text-emerald-400 font-bold" :
              barcodeMatchStatus === "NOT_FOUND" ? "bg-red-500/20 text-red-400 font-bold" : "bg-[#212130] text-[#8e8e9f]"
            }`}>{barcodeMatchStatus}</span>
          </div>
        </div>
        
        <input 
          id="inspection-barcode-input"
          type="text"
          placeholder="스마트폰/스캐너 바코드 대기중..."
          value={barcodeValue}
          onChange={handleBarcodeChange}
          className={`w-full text-xs font-mono rounded-lg p-2.5 focus:outline-none transition-all ${
            theme === 'light' ? 'bg-white border border-emerald-500/30 text-emerald-800 focus:border-emerald-500' :
            'bg-[#07070d] border border-emerald-500/20 text-emerald-300 focus:border-emerald-500'
          }`}
        />
        {extractedBarcode && (
          <div className="flex justify-between text-[11px] p-2 rounded border font-mono" style={{ 
            backgroundColor: theme === 'light' ? '#f0fdf4' : 'rgba(16,185,129,0.05)',
            borderColor: theme === 'light' ? '#bbf7d0' : '#21352a'
          }}>
            <span className={t.subtext}>추출 품목코드:</span>
            <span className="text-emerald-400 font-bold">{extractedBarcode}</span>
          </div>
        )}
      </div>

      {/* 오프라인 저장소 및 VLM 키 활성화 */}
      <div className="space-y-3 pt-3 border-t border-dashed mt-auto" style={{ borderColor: theme === "light" ? "#cbd5e1" : "#191926" }}>
        <h3 className={`text-xs font-bold tracking-wider flex items-center justify-between ${t.subtext}`}>
          <span>OK 캡처본 자동 백업 저장소</span>
          <button onClick={selectLocalSaveFolder} className="text-[#3b82f6] hover:underline hover:text-blue-400 text-[10px]">설정</button>
        </h3>
        <div className={`text-[11px] p-2 rounded-lg border font-mono break-all leading-relaxed transition-all ${
          theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-500' :
          'bg-[#12121e] border-[#212130] text-[#717180]'
        }`}>
          📁 {saveFolderName || "미선택 (OK 진단 시 브라우저 기본 다운로드 활용)"}
        </div>
      </div>
    </div>
  );
};
