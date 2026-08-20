import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// JSON 바디 파서 (대용량 이미지 전송을 위해 20mb 상한)
app.use(express.json({ limit: "20mb" }));

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY가 서버 .env 혹은 설정에 저장되어 있지 않습니다.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// 1. 비전 래퍼 API: Gemini 3.5 Flash를 이용한 VLM 조립 및 외관 결함 실시간 검사
app.post("/api/inspect", async (req, res) => {
  try {
    const { image, prompt, isUpgradeCheck, expectedResult } = req.body;

    if (!image) {
      res.status(400).json({ error: "이미지 데이터(base64)가 누락되었습니다." });
      return;
    }

    // Base64 가공
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const ai = getGeminiClient();

    const systemInstruction = `
      당신은 현대 공장 자동화 현장에서 동작하는 초정밀 기구물 자동 광학 검사(AOI) 비전 AI 시스템입니다.
      전달된 실시간 캡처 이미지를 철저히 모니터링하여 미세 결함이나 조립 이상을 실시간 판정하십시오.
      
      판정 기준:
      1. 표면 손상: 외부 스크래치, 찍힘, 오염, 먼지 및 변색이 조립 성능과 외관 품질에 영향을 미치는지 밝혀내십시오.
      2. 조립 정렬: 기구물 파트들이 어긋났거나, 나사 누락, 빈틈이 벌어지거나 잘못 체결되었는지 분석하십시오.
      3. 지정된 예상 품목 매칭: 바코드나 기준 부품 타입 정보가 주어진 경우 이미지 내 피처와 일치하는 지 검토하십시오.

      응답은 반드시 정의된 Schema 형식의 JSON으로만 출력해야 합니다.
    `;

    const userPrompt = prompt || "전체 기구물이 양품으로 온전하게 체결되고 표면에 결함이 없는지, 양호 여부를 'OK' 혹은 'NG'로 검사해주십시오.";

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    };

    const textPart = {
      text: userPrompt,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            result: {
              type: Type.STRING,
              description: "최종 검사 판정 결과: 반드시 'OK' (정상 양품) 또는 'NG' (불량품) 중 하나여야 합니다.",
            },
            reason: {
              type: Type.STRING,
              description: "판정 사유에 대한 명확하고 전문적인 한국어 설명 (예: '중앙 조인트 부 정렬 어긋남 2.4mm 발생', '전면 하우징에 미세 스크래치 검출')",
            },
            confidence: {
              type: Type.INTEGER,
              description: "판정의 신뢰도를 백분율(0-100) 정수로 작성하십시오.",
            },
            defects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.INTEGER, description: "캡처 이미지 가로 대비 결함 중심의 백분율 위치 (0~100)" },
                  y: { type: Type.INTEGER, description: "캡처 이미지 세로 대비 결함 중심의 백분율 위치 (0~100)" },
                  w: { type: Type.INTEGER, description: "결함 가로 폭 비율 (0~100)" },
                  h: { type: Type.INTEGER, description: "결함 세로 높이 비율 (0~100)" },
                  label: { type: Type.STRING, description: "결함 유형 (예: '스크래치', '나사누락', '정렬미흡', '변색', '찍힘')" }
                },
                required: ["x", "y", "w", "h", "label"]
              },
              description: "이미지 내에서 발견된 미세 결함 또는 이상 지점들의 바운딩 정보 목록 (결함이 없다면 빈 배열)"
            }
          },
          required: ["result", "reason", "confidence", "defects"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini 응답을 분석할 수 없습니다.");
    }

    const parsedResult = JSON.parse(resultText.trim());
    res.json(parsedResult);

  } catch (error: any) {
    console.error("Gemini VLM AOI 검사 중 오류:", error);
    res.status(500).json({ error: error.message || "VLM 판정 도중 내부 오류가 발생했습니다." });
  }
});

// 2. 개발 및 테스트 단계 전용: 스마트폰 무선 카메라 & 바코드 스캐너 브릿지
interface DevBridgeSession {
  id: string;
  createdAt: number;
  lastUpdatedAt: number;
  deviceName?: string;
  frameImage?: string; // base64
  barcode?: string;
  barcodeTimestamp?: number;
  isStreaming?: boolean;
}

const devBridgeSessions = new Map<string, DevBridgeSession>();

// 세션 생성/확인
app.get("/api/dev-bridge/session", (req, res) => {
  const sessionId = (req.query.sessionId as string) || "dev-default";
  let session = devBridgeSessions.get(sessionId);
  if (!session) {
    session = {
      id: sessionId,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };
    devBridgeSessions.set(sessionId, session);
  }
  res.json({
    status: "ok",
    session: {
      id: session.id,
      lastUpdatedAt: session.lastUpdatedAt,
      hasFrame: !!session.frameImage,
      lastBarcode: session.barcode,
      deviceName: session.deviceName,
    }
  });
});

// 스마트폰 -> 서버: 카메라 프레임 및 바코드 전송
app.post("/api/dev-bridge/push", (req, res) => {
  const { sessionId = "dev-default", frameImage, barcode, deviceName, isStreaming } = req.body;
  let session = devBridgeSessions.get(sessionId);
  if (!session) {
    session = {
      id: sessionId,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };
    devBridgeSessions.set(sessionId, session);
  }

  session.lastUpdatedAt = Date.now();
  if (deviceName) session.deviceName = deviceName;
  if (isStreaming !== undefined) session.isStreaming = isStreaming;
  if (frameImage) session.frameImage = frameImage;
  if (barcode) {
    session.barcode = barcode;
    session.barcodeTimestamp = Date.now();
  }

  res.json({ status: "ok", timestamp: session.lastUpdatedAt });
});

// PC -> 서버: 스마트폰의 최신 프레임 및 바코드 가져오기
app.get("/api/dev-bridge/pull", (req, res) => {
  const sessionId = (req.query.sessionId as string) || "dev-default";
  const sinceTime = Number(req.query.since || 0);
  const session = devBridgeSessions.get(sessionId);

  if (!session) {
    res.json({
      connected: false,
      lastUpdatedAt: 0,
    });
    return;
  }

  const isNewFrame = session.lastUpdatedAt > sinceTime && !!session.frameImage;
  const isNewBarcode = (session.barcodeTimestamp || 0) > sinceTime && !!session.barcode;

  res.json({
    connected: Date.now() - session.lastUpdatedAt < 30000, // 30초 이내 핑 있으면 연결됨
    lastUpdatedAt: session.lastUpdatedAt,
    deviceName: session.deviceName || "스마트폰 노드",
    frameImage: isNewFrame ? session.frameImage : null,
    barcode: isNewBarcode ? session.barcode : null,
    barcodeTimestamp: session.barcodeTimestamp,
  });
});

// 바코드 소비 완료 후 초기화
app.post("/api/dev-bridge/clear-barcode", (req, res) => {
  const { sessionId = "dev-default" } = req.body;
  const session = devBridgeSessions.get(sessionId);
  if (session) {
    session.barcode = undefined;
  }
  res.json({ status: "ok" });
});

// 3. Vite 통합 및 정적 서빙
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VLM-AOI Server running on http://localhost:${PORT}`);
  });
}

startServer();
