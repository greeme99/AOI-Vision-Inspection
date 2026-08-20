/**
 * 스마트폰 및 웹 카메라 실시간 바코드 / QR코드 스캐너 유틸리티
 * BarcodeDetector Web API 지원 여부를 자동 감지하고 고속 프레임 스캔을 수행합니다.
 */

export interface BarcodeResult {
  rawValue: string;
  format: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// BarcodeDetector 인스턴스 캐시
let barcodeDetectorInstance: any = null;
let isDetectorSupported: boolean | null = null;

export async function isBarcodeDetectorSupported(): Promise<boolean> {
  if (isDetectorSupported !== null) return isDetectorSupported;
  if ("BarcodeDetector" in window) {
    try {
      const supportedFormats = await (window as any).BarcodeDetector.getSupportedFormats();
      isDetectorSupported = supportedFormats.length > 0;
    } catch {
      isDetectorSupported = true;
    }
  } else {
    isDetectorSupported = false;
  }
  return isDetectorSupported;
}

export async function createBarcodeDetector(): Promise<any> {
  if (barcodeDetectorInstance) return barcodeDetectorInstance;
  if ("BarcodeDetector" in window) {
    try {
      barcodeDetectorInstance = new (window as any).BarcodeDetector({
        formats: [
          "qr_code",
          "code_128",
          "code_39",
          "code_93",
          "ean_13",
          "ean_8",
          "itf",
          "upc_a",
          "upc_e",
          "data_matrix",
          "aztec"
        ]
      });
      return barcodeDetectorInstance;
    } catch (e) {
      console.warn("BarcodeDetector 초기화 경고:", e);
      try {
        barcodeDetectorInstance = new (window as any).BarcodeDetector();
        return barcodeDetectorInstance;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * 캔버스나 비디오 프레임에서 바코드를 고속으로 감지합니다.
 */
export async function detectBarcodeFromElement(
  source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap
): Promise<BarcodeResult | null> {
  try {
    const detector = await createBarcodeDetector();
    if (!detector) return null;

    const barcodes = await detector.detect(source);
    if (barcodes && barcodes.length > 0) {
      const b = barcodes[0];
      return {
        rawValue: b.rawValue || "",
        format: b.format || "unknown",
        boundingBox: b.boundingBox ? {
          x: b.boundingBox.x,
          y: b.boundingBox.y,
          width: b.boundingBox.width,
          height: b.boundingBox.height,
        } : undefined
      };
    }
  } catch (err) {
    // 프레임이 준비되지 않았거나 비디오 치수가 0일 때의 일시적 오류 무시
  }
  return null;
}
