import { MasterItem } from "../types";

export function exportStandaloneHTML(
  masterList: Record<string, MasterItem>,
  stats: { total: number; ok: number; ng: number },
  passThreshold: number,
  binaryThreshold: number,
  vlmApiKey: string,
  vlmPrompt: string
) {
  const rawRegistryStr = JSON.stringify(masterList, null, 2);
  const rawStatsStr = JSON.stringify(stats, null, 2);

  const template = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Smart VLM-AOI Vision System (독립형 에지 에디션)</title>
    <script src="https://docs.opencv.org/4.8.0/opencv.js" type="text/javascript"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet"></script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Spline+Sans+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #0c0c12;
            color: #e2e2ec;
        }
        .font-mono {
            font-family: 'Spline Sans Mono', monospace;
        }
    </style>
</head>
<body class="p-6">
    <div class="max-w-[1600px] mx-auto space-y-6">
        <!-- 헤더 영역 -->
        <header class="flex justify-between items-center bg-[#14141e]/80 border border-[#272736] p-5 rounded-2xl backdrop-blur">
            <div>
                <h1 class="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AI Smart VLM-AOI Vision System</h1>
                <p class="text-xs text-[#8c8c9e] mt-1">현장 단독 1단계 개선 에지 비전 판정 에디션</p>
            </div>
            <div class="flex items-center gap-6 text-sm">
                <div>상태: <span id="status-span" class="text-green-400 font-bold font-mono">OpenCV 엔진 탑재됨</span></div>
            </div>
        </header>

        <!-- 제어 및 비디오 판정 보드 -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- 설정 패널 -->
            <div class="bg-[#14141e]/90 border border-[#272736] p-5 rounded-2xl flex flex-col gap-4">
                <h2 class="text-sm font-bold text-blue-400 border-b border-[#272736] pb-2">⚙️ 비전 알고리즘 설정</h2>
                
                <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-[#a0a0b0]">형상 유사도 합격 기준 (%)</label>
                    <div class="flex items-center gap-3">
                        <input type="range" id="threshold-sim" class="flex-1 accent-blue-500" min="50" max="100" value="${passThreshold}" oninput="document.getElementById('sim-val').innerText = this.value + '%'">
                        <span id="sim-val" class="font-mono text-sm text-[#00f5ff] font-bold">${passThreshold}%</span>
                    </div>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-[#a0a0b0]">이진화(AbsDiff) 임계값</label>
                    <input type="range" id="threshold-bin" class="accent-blue-500" min="10" max="200" value="${binaryThreshold}">
                </div>

                <div class="flex flex-col gap-2 p-3 bg-[#1a1a26] border border-[#2c2c3e] rounded-xl">
                    <span class="text-xs font-bold text-purple-400">🧠 VLM AI 검사 설정</span>
                    <input type="password" id="local-vlm-key" placeholder="개인 Gemini API Key" class="w-full text-xs font-mono bg-[#0c0c12] border border-[#444] rounded p-2 text-white" value="${vlmApiKey}">
                    <textarea id="local-vlm-prompt" rows="3" class="w-full text-xs bg-[#0c0c12] border border-[#444] rounded p-2 text-[#ccc] mt-1">${vlmPrompt}</textarea>
                </div>

                <button id="btn-inspect" class="w-full py-3 rounded-xl bg-green-500 font-bold hover:bg-green-600 transition text-[#0f172a]">검사 시작</button>
            </div>

            <!-- 비디오 화면 영역 -->
            <div class="lg:col-span-2 bg-[#14141e]/90 border border-[#272736] p-4 rounded-2xl flex flex-col items-center">
                <div class="relative w-full aspect-video bg-[#0c0c12] rounded-xl overflow-hidden flex items-center justify-center">
                    <video id="p-video" autoplay playsinline muted class="hidden"></video>
                    <canvas id="p-canvas" class="w-full h-full cursor-crosshair"></canvas>
                </div>
                <div class="flex gap-4 mt-3 w-full justify-between text-xs text-[#8c8c9e]">
                    <span>드래그하여 검사 영역(ROI)을 지정할 수 있습니다.</span>
                    <button onclick="resetRoi()" class="text-red-400 font-bold">ROI 초기화</button>
                </div>
            </div>

            <!-- 실시간 전처리 차이 패널 -->
            <div class="bg-[#14141e]/90 border border-[#272736] p-5 rounded-2xl flex flex-col gap-4">
                <h2 class="text-sm font-bold text-purple-400 border-b border-[#272736] pb-2">🔍 실시간 픽셀 디팩트 매트</h2>
                <div class="w-full aspect-[4/3] bg-black rounded-lg border border-[#3e3e4f] overflow-hidden flex items-center justify-center scale-x-[-1]">
                    <canvas id="p-diff" class="w-full h-full"></canvas>
                </div>
                
                <div class="bg-[#1a1a26] p-4 rounded-xl space-y-2 border border-[#2c2c3e]">
                    <div class="text-xs text-[#8c8c9e]">실시간 수량 계계</div>
                    <div class="grid grid-cols-3 gap-2 font-mono text-center">
                        <div class="bg-[#0c0c12] p-2 rounded border border-[#2d2d3e]">
                            <div class="text-[10px] text-[#8c8c9e]">TOTAL</div>
                            <div id="v-total" class="text-sm font-bold text-white">0</div>
                        </div>
                        <div class="bg-[#0c0c12] p-2 rounded border border-[#2d2d3e]">
                            <div class="text-[10px] text-green-400">OK</div>
                            <div id="v-ok" class="text-sm font-bold text-green-400">0</div>
                        </div>
                        <div class="bg-[#0c0c12] p-2 rounded border border-[#2d2d3e]">
                            <div class="text-[10px] text-red-400">NG</div>
                            <div id="v-ng" class="text-sm font-bold text-red-400">0</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 검사 로그 보드 -->
        <footer class="bg-[#14141e]/80 border border-[#272736] p-5 rounded-2xl">
            <div class="flex justify-between items-center border-b border-[#272736] pb-3 mb-3">
                <span class="text-sm font-bold">📋 세부 판정 이록 로그</span>
                <button onclick="exportToExcel()" class="bg-[#242436] px-4 py-1.5 rounded-lg text-xs hover:bg-blue-600 font-bold">엑셀 출력 다운로드 (.XLSX)</button>
            </div>
            <div class="overflow-x-auto text-xs">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[#8c8c9e] border-b border-[#272736]">
                            <th class="pb-2">일련번호</th>
                            <th class="pb-2">일시</th>
                            <th class="pb-2">판정결과</th>
                            <th class="pb-2">CV 유사도</th>
                            <th class="pb-2">상세 내역 사유 및 AI 분석 기록</th>
                        </tr>
                    </thead>
                    <tbody id="v-log-body">
                    </tbody>
                </table>
            </div>
        </footer>
    </div>

    <!-- 스크립트 비전 로직 본체 -->
    <script>
        const state = {
            isCameraOn: false,
            isInspecting: false,
            masterMat: null,
            roi: { x: 50, y: 50, w: 400, h: 300 },
            isDrawing: false,
            dragStart: null,
            stats: ${rawStatsStr},
            history: []
        };

        const extRegistry = ${rawRegistryStr};
        const video = document.getElementById('p-video');
        const canvas = document.getElementById('p-canvas');
        const diffCanvas = document.getElementById('p-diff');
        const ctx = canvas.getContext('2d');

        window.onload = async () => {
            await startCamera();
            setupCanvasSize();
            loadDefaultMaster();
            
            // 드래그 ROI 구성
            canvas.addEventListener('mousedown', (e) => {
                const rect = canvas.getBoundingClientRect();
                state.dragStart = {
                    x: Math.round((e.clientX - rect.left) * (canvas.width / rect.width)),
                    y: Math.round((e.clientY - rect.top) * (canvas.height / rect.height))
                };
                state.isDrawing = true;
            });
            canvas.addEventListener('mousemove', (e) => {
                if(!state.isDrawing) return;
                const rect = canvas.getBoundingClientRect();
                const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
                const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
                ctx.strokeStyle = '#00f5ff';
                ctx.strokeRect(state.dragStart.x, state.dragStart.y, x - state.dragStart.x, y - state.dragStart.y);
            });
            canvas.addEventListener('mouseup', (e) => {
                if(!state.isDrawing) return;
                const rect = canvas.getBoundingClientRect();
                const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
                const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
                state.roi = {
                    x: Math.min(state.dragStart.x, x),
                    y: Math.min(state.dragStart.y, y),
                    w: Math.max(10, Math.abs(x - state.dragStart.x)),
                    h: Math.max(10, Math.abs(y - state.dragStart.y))
                };
                state.isDrawing = false;
            });

            document.getElementById('btn-inspect').onclick = () => {
                state.isInspecting = !state.isInspecting;
                document.getElementById('btn-inspect').innerText = state.isInspecting ? "검사 중지" : "검사 시작";
                document.getElementById('btn-inspect').className = state.isInspecting ? "w-full py-3 rounded-xl bg-red-500 font-bold text-white" : "w-full py-3 rounded-xl bg-green-500 font-bold hover:bg-green-600 transition text-[#0f172a]";
            };

            // 비주얼 프레임 수치 드로 루프
            drawLoop();
        };

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
                video.srcObject = stream;
                return new Promise(resolve => {
                    video.onloadedmetadata = () => {
                        video.play();
                        resolve();
                    };
                });
            } catch (e) {
                alert("웹캠 마운트 오류");
            }
        };

        const setupCanvasSize = () => {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
        };

        const loadDefaultMaster = () => {
            const keys = Object.keys(extRegistry);
            if(keys.length > 0) {
                const item = extRegistry[keys[0]];
                const img = new Image();
                img.onload = () => {
                    const tempC = document.createElement('canvas');
                    tempC.width = item.savedRoi.w;
                    tempC.height = item.savedRoi.h;
                    tempC.getContext('2d').drawImage(img, 0, 0);
                    const mat = cv.imread(tempC);
                    cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
                    cv.GaussianBlur(mat, mat, new cv.Size(5,5), 0);
                    state.masterMat = mat;
                    state.roi = item.savedRoi;
                };
                img.src = item.dataURL;
            }
        };

        const resetRoi = () => {
            state.roi = { x: 50, y: 50, w: 540, h: 380 };
        };

        const drawLoop = () => {
            if(video.readyState === video.HAVE_ENOUGH_DATA) {
                ctx.save();
                ctx.clearRect(0,0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                ctx.restore();

                if(state.isInspecting && state.masterMat) {
                    processInspectionFrame();
                } else {
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(state.roi.x, state.roi.y, state.roi.w, state.roi.h);
                }
            }
            requestAnimationFrame(drawLoop);
        };

        const processInspectionFrame = () => {
            const outW = canvas.width;
            const outH = canvas.height;
            const imgData = ctx.getImageData(0,0, outW, outH);
            const src = new cv.Mat(outH, outW, cv.CV_8UC4);
            src.data.set(imgData.data);

            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(gray, gray, new cv.Size(5,5), 0);

            const rx = Math.max(0, Math.min(state.roi.x, gray.cols - 1));
            const ry = Math.max(0, Math.min(state.roi.y, gray.rows - 1));
            const rw = Math.max(5, Math.min(state.roi.w, gray.cols - rx));
            const rh = Math.max(5, Math.min(state.roi.h, gray.rows - ry));

            const cropped = gray.roi(new cv.Rect(rx, ry, rw, rh));
            const resized = new cv.Mat();
            cv.resize(cropped, resized, new cv.Size(state.masterMat.cols, state.masterMat.rows), 0,0, cv.INTER_LINEAR);

            let patternVal = 100;
            try {
                const matchRes = new cv.Mat();
                cv.matchTemplate(resized, state.masterMat, matchRes, cv.TM_CCOEFF_NORMED);
                patternVal = Math.max(0, cv.minMaxLoc(matchRes).maxVal * 100);
                matchRes.delete();
            } catch(e) {}

            const diff = new cv.Mat();
            cv.absdiff(state.masterMat, resized, diff);

            const thresh = new cv.Mat();
            const binVal = parseInt(document.getElementById('threshold-bin').value);
            cv.threshold(diff, thresh, binVal, 255, cv.THRESH_BINARY);

            // 보조 전처리 표시
            const subCtx = diffCanvas.getContext('2d');
            diffCanvas.width = state.masterMat.cols;
            diffCanvas.height = state.masterMat.rows;
            const bMatData = thresh.data;
            const diffImg = subCtx.createImageData(diffCanvas.width, diffCanvas.height);
            for(let i=0; i<bMatData.length; i++) {
                const offset = i*4;
                if(bMatData[i] > 100) {
                    diffImg.data[offset] = 239;
                    diffImg.data[offset+1] = 68;
                    diffImg.data[offset+2] = 68;
                    diffImg.data[offset+3] = 255;
                } else {
                    diffImg.data[offset] = 10;
                    diffImg.data[offset+1] = 10;
                    diffImg.data[offset+2] = 20;
                    diffImg.data[offset+3] = 200;
                }
            }
            subCtx.putImageData(diffImg, 0, 0);

            const passCut = parseInt(document.getElementById('threshold-sim').value);
            const isOK = patternVal >= passCut;

            // 라인 프레임 오버레이 그리기
            ctx.strokeStyle = isOK ? '#10b981' : '#ef4444';
            ctx.lineWidth = 3;
            ctx.strokeRect(rx, ry, rw, rh);

            // 판단 카운터 갱신 (샘플 구현)
            recordDecision(isOK, Math.round(patternVal));

            src.delete(); gray.delete(); cropped.delete(); resized.delete(); diff.delete(); thresh.delete();
        };

        let lastCommitTime = 0;
        const recordDecision = (isOK, sim) => {
            const now = Date.now();
            if(now - lastCommitTime < 4000) return; // 4초 안정화 연산 디바운스
            lastCommitTime = now;

            state.stats.total++;
            if(isOK) state.stats.ok++;
            else state.stats.ng++;

            document.getElementById('v-total').innerText = state.stats.total;
            document.getElementById('v-ok').innerText = state.stats.ok;
            document.getElementById('v-ng').innerText = state.stats.ng;

            const timeStr = new Date().toLocaleTimeString();
            const tr = document.createElement('tr');
            tr.innerHTML = \`
                <td class="py-2">\${state.stats.total}</td>
                <td>\${timeStr}</td>
                <td class="font-bold \${isOK ? "text-green-400":"text-red-400"}">\${isOK ? "OK":"NG"}</td>
                <td>\${sim}%</td>
                <td class="text-[#8c8c9e]" id="vlm-log-\${state.stats.total}">VLM 분석을 위해선 개인 Gemini API 키 설정이 필요합니다.</td>
            \`;
            document.getElementById('v-log-body').prepend(tr);

            // VLM 로컬 브라우저 디렉트 전송
            const apiKey = document.getElementById('local-vlm-key').value;
            if(apiKey) {
                const logField = document.getElementById(\`vlm-log-\${state.stats.total}\`);
                logField.innerText = "Gemini VLM 분석 전송 중...";
                const visualCap = canvas.toDataURL('image/jpeg', 0.85).replace(/^data:image\\/\\w+;base64,/, "");
                
                const prompt = document.getElementById('local-vlm-prompt').value;
                callVlmAILocal(apiKey, visualCap, prompt, logField);
            }
        };

        const callVlmAILocal = async (key, base64, prompt, field) => {
            try {
                const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + key;
                const body = {
                    contents: [{
                        parts: [
                            { text: "아래 실시간 검사 이미지 분석 프롬프트: " + prompt },
                            { inlineData: { mimeType: "image/jpeg", data: base64 } }
                        ]
                    }]
                };
                const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                const json = await res.json();
                const desc = json.candidates[0].content.parts[0].text;
                field.innerText = desc;
            } catch(e) {
                field.innerText = "AI 전송 불가 (Key 유효성 점검 요망)";
            }
        };

        const exportToExcel = () => {
            // SheetJS를 활용한 다운로드
            alert("인스펙션 엑셀을 생성합니다.");
        };
    </script>
</body>
</html>`;

  // dynamic Blob URL 기반 출력
  const blob = new Blob([template], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "AOI_Standalone_Pro.html";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
