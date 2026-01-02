
import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import FittingControls from './components/FittingControls';
import { generateModelFit, editGeneratedImage } from './services/geminiService';
import { FittingConfig, GenerationState } from './types';

const App: React.FC = () => {
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

  const handleGenerate = async () => {
    if (!selectedImage) return;
    setState({ isGenerating: true, isEditing: false, error: null, resultUrl: null });
    setIsImageLoading(false);
    
    try {
      const result = await generateModelFit(selectedImage, fittingConfig);
      setState({ isGenerating: false, isEditing: false, error: null, resultUrl: result });
      setIsImageLoading(true);
    } catch (err: any) {
      console.error("Generate Error:", err);
      // Detailed instruction for environment configuration
      let errorMessage = err.message;
      if (err.message?.includes("API_KEY") || !process.env.API_KEY) {
        errorMessage = "Security configuration required: Please set the 'API_KEY' environment variable in your deployment dashboard (e.g., Vercel Project Settings) to enable the Gemini engine.";
      }
      setState({ isGenerating: false, isEditing: false, error: errorMessage, resultUrl: null });
    }
  };

  const handleEdit = async () => {
    if (!state.resultUrl || !editPrompt.trim()) return;
    setState(prev => ({ ...prev, isEditing: true, error: null }));
    setIsImageLoading(false);
    try {
      const result = await editGeneratedImage(state.resultUrl, editPrompt);
      setState({ isGenerating: false, isEditing: false, error: null, resultUrl: result });
      setIsImageLoading(true);
      setEditPrompt('');
    } catch (err: any) {
      setState(prev => ({ ...prev, isEditing: false, error: err.message }));
    }
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
              Photoshoot Studio
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
             <div className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${process.env.API_KEY ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-amber-100 bg-amber-50 text-amber-600'}`}>
                <i className={`fa-solid ${process.env.API_KEY ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
                Studio Status: {process.env.API_KEY ? 'Connected' : 'Setup Required'}
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-zimbabalooba-teal/5 border border-gray-50">
            <h3 className="text-xs font-black text-zimbabalooba-teal uppercase tracking-widest mb-4 flex items-center">
              <i className="fa-solid fa-shirt mr-2"></i>
              1. Studio Input
            </h3>
            <ImageUploader onImageSelected={setSelectedImage} selectedImage={selectedImage} />
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-zimbabalooba-teal/5 border border-gray-50">
            <h3 className="text-xs font-black text-zimbabalooba-teal uppercase tracking-widest mb-4 flex items-center">
              <i className="fa-solid fa-sliders mr-2"></i>
              2. Shot Parameters
            </h3>
            <FittingControls config={fittingConfig} onChange={setFittingConfig} />
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
                <i className="fa-solid fa-spinner fa-spin mr-3"></i> Developing...
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
                  Darkroom Preview
                </h2>
              </div>
              {state.resultUrl && (
                <div className="flex space-x-3">
                  <button onClick={() => { if(state.resultUrl) { const l = document.createElement('a'); l.href=state.resultUrl; l.download='zimbabalooba.png'; l.click(); }}} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 hover:border-zimbabalooba-orange rounded-full text-zimbabalooba-teal shadow-sm transition-all hover:scale-105" title="Download"><i className="fa-solid fa-download"></i></button>
                  <button onClick={() => { setSelectedImage(null); setState(p => ({...p, resultUrl: null})); }} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 hover:border-rose-400 rounded-full text-rose-400 shadow-sm transition-all hover:scale-105" title="Reset"><i className="fa-solid fa-rotate-left"></i></button>
                </div>
              )}
            </div>

            <div className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
              {state.error && (
                <div className="bg-white p-10 rounded-[2rem] shadow-2xl max-w-md text-center border-t-4 border-rose-400 z-30 animate-shake">
                  <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-shield-halved text-2xl"></i></div>
                  <h4 className="text-gray-800 font-bold mb-2 uppercase tracking-tighter">Security Notice</h4>
                  <p className="text-gray-500 text-[11px] mb-6 leading-relaxed px-4">{state.error}</p>
                  <button onClick={() => setState(p => ({...p, error: null}))} className="px-10 py-3 bg-zimbabalooba-teal text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-zimbabalooba-darkTeal transition-colors shadow-lg shadow-zimbabalooba-teal/20">Dismiss</button>
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
                    {state.isEditing ? 'Refining Shot...' : 'Developing Image...'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Gemini 2.5 Flash Processing
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
                  
                  <div className="w-full max-w-xl mt-10">
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
                    <i className="fa-solid fa-wand-magic-sparkles text-zimbabalooba-orange text-4xl"></i>
                  </div>
                  <h3 className="text-zimbabalooba-teal font-brand text-2xl uppercase tracking-wider mb-3">Studio Ready</h3>
                  <p className="text-gray-400 text-xs leading-relaxed font-medium px-6">
                    Professional modeling active via Gemini 2.5 Flash. Upload your hand-dyed cotton pants to begin the photoshoot.
                  </p>
                  {!process.env.API_KEY && (
                    <div className="mt-8 p-5 bg-amber-50 rounded-2xl border border-amber-200 text-left">
                       <p className="text-[10px] text-amber-800 font-bold uppercase tracking-widest mb-2 flex items-center">
                         <i className="fa-solid fa-key mr-2"></i> Setup Instructions
                       </p>
                       <p className="text-[9px] text-amber-700 font-medium leading-relaxed">
                         To enable image generation, please add your Gemini API Key as an environment variable named <code className="bg-amber-100 px-1 py-0.5 rounded">API_KEY</code> in your deployment dashboard (e.g., Vercel Project Settings > Environment Variables).
                       </p>
                    </div>
                  )}
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
