var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "20mb" }));
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY\uAC00 \uC11C\uBC84 .env \uD639\uC740 \uC124\uC815\uC5D0 \uC800\uC7A5\uB418\uC5B4 \uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
app.post("/api/inspect", async (req, res) => {
  try {
    const { image, prompt, isUpgradeCheck, expectedResult } = req.body;
    if (!image) {
      res.status(400).json({ error: "\uC774\uBBF8\uC9C0 \uB370\uC774\uD130(base64)\uAC00 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
      return;
    }
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const ai = getGeminiClient();
    const systemInstruction = `
      \uB2F9\uC2E0\uC740 \uD604\uB300 \uACF5\uC7A5 \uC790\uB3D9\uD654 \uD604\uC7A5\uC5D0\uC11C \uB3D9\uC791\uD558\uB294 \uCD08\uC815\uBC00 \uAE30\uAD6C\uBB3C \uC790\uB3D9 \uAD11\uD559 \uAC80\uC0AC(AOI) \uBE44\uC804 AI \uC2DC\uC2A4\uD15C\uC785\uB2C8\uB2E4.
      \uC804\uB2EC\uB41C \uC2E4\uC2DC\uAC04 \uCEA1\uCC98 \uC774\uBBF8\uC9C0\uB97C \uCCA0\uC800\uD788 \uBAA8\uB2C8\uD130\uB9C1\uD558\uC5EC \uBBF8\uC138 \uACB0\uD568\uC774\uB098 \uC870\uB9BD \uC774\uC0C1\uC744 \uC2E4\uC2DC\uAC04 \uD310\uC815\uD558\uC2ED\uC2DC\uC624.
      
      \uD310\uC815 \uAE30\uC900:
      1. \uD45C\uBA74 \uC190\uC0C1: \uC678\uBD80 \uC2A4\uD06C\uB798\uCE58, \uCC0D\uD798, \uC624\uC5FC, \uBA3C\uC9C0 \uBC0F \uBCC0\uC0C9\uC774 \uC870\uB9BD \uC131\uB2A5\uACFC \uC678\uAD00 \uD488\uC9C8\uC5D0 \uC601\uD5A5\uC744 \uBBF8\uCE58\uB294\uC9C0 \uBC1D\uD600\uB0B4\uC2ED\uC2DC\uC624.
      2. \uC870\uB9BD \uC815\uB82C: \uAE30\uAD6C\uBB3C \uD30C\uD2B8\uB4E4\uC774 \uC5B4\uAE0B\uB0AC\uAC70\uB098, \uB098\uC0AC \uB204\uB77D, \uBE48\uD2C8\uC774 \uBC8C\uC5B4\uC9C0\uAC70\uB098 \uC798\uBABB \uCCB4\uACB0\uB418\uC5C8\uB294\uC9C0 \uBD84\uC11D\uD558\uC2ED\uC2DC\uC624.
      3. \uC9C0\uC815\uB41C \uC608\uC0C1 \uD488\uBAA9 \uB9E4\uCE6D: \uBC14\uCF54\uB4DC\uB098 \uAE30\uC900 \uBD80\uD488 \uD0C0\uC785 \uC815\uBCF4\uAC00 \uC8FC\uC5B4\uC9C4 \uACBD\uC6B0 \uC774\uBBF8\uC9C0 \uB0B4 \uD53C\uCC98\uC640 \uC77C\uCE58\uD558\uB294 \uC9C0 \uAC80\uD1A0\uD558\uC2ED\uC2DC\uC624.

      \uC751\uB2F5\uC740 \uBC18\uB4DC\uC2DC \uC815\uC758\uB41C Schema \uD615\uC2DD\uC758 JSON\uC73C\uB85C\uB9CC \uCD9C\uB825\uD574\uC57C \uD569\uB2C8\uB2E4.
    `;
    const userPrompt = prompt || "\uC804\uCCB4 \uAE30\uAD6C\uBB3C\uC774 \uC591\uD488\uC73C\uB85C \uC628\uC804\uD558\uAC8C \uCCB4\uACB0\uB418\uACE0 \uD45C\uBA74\uC5D0 \uACB0\uD568\uC774 \uC5C6\uB294\uC9C0, \uC591\uD638 \uC5EC\uBD80\uB97C 'OK' \uD639\uC740 'NG'\uB85C \uAC80\uC0AC\uD574\uC8FC\uC2ED\uC2DC\uC624.";
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data
      }
    };
    const textPart = {
      text: userPrompt
    };
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            result: {
              type: import_genai.Type.STRING,
              description: "\uCD5C\uC885 \uAC80\uC0AC \uD310\uC815 \uACB0\uACFC: \uBC18\uB4DC\uC2DC 'OK' (\uC815\uC0C1 \uC591\uD488) \uB610\uB294 'NG' (\uBD88\uB7C9\uD488) \uC911 \uD558\uB098\uC5EC\uC57C \uD569\uB2C8\uB2E4."
            },
            reason: {
              type: import_genai.Type.STRING,
              description: "\uD310\uC815 \uC0AC\uC720\uC5D0 \uB300\uD55C \uBA85\uD655\uD558\uACE0 \uC804\uBB38\uC801\uC778 \uD55C\uAD6D\uC5B4 \uC124\uBA85 (\uC608: '\uC911\uC559 \uC870\uC778\uD2B8 \uBD80 \uC815\uB82C \uC5B4\uAE0B\uB0A8 2.4mm \uBC1C\uC0DD', '\uC804\uBA74 \uD558\uC6B0\uC9D5\uC5D0 \uBBF8\uC138 \uC2A4\uD06C\uB798\uCE58 \uAC80\uCD9C')"
            },
            confidence: {
              type: import_genai.Type.INTEGER,
              description: "\uD310\uC815\uC758 \uC2E0\uB8B0\uB3C4\uB97C \uBC31\uBD84\uC728(0-100) \uC815\uC218\uB85C \uC791\uC131\uD558\uC2ED\uC2DC\uC624."
            },
            defects: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  x: { type: import_genai.Type.INTEGER, description: "\uCEA1\uCC98 \uC774\uBBF8\uC9C0 \uAC00\uB85C \uB300\uBE44 \uACB0\uD568 \uC911\uC2EC\uC758 \uBC31\uBD84\uC728 \uC704\uCE58 (0~100)" },
                  y: { type: import_genai.Type.INTEGER, description: "\uCEA1\uCC98 \uC774\uBBF8\uC9C0 \uC138\uB85C \uB300\uBE44 \uACB0\uD568 \uC911\uC2EC\uC758 \uBC31\uBD84\uC728 \uC704\uCE58 (0~100)" },
                  w: { type: import_genai.Type.INTEGER, description: "\uACB0\uD568 \uAC00\uB85C \uD3ED \uBE44\uC728 (0~100)" },
                  h: { type: import_genai.Type.INTEGER, description: "\uACB0\uD568 \uC138\uB85C \uB192\uC774 \uBE44\uC728 (0~100)" },
                  label: { type: import_genai.Type.STRING, description: "\uACB0\uD568 \uC720\uD615 (\uC608: '\uC2A4\uD06C\uB798\uCE58', '\uB098\uC0AC\uB204\uB77D', '\uC815\uB82C\uBBF8\uD761', '\uBCC0\uC0C9', '\uCC0D\uD798')" }
                },
                required: ["x", "y", "w", "h", "label"]
              },
              description: "\uC774\uBBF8\uC9C0 \uB0B4\uC5D0\uC11C \uBC1C\uACAC\uB41C \uBBF8\uC138 \uACB0\uD568 \uB610\uB294 \uC774\uC0C1 \uC9C0\uC810\uB4E4\uC758 \uBC14\uC6B4\uB529 \uC815\uBCF4 \uBAA9\uB85D (\uACB0\uD568\uC774 \uC5C6\uB2E4\uBA74 \uBE48 \uBC30\uC5F4)"
            }
          },
          required: ["result", "reason", "confidence", "defects"]
        }
      }
    });
    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini \uC751\uB2F5\uC744 \uBD84\uC11D\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    }
    const parsedResult = JSON.parse(resultText.trim());
    res.json(parsedResult);
  } catch (error) {
    console.error("Gemini VLM AOI \uAC80\uC0AC \uC911 \uC624\uB958:", error);
    res.status(500).json({ error: error.message || "VLM \uD310\uC815 \uB3C4\uC911 \uB0B4\uBD80 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." });
  }
});
var devBridgeSessions = /* @__PURE__ */ new Map();
app.get("/api/dev-bridge/session", (req, res) => {
  const sessionId = req.query.sessionId || "dev-default";
  let session = devBridgeSessions.get(sessionId);
  if (!session) {
    session = {
      id: sessionId,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now()
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
      deviceName: session.deviceName
    }
  });
});
app.post("/api/dev-bridge/push", (req, res) => {
  const { sessionId = "dev-default", frameImage, barcode, deviceName, isStreaming } = req.body;
  let session = devBridgeSessions.get(sessionId);
  if (!session) {
    session = {
      id: sessionId,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now()
    };
    devBridgeSessions.set(sessionId, session);
  }
  session.lastUpdatedAt = Date.now();
  if (deviceName) session.deviceName = deviceName;
  if (isStreaming !== void 0) session.isStreaming = isStreaming;
  if (frameImage) session.frameImage = frameImage;
  if (barcode) {
    session.barcode = barcode;
    session.barcodeTimestamp = Date.now();
  }
  res.json({ status: "ok", timestamp: session.lastUpdatedAt });
});
app.get("/api/dev-bridge/pull", (req, res) => {
  const sessionId = req.query.sessionId || "dev-default";
  const sinceTime = Number(req.query.since || 0);
  const session = devBridgeSessions.get(sessionId);
  if (!session) {
    res.json({
      connected: false,
      lastUpdatedAt: 0
    });
    return;
  }
  const isNewFrame = session.lastUpdatedAt > sinceTime && !!session.frameImage;
  const isNewBarcode = (session.barcodeTimestamp || 0) > sinceTime && !!session.barcode;
  res.json({
    connected: Date.now() - session.lastUpdatedAt < 3e4,
    // 30초 이내 핑 있으면 연결됨
    lastUpdatedAt: session.lastUpdatedAt,
    deviceName: session.deviceName || "\uC2A4\uB9C8\uD2B8\uD3F0 \uB178\uB4DC",
    frameImage: isNewFrame ? session.frameImage : null,
    barcode: isNewBarcode ? session.barcode : null,
    barcodeTimestamp: session.barcodeTimestamp
  });
});
app.post("/api/dev-bridge/clear-barcode", (req, res) => {
  const { sessionId = "dev-default" } = req.body;
  const session = devBridgeSessions.get(sessionId);
  if (session) {
    session.barcode = void 0;
  }
  res.json({ status: "ok" });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VLM-AOI Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
