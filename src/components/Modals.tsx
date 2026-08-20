import React from "react";
import { CheckCircle2 } from "lucide-react";

interface SaveMasterModalProps {
  theme: "dark" | "light";
  showSaveMasterModal: boolean;
  newMasterName: string;
  setNewMasterName: (val: string) => void;
  setShowSaveMasterModal: (val: boolean) => void;
  confirmRegisterMaster: () => void;
}

interface ActiveOkModalProps {
  activeOkModal: boolean;
  triggerNextInspection: () => void;
}

export const SaveMasterModal: React.FC<SaveMasterModalProps> = ({
  theme,
  showSaveMasterModal,
  newMasterName,
  setNewMasterName,
  setShowSaveMasterModal,
  confirmRegisterMaster,
}) => {
  if (!showSaveMasterModal) return null;

  return (
    <div className="fixed inset-0 bg-[#000]/70 z-50 flex items-center justify-center p-4">
      <div className={`border rounded-2xl max-w-sm w-full p-6 space-y-4 transition-all shadow-xl ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' :
        'bg-[#14141e] border-[#28283a] text-slate-200'
      }`}>
        <h3 className={`text-sm font-bold flex items-center gap-1.5 pb-2 border-b ${
          theme === 'light' ? 'text-indigo-600 border-slate-100' :
          'text-blue-400 border-[#212130]'
        }`}>
          📂 기준 양품 품목 등록
        </h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-[#a3a3b3]'}`}>식별 고유 코드 및 명칭</label>
            <input 
              type="text" 
              value={newMasterName}
              onChange={(e) => setNewMasterName(e.target.value.replace(/[\/\\:*?"<>|]/g, "_"))}
              className={`w-full text-xs font-mono rounded-lg p-2.5 focus:outline-none transition-all ${
                theme === 'light' ? 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-indigo-400' :
                'bg-[#0c0c12] border border-[#2c2c3e] text-white focus:border-blue-500'
              }`} 
              placeholder="예: PRODUCT_A_V1_01"
            />
          </div>
          <p className={`text-[10px] leading-relaxed ${theme === 'light' ? 'text-slate-400' : 'text-[#7c7c8c]'}`}>
            바코드 모델 자동연계를 위해, 바코드 리더기로 검출할 고유 인덱스코드와 마스터 파일명을 동일하게 지정하십시오.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSaveMasterModal(false)} className={`flex-1 py-2 rounded-lg font-semibold border transition cursor-pointer ${
            theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' :
            'bg-neutral-800 hover:bg-neutral-700 text-[#ccc] border-transparent'
          }`}>취소</button>
          <button onClick={confirmRegisterMaster} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">확정 등록</button>
        </div>
      </div>
    </div>
  );
};

export const ActiveOkModal: React.FC<ActiveOkModalProps> = ({
  activeOkModal,
  triggerNextInspection,
}) => {
  if (!activeOkModal) return null;

  return (
    <div className="fixed inset-0 bg-[#000]/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#121614] border border-emerald-500/20 rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-pulse">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-emerald-400 font-bold text-sm">OK (정상양품) 진단 완료</h3>
          <p className="text-xs text-[#9caba3] leading-relaxed">
            판정본 이미지 백업 다운로드가 완료되었습니다.<br />
            스펙에 합치되어 연속 가공이 수동 대기 중입니다.
          </p>
        </div>

        <button 
          onClick={triggerNextInspection}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#09100d] font-bold text-sm shadow-md cursor-pointer"
        >
          다음 제품 검사 개시
        </button>
      </div>
    </div>
  );
};
