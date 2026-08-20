export interface MasterItem {
  name: string;
  dataURL: string;
  savedRoi: { x: number; y: number; w: number; h: number };
  roiMode: "rect" | "auto_contour";
  roiContours: Array<{ x: number; y: number }>;
  dlEmbedding?: number[];
}

export interface InspectionHistory {
  id: string;
  time: string;
  barcode: string;
  serial: string;
  result: "OK" | "NG";
  similarityCV: number;
  similarityAI?: number;
  reason?: string;
  defects?: DefectItem[];
  defectLabels?: string[];
}

export interface DefectItem {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface DefectRecord {
  id: string;
  timestamp: number;
  time: string;
  serial: string;
  barcode: string;
  imageUrl: string;
  cropImageUrl?: string;
  defectType: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR";
  similarityCV: number;
  similarityAI?: number;
  aiReason?: string;
  feedbackNote?: string;
  defects?: DefectItem[];
  isLearned: boolean;
}

export interface CameraZoomCapabilities {
  supported: boolean;
  min: number;
  max: number;
  step: number;
}

export interface SmartphoneBridgeState {
  sessionId: string;
  isConnected: boolean;
  deviceName?: string;
  lastReceivedTime: number;
  frameCount: number;
  lastBarcode?: string;
  isUsingPhoneStream: boolean;
}

export interface ThemeStyles {
  bodyBg: string;
  headerBg: string;
  headerTitle: string;
  headerDesc: string;
  headerVal: string;
  panelBg: string;
  cardBg: string;
  cardHeading: string;
  inputBg: string;
  accentText: string;
  accentLabel: string;
  subtext: string;
  screenBg: string;
  screenBorder: string;
  barBg: string;
  modalBg: string;
  modalLabel: string;
  logBg: string;
  logItemBg: string;
  textTitle: string;
  btnPrimary: string;
  btnSecondary: string;
  btnGray: string;
}
