
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import Spinner from './components/Spinner';
import { generateStudioPortrait } from './services/geminiService';
import type { UploadedImage, GeneratedResult, GenerationOptions } from './types';

// --- Reusable UI Components defined within App.tsx ---

const MagicWandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const OptionSelect: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; disabled?: boolean }> = ({ label, value, onChange, children, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full bg-slate-700/50 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </select>
  </div>
);


const lightingOptions = {
  '基礎人像燈光': [
    { name: '柔光正面光', prompt: 'soft frontal lighting, evenly lit face, studio portrait' },
    { name: '三點布光', prompt: 'three-point lighting setup: key light, fill light, back light, professional studio portrait' },
    { name: 'Rembrandt 光', prompt: 'Rembrandt lighting, triangle of light on the cheek, dramatic studio portrait' },
    { name: 'Split 分割光', prompt: 'split lighting, one side bright, the other side in shadow, dramatic portrait' },
    { name: 'Loop 環形光', prompt: 'loop lighting, small shadow next to the nose, balanced studio portrait' },
    { name: 'Butterfly 蝴蝶光', prompt: 'butterfly lighting, shadow under the nose, beauty studio portrait' },
  ],
  '氛圍燈光': [
    { name: '高調光 (High-key)', prompt: 'high-key lighting, bright background, soft shadows, cheerful portrait' },
    { name: '低調光 (Low-key)', prompt: 'low-key lighting, dark background, moody studio portrait' },
    { name: '戲劇硬光', prompt: 'hard lighting, strong shadows, high contrast, dramatic portrait' },
    { name: '逆光剪影', prompt: 'backlighting, silhouette effect, glowing rim light, dramatic studio portrait' },
  ],
  '進階光源控制': [
    { name: '髮絲光', prompt: 'studio portrait with hair light, subtle rim light on hair, professional studio look' },
    { name: '輪廓光 (Rim Light)', prompt: 'rim lighting, glowing edges around face and shoulders, dramatic portrait' },
    { name: '側逆光', prompt: 'back-side lighting, one side highlighted from behind, cinematic portrait' },
    { name: '交叉光', prompt: 'cross lighting, two lights from opposite angles, textured dramatic portrait' },
    { name: '聚光燈 (Spotlight)', prompt: 'spotlight on face, dark surroundings, theatrical studio portrait' },
  ],
  '特殊效果光': [
    { name: '窗光模擬', prompt: 'studio portrait, window light simulation, soft natural daylight, moody atmosphere' },
    { name: '環狀燈 (Ring Light)', prompt: 'ring light portrait, circular catchlight in the eyes, beauty close-up' },
    { name: '漸層背景光', prompt: 'gradient background lighting, smooth color transition, professional studio portrait' },
    { name: '光暈效果 (Halo Light)', prompt: 'halo lighting behind the head, glowing aura effect, artistic studio portrait' },
    { name: '彩色濾光片 (Gel Lighting)', prompt: 'studio portrait with colored gels, red and blue lighting, creative dramatic effect' },
  ],
};

const backgroundOptions = {
  '🎨 基礎背景': [
    { name: '純白背景', prompt: 'plain white background' },
    { name: '純黑背景', prompt: 'plain black background' },
    { name: '灰色漸層背景', prompt: 'gradient gray backdrop' },
    { name: '彩色純色背景（紅/藍/黃/綠）', prompt: 'solid color background (red/blue/yellow/green)' },
    { name: '米白/奶茶色背景', prompt: 'beige background' },
    { name: '深藍背景', prompt: 'deep blue backdrop' },
    { name: '大地色背景', prompt: 'earth tone backdrop' },
  ],
  '🖼️ 材質背景': [
    { name: '絨布布幕背景', prompt: 'velvet fabric backdrop' },
    { name: '紗布質感背景', prompt: 'gauze fabric backdrop' },
    { name: '亞麻布背景', prompt: 'linen fabric backdrop' },
    { name: '金屬質感背景', prompt: 'metallic texture background' },
    { name: '大理石紋背景', prompt: 'marble texture backdrop' },
    { name: '木質紋背景', prompt: 'wooden texture backdrop' },
    { name: '水泥牆背景', prompt: 'concrete wall backdrop' },
    { name: '磚牆背景', prompt: 'brick wall background' },
    { name: '單色紙捲背景', prompt: 'seamless paper roll backdrop' },
  ],
  '🌈 特殊棚拍背景': [
    { name: '彩色漸層背景', prompt: 'colorful gradient backdrop' },
    { name: '彩色光影背景', prompt: 'colorful light projection' },
    { name: '抽象幾何圖形背景', prompt: 'abstract geometric backdrop' },
    { name: '圓點背景', prompt: 'polka dot backdrop' },
    { name: '條紋背景', prompt: 'striped backdrop' },
    { name: '網格背景', prompt: 'grid pattern backdrop' },
    { name: '泡泡光暈背景', prompt: 'bokeh light backdrop' },
    { name: '煙霧感背景', prompt: 'foggy backdrop' },
    { name: '光影線條背景', prompt: 'shadow stripe backdrop' },
    { name: '激光光束背景', prompt: 'laser light backdrop' },
  ],
  '✨ 高級商業風': [
    { name: '高級布幔背景', prompt: 'luxury drape backdrop' },
    { name: '燈泡牆背景', prompt: 'light bulb wall backdrop' },
    { name: 'LED 螢幕背景', prompt: 'LED screen backdrop' },
    { name: '霓虹燈字樣背景', prompt: 'neon sign backdrop' },
    { name: '簡約高級灰背景', prompt: 'minimalist gray backdrop' },
    { name: '金色質感背景', prompt: 'golden texture backdrop' },
    { name: '銀色質感背景', prompt: 'silver metallic backdrop' },
  ],
  '🏙️ 擬真環境模擬背景': [
    { name: '書架牆背景', prompt: 'bookshelf backdrop' },
    { name: '辦公室假景背景', prompt: 'office set backdrop' },
    { name: '咖啡廳假景背景', prompt: 'coffee shop set backdrop' },
    { name: '美術館白牆背景', prompt: 'art gallery wall backdrop' },
    { name: '室內窗景背景', prompt: 'indoor window backdrop' },
    { name: '歐式雕花牆背景', prompt: 'european carved wall backdrop' },
    { name: '工業風鐵架背景', prompt: 'industrial rack backdrop' },
  ],
  '🎭 創意與藝術風格': [
    { name: '油畫風背景', prompt: 'oil painting backdrop' },
    { name: '墨水暈染背景', prompt: 'ink wash backdrop' },
    { name: '漫畫插畫背景', prompt: 'comic illustration backdrop' },
    { name: '星空背景', prompt: 'starry sky backdrop' },
    { name: '宇宙銀河背景', prompt: 'galaxy backdrop' },
    { name: '煙火背景', prompt: 'fireworks backdrop' },
    { name: '抽象彩繪背景', prompt: 'abstract painting backdrop' },
    { name: '浮世繪風背景', prompt: 'ukiyo-e style backdrop' },
    { name: 'AI 幾何藝術背景', prompt: 'AI generative art geometric backdrop' },
  ],
};

const angleOptions = [
  { name: '平視角', prompt: 'eye-level angle' },
  { name: '俯視角', prompt: 'high angle shot' },
  { name: '仰視角', prompt: 'low angle shot' },
  { name: '45 度角', prompt: '45-degree angle' },
  { name: '側面角度', prompt: 'side profile angle' },
  { name: '背面角度', prompt: 'back view angle' },
  { name: '鏡中倒影角度', prompt: 'mirror reflection shot' },
  { name: '透過玻璃拍攝角度', prompt: 'shot through glass' },
  { name: '俯拍桌面角度', prompt: 'top-down angle' },
  { name: '仰拍天花板角度', prompt: 'worm’s-eye view' },
  { name: '斜角度（Dutch Angle）', prompt: 'Dutch angle' },
  { name: '部分遮擋角度', prompt: 'partially obscured angle' },
  { name: '遮光投影角度', prompt: 'shadow casting angle' },
  { name: 'Y2K 拍照', prompt: 'Y2K nostalgic selfie style, high-angle shot from above, exaggerated head-to-body ratio, retro 2000s aesthetic, selfie angle as if holding the phone with one hand, but without showing the phone' },
];

const compositionOptions = [
  { name: '特寫（臉部）', prompt: 'close-up shot' },
  { name: '頭肩照', prompt: 'head-and-shoulders shot' },
  { name: '半身照', prompt: 'half body shot' },
  { name: '三分之二身', prompt: 'three-quarter body shot' },
  { name: '全身照', prompt: 'full body shot' },
  { name: '超近距離細節', prompt: 'extreme close-up' },
  { name: '遠景人像（含環境）', prompt: 'wide shot portrait' },
];

const styleOptions = [
  { name: '證件照', prompt: 'ID photo' },
  { name: '商務專業', prompt: 'professional business portrait' },
  { name: '時尚雜誌感', prompt: 'fashion magazine style' },
  { name: '藝術黑白', prompt: 'artistic black and white' },
  { name: '青春校園風', prompt: 'youthful school style' },
  { name: '韓式大頭貼', prompt: 'Korean photo booth style, 4-grid photo collage, each grid a head-and-shoulders portrait, pastel Korean studio background, soft diffused lighting. Each photo shows a different cute and exaggerated expression and pose, commonly used in sticker photo booths. Include playful props such as bunny ear headbands, finger hearts, funny glasses, plush toys, or balloons. Fun and lively Korean photo booth aesthetic.' },
];

const lensOptions = [
  { name: '50mm (標準)', prompt: '50mm standard lens' },
  { name: '85mm (特寫)', prompt: '85mm portrait lens' },
  { name: '35mm (環境人像)', prompt: '35mm wide-angle lens for environmental portrait' },
];

const expressionOptions = [
  { name: '保持原始表情', prompt: 'keep the original expression' },
  { name: '自然微笑', prompt: 'a natural, gentle smile' },
  { name: '開心', prompt: 'a happy, joyful expression' },
  { name: '嚴肅', prompt: 'a serious, neutral expression' },
  { name: '沉思', prompt: 'a thoughtful, pensive expression' },
  { name: '大笑', prompt: 'big joyful laugh' },
  { name: '驚喜', prompt: 'pleasantly surprised' },
  { name: '驚訝', prompt: 'shocked or astonished expression' },
  { name: '生氣', prompt: 'angry expression' },
  { name: '憤怒', prompt: 'furious expression' },
  { name: '傷心', prompt: 'sad expression' },
  { name: '哭泣', prompt: 'crying with visible tears' },
  { name: '害羞', prompt: 'shy and bashful look' },
  { name: '緊張', prompt: 'nervous and uneasy expression' },
];

const poseOptions = [
  { name: '保持原始姿勢', prompt: 'keep the original pose' },
  { name: '正面站姿', prompt: 'standing, facing forward' },
  { name: '交叉手臂', prompt: 'arms crossed' },
  { name: '手托下巴', prompt: 'hand on chin' },
  { name: '雙手自然下垂', prompt: 'standing with arms relaxed at sides' },
  { name: '雙手插腰', prompt: 'standing with hands on hips' },
  { name: '單手插腰', prompt: 'standing with one hand on hip' },
  { name: '單手扶頰', prompt: 'standing with one hand touching face' },
  { name: '一手插口袋', prompt: 'standing with one hand in pocket' },
  { name: '回眸看鏡頭', prompt: 'standing, looking back over shoulder' },
  { name: '端坐', prompt: 'sitting upright' },
  { name: '單腿翹起', prompt: 'sitting with one leg crossed over the other' },
  { name: '單手托腮', prompt: 'sitting with one hand resting on chin' },
  { name: '手撫頭髮', prompt: 'hand touching hair' },
  { name: '手比V', prompt: 'making a V sign with fingers' },
  { name: '用單手拿著手機', prompt: 'holding a phone with one hand, selfie pose' },
  { name: '雙手托臉', prompt: 'both hands cupping face' },
  { name: '撥弄頭髮', prompt: 'playing with hair' },
  { name: '拿著花束', prompt: 'holding a bouquet' },
  { name: '跳躍', prompt: 'jumping in the air' },
  { name: '邁步走向鏡頭', prompt: 'walking toward the camera' },
  { name: '邁步離開鏡頭', prompt: 'walking away from the camera' },
  { name: '轉身揮手', prompt: 'turning around and waving' },
];


const ControlPanel: React.FC<{
  options: GenerationOptions,
  setOptions: React.Dispatch<React.SetStateAction<GenerationOptions>>,
  lightingCategory: string,
  onLightingCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
  backgroundCategory: string,
  onBackgroundCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
}> = ({ options, setOptions, lightingCategory, onLightingCategoryChange, backgroundCategory, onBackgroundCategoryChange }) => {
  const handleChange = (field: keyof GenerationOptions) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="bg-slate-800/50 ring-1 ring-slate-700 rounded-xl p-4 sm:p-6 shadow-lg mt-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-300 text-center">風格設定</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OptionSelect label="人像風格" value={options.style} onChange={handleChange('style')}>
          <option value="">請選擇...</option>
          {styleOptions.map(opt => (
            <option key={opt.prompt} value={opt.prompt}>{opt.name}</option>
          ))}
        </OptionSelect>
        
        <OptionSelect label="燈光類別" value={lightingCategory} onChange={onLightingCategoryChange}>
          <option value="">請選擇...</option>
          {Object.keys(lightingOptions).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </OptionSelect>

        <OptionSelect label="燈光選擇" value={options.lighting} onChange={handleChange('lighting')} disabled={!lightingCategory}>
          <option value="">請先選擇燈光類別</option>
          {lightingCategory && lightingOptions[lightingCategory as keyof typeof lightingOptions].map(opt => (
            <option key={opt.prompt} value={opt.prompt}>{opt.name}</option>
          ))}
        </OptionSelect>

        <OptionSelect label="背景類別" value={backgroundCategory} onChange={onBackgroundCategoryChange}>
           <option value="">請選擇...</option>
          {Object.keys(backgroundOptions).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </OptionSelect>

        <OptionSelect label="背景選擇" value={options.background} onChange={handleChange('background')} disabled={!backgroundCategory}>
          <option value="">請先選擇背景類別</option>
          {backgroundCategory && backgroundOptions[backgroundCategory as keyof typeof backgroundOptions].map(opt => (
            <option key={opt.prompt} value={opt.prompt}>{opt.name}</option>
          ))}
        </OptionSelect>
        
        <OptionSelect label="拍攝角度" value={options.angle} onChange={handleChange('angle')}>
          <option value="">請選擇...</option>
          {angleOptions.map(opt => (
            <option key={opt.prompt} value={opt.prompt}>{opt.name}</option>
          ))}
        </OptionSelect>

        <OptionSelect label="距離構圖" value={options.composition} onChange={handleChange('composition')}>
          <option value="">請選擇...</option>
          {compositionOptions.map(opt => (
            <option key={opt.prompt} value={opt.prompt}>{opt.name}</option>
          ))}
        </OptionSelect>

        <OptionSelect label="鏡頭焦段" value={options.lens} onChange={handleChange('lens')}>
           <option value="">請選擇...</option>
           {lensOptions.map(opt => (
            <option key={opt.prompt} value={opt.prompt}>{opt.name}</option>
          ))}
        </OptionSelect>
         <OptionSelect label="AI 表情生成" value={options.expression} onChange={handleChange('expression')}>
           {expressionOptions.map(opt => (
            <option key={opt.prompt} value={opt.prompt}>{opt.name}</option>
          ))}
        </OptionSelect>
        <OptionSelect label="肢體動作" value={options.pose} onChange={handleChange('pose')}>
           {poseOptions.map(opt => (
            <option key={opt.prompt} value={opt.prompt}>{opt.name}</option>
          ))}
        </OptionSelect>
      </div>
    </div>
  );
};

const ClothingPanel: React.FC<{
  prompt: string;
  setPrompt: (p: string) => void;
  image: UploadedImage | null;
  setImage: (i: UploadedImage | null) => void;
}> = ({ prompt, setPrompt, image, setImage }) => {
  return (
    <div className="bg-slate-800/50 ring-1 ring-slate-700 rounded-xl p-4 sm:p-6 shadow-lg mt-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-300 text-center">服裝與配件 (選填)</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col">
            <label className="block text-sm font-medium text-slate-400 mb-1">文字描述</label>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例如：穿著一件白色絲綢襯衫和一條黑色領帶"
                className="w-full h-full bg-slate-700/50 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
            />
        </div>
        <div className="h-48 lg:h-auto">
            <ImageUploader
                title="或上傳服裝參考圖"
                onImageUpload={setImage}
                imagePreviewUrl={image?.previewUrl || null}
            />
        </div>
      </div>
    </div>
  );
};

const AdditionalPromptPanel: React.FC<{
  prompt: string;
  setPrompt: (p: string) => void;
}> = ({ prompt, setPrompt }) => {
  return (
    <div className="bg-slate-800/50 ring-1 ring-slate-700 rounded-xl p-4 sm:p-6 shadow-lg mt-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-300 text-center">額外指令 (選填)</h3>
      <div>
        <label htmlFor="additional-prompt" className="block text-sm font-medium text-slate-400 mb-2">
          備註:輸入任何想特別強調的細節，例如：'沒有雀斑', '手拿鈔票', '頭髮整齊'。
        </label>
        <textarea
          id="additional-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="請在此輸入..."
          className="w-full bg-slate-700/50 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
          rows={3}
        />
      </div>
    </div>
  );
};

const CameraCapture: React.FC<{ onCapture: (image: UploadedImage) => void }> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (active) {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setStream(mediaStream);
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("無法啟用相機。請檢查權限設定。");
      }
    };
    startCamera();

    return () => {
      active = false;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      const [header, base64Data] = dataUrl.split(',');
      onCapture({
        base64: base64Data,
        mimeType: 'image/jpeg',
        previewUrl: dataUrl,
      });
    }
  };

  if (error) {
    return <div className="text-red-400 text-center p-4">{error}</div>;
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <div className="relative w-full aspect-square bg-slate-900/50 rounded-lg overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
      </div>
      <button onClick={handleCapture} className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition">
        拍攝照片
      </button>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<UploadedImage | null>(null);
  const [clothingImage, setClothingImage] = useState<UploadedImage | null>(null);
  const [clothingPrompt, setClothingPrompt] = useState<string>('');
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('');
  const [inputMode, setInputMode] = useState<'upload' | 'camera'>('upload');
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [lightingCategory, setLightingCategory] = useState<string>('');
  const [backgroundCategory, setBackgroundCategory] = useState<string>('');
  
  const [options, setOptions] = useState<GenerationOptions>({
    style: '',
    lighting: '',
    background: '',
    angle: '',
    composition: '',
    lens: '',
    expression: 'keep the original expression',
    pose: 'keep the original pose',
  });
  
  useEffect(() => {
    const resetToDefaults = () => {
        setOptions(prev => ({
            ...prev,
            lighting: '',
            background: '',
            angle: '',
            composition: '',
            lens: '',
            expression: 'keep the original expression',
            pose: 'keep the original pose',
        }));
        setLightingCategory('');
        setBackgroundCategory('');
    };

    if (options.style === 'ID photo') {
        setOptions(prev => ({
            ...prev,
            composition: 'head-and-shoulders shot',
            background: 'plain white background',
            angle: 'eye-level angle',
            pose: 'standing, facing forward',
            lighting: '',
            lens: '',
            expression: 'keep the original expression',
        }));
        setLightingCategory(''); 
        setBackgroundCategory('🎨 基礎背景');
    } else { 
        resetToDefaults();
    }
  }, [options.style]);
  
  const handleLightingCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as keyof typeof lightingOptions;
    setLightingCategory(newCategory);
    setOptions(prev => ({
        ...prev,
        lighting: newCategory ? lightingOptions[newCategory][0].prompt : ''
    }));
  };

  const handleBackgroundCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as keyof typeof backgroundOptions;
    setBackgroundCategory(newCategory);
    setOptions(prev => ({
        ...prev,
        background: newCategory ? backgroundOptions[newCategory][0].prompt : ''
    }));
  };


  const buildPrompt = useCallback((opts: GenerationOptions, clothingText: string, hasClothingImg: boolean, additionalText: string): string => {
    const promptLines: string[] = [
      'Generate a photorealistic, high-quality studio portrait based on the person in the primary input image.',
    ];

    const settings: string[] = [];
    if (opts.style) settings.push(`- Overall Style: '${opts.style}'.`);
    if (opts.lighting) settings.push(`- Lighting: '${opts.lighting}'.`);
    if (opts.background) settings.push(`- Background: A '${opts.background}' background.`);
    if (opts.angle) settings.push(`- Camera Angle: '${opts.angle}'.`);
    if (opts.composition) settings.push(`- Framing/Composition: '${opts.composition}'.`);
    if (opts.lens) settings.push(`- Lens Effect: '${opts.lens}'.`);
    if (opts.expression && opts.expression !== 'keep the original expression') {
      settings.push(`- Subject's Expression: Change to '${opts.expression}'.`);
    }
    if (opts.pose && opts.pose !== 'keep the original pose') {
      settings.push(`- Subject's Pose: Change to '${opts.pose}'.`);
    }

    if (settings.length > 0) {
      promptLines.push('\nApply the following artistic and technical specifications:');
      promptLines.push(...settings);
    }

    let clothingInstruction = '';
    if (hasClothingImg) {
      clothingInstruction = `The person should be dressed in an outfit that is identical or stylistically very similar to the one shown in the clothing reference image.`;
    } else if (clothingText.trim() !== '') {
      clothingInstruction = `The person should be dressed in: '${clothingText}'.`;
    }

    if (clothingInstruction) {
      promptLines.push(`- Clothing & Accessories: ${clothingInstruction}`);
    }
    
    if (additionalText.trim() !== '') {
      promptLines.push(`- Additional Instructions: Please strictly adhere to the following details: '${additionalText}'.`);
    }

    promptLines.push('\n- Technical Execution: The original background must be completely removed and replaced. Perform professional-level retouching on skin to correct minor blemishes, but maintain a natural, realistic texture that honors the subject\'s true appearance.');

    if (opts.style === 'ID photo') {
      promptLines.push("\n- Special Instructions for ID Photo: Strictly adhere to standard passport photo requirements: neutral background (white or light gray), even, flat lighting, a neutral facial expression, and a forward-facing head position. Ensure standard headroom and composition for an official ID document.");
    }
    
    promptLines.push('\n---');
    promptLines.push('**MANDATORY CORE DIRECTIVE: ABSOLUTE IDENTITY PRESERVATION**');
    promptLines.push('The single most critical instruction is to preserve the facial identity of the person from the source photo with 100% accuracy. The generated face—including all features, proportions, structure, and unique characteristics—must be IDENTICAL to the person in the source photo.');
    promptLines.push('**DO NOT change the person. DO NOT create a similar-looking person. The task is ONLY to change the photographic style (lighting, background, pose, clothing), NOT the person\'s identity.**');

    return promptLines.join('\n');
  }, []);

  const handleGenerate = async () => {
    if (!sourceImage) {
      setError('請上傳或拍攝一張照片。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedResult(null);

    try {
      const prompt = buildPrompt(options, clothingPrompt, !!clothingImage, additionalPrompt);
      const result = await generateStudioPortrait(sourceImage, prompt, clothingImage);
      if (result.image) {
        setGeneratedResult(result);
      } else {
        setError('無法生成圖片，請稍後再試。 ' + (result.text || ''));
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : '發生未知錯誤。');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSourceImageSelected = (image: UploadedImage) => {
    setSourceImage(image);
    setInputMode('upload');
  }

  const handleClothingImageSelected = (image: UploadedImage | null) => {
    setClothingImage(image);
  }

  const canGenerate = sourceImage && !isLoading;

  const ResultPanel = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Spinner />
          <p className="text-slate-400 text-lg animate-pulse">AI 正在處理您的人像照...</p>
          <p className="text-slate-500 text-sm text-center">這可能需要一點時間，請耐心等候。</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-4 bg-red-900/20 rounded-lg">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold">生成失敗</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      );
    }
    if (generatedResult?.image) {
       return (
        <div className="w-full h-full flex flex-col items-center justify-center animate-fadeIn">
          <h2 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">您的專業人像照</h2>
           <img
              src={generatedResult.image}
              alt="Generated"
              className="rounded-lg w-full h-auto object-contain shadow-2xl shadow-black/50"
            />
          {generatedResult.text && (
             <p className="text-center mt-4 text-slate-400 italic text-sm">{generatedResult.text}</p>
          )}
        </div>
      );
    }
    return (
       <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        <h3 className="text-xl font-medium text-slate-300">預覽結果</h3>
        <p className="mt-1">設定風格後點擊生成，<br/>您的 AI 棚拍照將會顯示在此處。</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500 pb-2">
            AI 棚拍人像攝影
          </h1>
          <p className="mt-2 text-lg text-slate-400">專業攝影棚 + 修圖師 + 證件照快拍機</p>
           <p className="mt-1 text-sm text-slate-500">(提示: 為獲得最佳效果，請使用正面、清晰、無遮擋的照片)</p>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="flex flex-col">
             <div className="bg-slate-800/50 ring-1 ring-slate-700 rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="flex border-b border-slate-700 mb-4">
                  <button onClick={() => setInputMode('upload')} className={`px-4 py-2 text-lg font-medium transition ${inputMode === 'upload' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>上傳照片</button>
                  <button onClick={() => setInputMode('camera')} className={`px-4 py-2 text-lg font-medium transition ${inputMode === 'camera' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>即時拍照</button>
                </div>
                {inputMode === 'upload' ? (
                    <div className="h-96">
                      <ImageUploader title="上傳人物照片" onImageUpload={handleSourceImageSelected} imagePreviewUrl={sourceImage?.previewUrl || null} />
                    </div>
                ) : (
                    <CameraCapture onCapture={handleSourceImageSelected} />
                )}
             </div>
             <ControlPanel 
                options={options} 
                setOptions={setOptions} 
                lightingCategory={lightingCategory}
                onLightingCategoryChange={handleLightingCategoryChange}
                backgroundCategory={backgroundCategory}
                onBackgroundCategoryChange={handleBackgroundCategoryChange}
              />
             <ClothingPanel 
                prompt={clothingPrompt} 
                setPrompt={setClothingPrompt} 
                image={clothingImage} 
                setImage={handleClothingImageSelected} 
             />
             <AdditionalPromptPanel
                prompt={additionalPrompt}
                setPrompt={setAdditionalPrompt}
             />
           </div>

          <div className="lg:col-span-1 bg-slate-800/50 ring-1 ring-slate-700 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center min-h-[400px] lg:min-h-0">
            <ResultPanel />
          </div>
        </main>
        
        <div className="flex justify-center mt-8">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 ease-in-out rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:-translate-y-1 ${canGenerate ? 'animate-pulse-glow' : ''}`}
            >
              <MagicWandIcon className="w-6 h-6 mr-3" />
              {isLoading ? '生成中...' : '開始生成'}
            </button>
        </div>

      </div>
       <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-in-out forwards;
          }
          @keyframes pulse-glow {
            0%, 100% { 
              box-shadow: 0 0 15px rgba(168, 85, 247, 0.4), 0 0 5px rgba(99, 102, 241, 0.3);
            }
            50% { 
              box-shadow: 0 0 30px rgba(168, 85, 247, 0.7), 0 0 10px rgba(99, 102, 241, 0.5);
            }
          }
          .animate-pulse-glow {
            animation: pulse-glow 2s infinite ease-in-out;
          }
        `}</style>
    </div>
  );
};

export default App;
