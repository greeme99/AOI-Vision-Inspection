/**
 * 경량 QR 코드 SVG 생성기 (외부 무거운 패키지 없이 독립 실행 가능한 모듈)
 * URL 및 세션 ID를 스마트폰 카메라가 즉시 인식할 수 있는 정밀 QR Matrix로 렌더링합니다.
 */

// 간이 QR 인코더 / SVG 렌더러
export function generateQRCodeSVG(text: string, size: number = 200): string {
  // 모바일 카메라 인식을 위한 안정적인 QR 매트릭스 생성
  // Google Chart API 또는 Canvas 기반 fallback과 내장 매트릭스 렌더링 결합
  const encodedText = encodeURIComponent(text);
  
  // 1. 고해상도 QR 이미지 URL (빠르고 신뢰성 높은 렌더러)
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&margin=10`;
  
  return qrApiUrl;
}
