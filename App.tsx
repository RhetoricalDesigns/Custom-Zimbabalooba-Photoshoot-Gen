
import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import FittingControls from './components/FittingControls';
import { generateModelFit, editGeneratedImage } from './services/geminiService';
import { FittingConfig, GenerationState } from './types';

// Extend the global Window interface with the expected AIStudio type to resolve declaration conflicts.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // Made optional to match potential existing global declarations and resolve modifier mismatch errors.
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [isProMode, setIsProMode] = useState<boolean>(false);
  const [hasProKey, setHasProKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [fittingConfig, setFittingConfig] = useState<FittingConfig>({
    modelType: 'female',
    modelRace: 'Diverse',
    pose: 'Shop Display',
    background: 'Clean',
    aspectRatio: '3:4',
    customInstructions: ''
  });
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    isEditing: false,
    error: null,
    resultUrl: null,
  });

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasProKey(hasKey);
        } else {
          setHasProKey(false);
        }
      } catch (e) {
        setHasProKey(false);
      } finally {
        setCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasProKey(true);
      setIsProMode(true);
    }
  };

  const toggleProMode = async (enable: boolean) => {
    if (enable) {
      if (!hasProKey) {
        await handleOpenKeySelector();
      } else {
        setIsProMode(true);
      }
    } else {
      setIsProMode(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;
    
    setState({ isGenerating: true, isEditing: false, error: null, resultUrl: null });
    setIsImageLoading(false);
    
    try {
      const result = await generateModelFit(selectedImage, { ...fittingConfig, usePro: isProMode });
      setState({ isGenerating: false, isEditing: false, error: null, resultUrl: result });
      setIsImageLoading(true);
    } catch (err: any) {
      console.error("Generate Error:", err);
      if (err.message?.includes('Requested entity was not found.')) {
        setHasProKey(false);
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
        }
      }
      setState({ isGenerating: false, isEditing: false, error: err.message, resultUrl: null });
    }
  };

  const handleEdit = async () => {
    if (!state.resultUrl || !editPrompt.trim()) return;
    
    setState(prev => ({ ...prev, isEditing: true, error: null }));
    setIsImageLoading(false);
    try {
      const result = await editGeneratedImage(state.resultUrl, editPrompt, isProMode);
      setState({ isGenerating: false, isEditing: false, error: null, resultUrl: result });
      setIsImageLoading(true);
      setEditPrompt('');
    } catch (err: any) {
      console.error("Edit Error:", err);
      if (err.message?.includes('Requested entity was not found.')) {
        setHasProKey(false);
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
        }
      }
      setState(prev => ({ ...prev, isEditing: false, error: err.message }));
    }
  };

  const handleDownload = () => {
    if (state.resultUrl) {
      const link = document.createElement('a');
      link.href = state.resultUrl;
      link.download = `zimbabalooba-shoot-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClearPreview = () => {
    setState(prev => ({ ...prev, resultUrl: null }));
    setEditPrompt('');
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-inter text-gray-800">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 py-6 px-8 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-4xl font-brand font-black text-zimbabalooba-orange tracking-tighter uppercase leading-none">
              ZIMBABALOOBA
            </h1>
            <p className="text-[10px] text-zimbabalooba-teal font-extrabold uppercase tracking-[0.2em] mt-1">
              Studio: <span className={isProMode ? 'text-zimbabalooba-orange' : 'text-emerald-500'}>{isProMode ? 'PRO LEVEL' : 'STANDARD (FREE)'}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-gray-100 p-1 rounded-full border border-gray-200">
              <button 
                onClick={() => toggleProMode(false)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!isProMode ? 'bg-white shadow-sm text-zimbabalooba-teal' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Standard
              </button>
              <button 
                onClick={() => toggleProMode(true)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isProMode ? 'bg-zimbabalooba-orange shadow-sm text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Pro
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <div className="lg:col-span-4 space-y-6">
          {/* Section 1: Input */}
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-zimbabalooba-teal/5 border border-gray-50">
            <h3 className="text-xs font-black text-zimbabalooba-teal uppercase tracking-widest mb-4 flex items-center">
              <i className="fa-solid fa-shirt mr-2"></i>
              1. Studio Input
            </h3>
            <ImageUploader onImageSelected={setSelectedImage} selectedImage={selectedImage} />
          </div>

          {/* Section 2: Parameters */}
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-zimbabalooba-teal/5 border border-gray-50">
            <h3 className="text-xs font-black text-zimbabalooba-teal uppercase tracking-widest mb-4 flex items-center">
              <i className="fa-solid fa-sliders mr-2"></i>
              2. Shot Parameters
            </h3>
            <FittingControls config={fittingConfig} onChange={setFittingConfig} />
          </div>

          {/* Section 3: Key Toggle (Explicitly Choosing Key Source) */}
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-zimbabalooba-teal/5 border border-gray-50">
            <h3 className="text-xs font-black text-zimbabalooba-teal uppercase tracking-widest mb-4 flex items-center">
              <i className="fa-solid fa-key mr-2"></i>
              3. Studio Access
            </h3>
            <div className="space-y-4">
              <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                <button 
                  onClick={() => toggleProMode(false)}
                  className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isProMode ? 'bg-white shadow-md text-zimbabalooba-teal border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <i className="fa-solid fa-user-group mb-1 block text-xs"></i>
                  Shared (Free)
                </button>
                <button 
                  onClick={() => toggleProMode(true)}
                  className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isProMode ? 'bg-zimbabalooba-orange shadow-md text-white border border-zimbabalooba-orange' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <i className="fa-solid fa-crown mb-1 block text-xs"></i>
                  Personal (Pro)
                </button>
              </div>
              
              <div className="px-1">
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  {isProMode 
                    ? "Currently using your billable Google Cloud Project for high-definition 1K output." 
                    : "Using shared application quota. Recommended for quick tests."}
                </p>
                {isProMode && (
                  <button 
                    onClick={handleOpenKeySelector}
                    className="mt-3 text-[9px] font-black text-zimbabalooba-teal uppercase tracking-widest flex items-center gap-1 hover:underline"
                  >
                    <i className="fa-solid fa-arrows-rotate"></i> Change Pro Key
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedImage || state.isGenerating || state.isEditing}
            className={`w-full py-5 px-8 rounded-full font-brand text-xl uppercase tracking-widest shadow-lg transition-all transform active:scale-95 border-b-4 
              ${!selectedImage || state.isGenerating || state.isEditing
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-zimbabalooba-teal text-white border-zimbabalooba-darkTeal hover:bg-zimbabalooba-darkTeal shadow-zimbabalooba-teal/20'
              }
            `}
          >
            {state.isGenerating ? (
              <span className="flex items-center justify-center">
                <i className="fa-solid fa-spinner fa-spin mr-3"></i> {isProMode ? 'Pro Developing...' : 'Processing...'}
              </span>
            ) : "Capture Photoshoot"}
          </button>
        </div>

        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl h-full min-h-[600px] flex flex-col overflow-hidden relative studio-grid">
            <div className="border-b border-gray-100 p-6 flex items-center justify-between bg-white/95 backdrop-blur-sm z-20">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${state.resultUrl ? 'bg-zimbabalooba-orange shadow-[0_0_10px_rgba(255,176,0,0.5)] animate-pulse' : 'bg-gray-200'}`}></div>
                <h2 className="text-xs font-black text-zimbabalooba-teal uppercase tracking-[0.2em]">
                  {isProMode ? 'PRO DARKROOM PREVIEW' : 'STANDARD PREVIEW'}
                </h2>
              </div>
              {state.resultUrl && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDownload}
                    className="w-9 h-9 flex items-center justify-center bg-zimbabalooba-teal text-white rounded-full shadow-lg hover:bg-zimbabalooba-darkTeal transition-all hover:scale-110 active:scale-95 group"
                    title="Download Result"
                  >
                    <i className="fa-solid fa-download group-hover:animate-bounce"></i>
                  </button>
                  <button 
                    onClick={handleClearPreview}
                    className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-400 rounded-full shadow-sm hover:text-rose-500 hover:border-rose-100 transition-all hover:scale-110 active:scale-95"
                    title="Reset Preview"
                  >
                    <i className="fa-solid fa-trash-can text-sm"></i>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
              {state.error && (
                <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-md text-center border-t-4 border-rose-400 z-30 animate-shake">
                  <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-shield-halved text-2xl"></i></div>
                  <h4 className="text-gray-800 font-bold mb-2 uppercase tracking-tighter">Studio Alert</h4>
                  <p className="text-gray-500 text-[11px] mb-6 leading-relaxed px-4">{state.error}</p>
                  {state.error.includes("limit reached") && !isProMode && (
                    <button 
                      onClick={() => toggleProMode(true)}
                      className="w-full mb-3 px-10 py-3 bg-zimbabalooba-orange text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      Try Pro Mode (Personal Key)
                    </button>
                  )}
                  <button onClick={() => setState(p => ({...p, error: null}))} className="px-10 py-3 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">Dismiss</button>
                </div>
              )}

              {(state.isGenerating || state.isEditing) && (
                <div className="text-center z-10 bg-white/60 backdrop-blur-lg p-12 rounded-[3rem] shadow-2xl border border-white/40">
                  <div className="mb-10 relative flex justify-center">
                    <div className="w-28 h-28 border-4 border-zimbabalooba-lightBg rounded-full"></div>
                    <div className="absolute top-0 w-28 h-28 border-4 border-zimbabalooba-teal border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fa-solid fa-camera-retro text-zimbabalooba-teal text-3xl animate-pulse"></i>
                    </div>
                  </div>
                  <h3 className="text-xl font-brand text-zimbabalooba-teal uppercase tracking-widest mb-2">
                    {state.isEditing ? 'Refining Shot...' : 'Processing...'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {isProMode ? 'Gemini 3 Pro Engine' : 'Gemini 2.5 Flash Engine'}
                  </p>
                </div>
              )}

              {state.resultUrl && !state.isGenerating && !state.isEditing && (
                <div className="w-full h-full flex flex-col items-center">
                  <div className="relative group max-h-[550px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden bg-white ring-8 ring-white">
                    <img 
                      src={state.resultUrl} 
                      alt="Result" 
                      onLoad={() => setIsImageLoading(false)} 
                      className={`max-w-full max-h-[550px] object-contain transition-all duration-700 ${isImageLoading ? 'blur-xl opacity-0' : 'blur-0 opacity-100'}`} 
                    />
                  </div>
                  
                  <div className="w-full max-w-xl mt-8 space-y-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={handleDownload}
                        className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-brand uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/10 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                      >
                        <i className="fa-solid fa-cloud-arrow-down"></i>
                        Download Image
                      </button>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-zimbabalooba-teal/5 flex items-center gap-3">
                      <div className="pl-4 text-zimbabalooba-teal/40"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                      <input 
                        type="text" 
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                        placeholder="Refine lighting, background or accessories..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] font-bold py-4 text-gray-700 placeholder:text-gray-300 uppercase tracking-tight"
                      />
                      <button 
                        onClick={handleEdit}
                        disabled={!editPrompt.trim()}
                        className={`px-8 py-4 rounded-xl font-brand uppercase tracking-[0.2em] text-xs transition-all
                          ${editPrompt.trim() 
                            ? 'bg-zimbabalooba-teal text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-300'}
                        `}
                      >
                        Refine
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!state.resultUrl && !state.isGenerating && !state.isEditing && !state.error && (
                <div className="text-center max-w-sm">
                  <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mx-auto mb-8 border border-zimbabalooba-orange/20 rotate-6 hover:rotate-0 transition-transform duration-500">
                    <i className="fa-solid fa-sparkles text-zimbabalooba-orange text-4xl"></i>
                  </div>
                  <h3 className="text-zimbabalooba-teal font-brand text-2xl uppercase tracking-wider mb-3">
                    {isProMode ? 'Pro Studio Ready' : 'Free Studio Ready'}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed font-medium px-6">
                    {isProMode 
                      ? "Ultra-high quality generation with your personal API key limits." 
                      : "Fast, standard generation using the default shared free tier."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-10 text-center">
          <h4 className="text-2xl font-brand font-black text-zimbabalooba-teal tracking-tighter uppercase mb-3">ZIMBABALOOBA</h4>
          <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.5em] opacity-60">Hand-Dyed Cotton • Built for Adventure • Est. 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
