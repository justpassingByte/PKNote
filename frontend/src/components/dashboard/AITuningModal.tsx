"use client";

import { useState, useEffect } from "react";
import { Brain, Save, RefreshCw, AlertCircle, Info, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { getAISettings, updateAISettings, getAIPreviewAction } from "@/app/actions";
import { useLanguage } from '@/i18n/LanguageContext';

interface AITuningModalProps {
    onClose: () => void;
}

export function AITuningModal({ onClose }: AITuningModalProps) {
    const { t } = useLanguage();
    const [settings, setSettings] = useState<any>(null);
    const [previews, setPreviews] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'hand'>('profile');
    const [showPrompt, setShowPrompt] = useState(false);

    // REAL-TIME PREVIEW: Update prompts as settings or tab changes
    useEffect(() => {
        if (!settings) return;
        const fetchPreview = async () => {
            const data = await getAIPreviewAction(settings);
            if (data) setPreviews(data);
        };
        const timer = setTimeout(fetchPreview, 200); 
        return () => clearTimeout(timer);
    }, [
        activeTab,
        settings?.ai_style, 
        settings?.hand_style, 
        settings?.aggression_bias, 
        settings?.hand_aggression_bias, 
        settings?.insight_depth, 
        settings?.hand_insight_depth
    ]);

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getAISettings();
                // Apply defaults for fields that may be null/empty from server
                if (data) {
                    if (!data.ai_style) data.ai_style = "Exploit";
                    if (!data.hand_style) data.hand_style = "Exploit";
                    if (data.aggression_bias == null) data.aggression_bias = 85;
                    if (data.hand_aggression_bias == null) data.hand_aggression_bias = 85;
                    if (!data.insight_depth) data.insight_depth = "Deep";
                    if (!data.hand_insight_depth) data.hand_insight_depth = "Deep";
                }
                setSettings(data);
            } catch (err) {
                setError("Failed to load AI settings");
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await updateAISettings(settings);
            if (res.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(res.error || "Failed to update settings");
            }
        } catch (err) {
            setError("An error occurred while saving");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <RefreshCw className="w-8 h-8 text-gold animate-spin" />
                <p className="text-gray-400 font-medium font-mono tracking-widest uppercase">{t('ai_tuning.initializing')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex flex-col max-h-[85vh] overflow-y-auto pr-2 scrollbar-hide py-2">
            
            {/* Tab Switched */}
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'profile' ? 'bg-gold text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Brain className="w-3.5 h-3.5" />
                        {t('ai_tuning.player_profiling')}
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab('hand')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === 'hand' ? 'bg-gold text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        {t('ai_tuning.hand_analysis')}
                    </div>
                </button>
            </div>

            {/* AI Control Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 border border-white/5 rounded-3xl p-6 sm:p-8">
                {/* Left Side: Core Switches */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-black/40 border border-white/5 p-4 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${settings?.is_enabled ? 'bg-gold/20 text-gold shadow-[0_0_15px_rgba(250,204,21,0.2)]' : 'bg-gray-500/10 text-gray-500'}`}>
                                <Brain className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('ai_tuning.ai_analysis_engine')}</h4>
                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">{t('ai_tuning.global_neural_switch')}</p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setSettings({ ...settings, is_enabled: !settings.is_enabled })}
                            className={`w-14 h-7 rounded-full transition-all relative ${settings?.is_enabled ? 'bg-gold' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${settings?.is_enabled ? 'left-8' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('ai_tuning.model_generation')}</label>
                        <select 
                            value={settings?.model_name || "llama-3.3-70b-versatile"}
                            onChange={(e) => setSettings({ ...settings, model_name: e.target.value })}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all font-bold appearance-none cursor-pointer shadow-inner"
                        >
                            <optgroup label="Groq (Ultra-Fast)">
                                <option value="llama-3.3-70b-versatile">Llama 3.3 70B ({t('ai_tuning.fast_precise')})</option>
                                <option value="llama-3.1-8b-instant">Llama 3.1 8B ({t('ai_tuning.instant')})</option>
                                <option value="mixtral-8x7b-32768">Mixtral 8x7B ({t('ai_tuning.expert')})</option>
                            </optgroup>
                            <optgroup label="OpenAI (Premium)">
                                <option value="gpt-4o">GPT-4o ({t('ai_tuning.state_of_art')})</option>
                                <option value="gpt-4o-mini">GPT-4o Mini ({t('ai_tuning.efficient')})</option>
                            </optgroup>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex justify-between">
                            {t('ai_tuning.logic_creativity')}
                            <span className="text-gold font-mono font-bold tracking-widest">{settings?.temperature || 0.7}</span>
                        </label>
                        <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings?.temperature || 0.7}
                            onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                        />
                    </div>
                </div>

                {/* Right Side: Behavioral Sliders */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('ai_tuning.strategic_architecture')}</label>
                        <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 border border-white/5 rounded-2xl h-[58px]">
                            {['Exploit', 'Balanced', 'GTO'].map((style) => {
                                const currentStyle = activeTab === 'profile'
                                    ? (settings?.ai_style || "Exploit")
                                    : (settings?.hand_style || "Exploit");
                                return (
                                    <button
                                        key={style}
                                        type="button"
                                        onClick={() => {
                                            const presets: Record<string, number> = {
                                                'Exploit': 85,
                                                'Balanced': 50,
                                                'GTO': 40
                                            };
                                            const styleField = activeTab === 'profile' ? 'ai_style' : 'hand_style';
                                            const biasField = activeTab === 'profile' ? 'aggression_bias' : 'hand_aggression_bias';
                                            
                                            setSettings({ 
                                                ...settings, 
                                                [styleField]: style,
                                                [biasField]: presets[style] // Automatic slider jump based on preset
                                            });
                                        }}
                                        className={`flex flex-col items-center justify-center text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${currentStyle === style ? 'bg-gold text-black shadow-lg font-black' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        {style}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex justify-between">
                            {t('ai_tuning.aggression_bias')}
                            <span className="text-gold font-mono font-bold tracking-widest">{activeTab === 'profile' ? (settings?.aggression_bias || 85) : (settings?.hand_aggression_bias || 85)}%</span>
                        </label>
                        <input 
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={activeTab === 'profile' ? (settings?.aggression_bias || 85) : (settings?.hand_aggression_bias || 85)}
                            onChange={(e) => setSettings({ 
                                ...settings, 
                                [activeTab === 'profile' ? 'aggression_bias' : 'hand_aggression_bias']: parseInt(e.target.value) 
                            })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold shadow-[0_0_10px_rgba(250,204,21,0.1)]"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('ai_tuning.neural_depth')}</label>
                        <div className="flex bg-black/40 border border-white/5 rounded-2xl p-1 h-[58px]">
                            {['Quick', 'Deep'].map((depth) => {
                                const currentDepth = activeTab === 'profile' ? (settings?.insight_depth || "Deep") : (settings?.hand_insight_depth || "Deep");
                                return (
                                    <button
                                        key={depth}
                                        type="button"
                                        onClick={() => setSettings({ 
                                            ...settings, 
                                            [activeTab === 'profile' ? 'insight_depth' : 'hand_insight_depth']: depth 
                                        })}
                                        className={`flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${currentDepth === depth ? 'bg-gold text-black shadow-lg font-black' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        {depth === 'Quick' ? (t('ai_tuning.quick_mode') || 'Quick Mode') : depth === 'Deep' ? (t('ai_tuning.deep_mode') || 'Deep Mode') : `${depth} ${t('ai_tuning.mode')}`}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Neural Prompt Toggle - HIDDEN BY DEFAULT AS REQUESTED */}
            <button 
                onClick={() => setShowPrompt(!showPrompt)}
                className="group w-full py-5 border border-dashed border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all flex items-center justify-center gap-4"
            >
                <div className={`p-1.5 rounded-lg transition-all ${showPrompt ? 'bg-gold/20 text-gold' : 'bg-white/5'}`}>
                    <Brain className="w-4 h-4" />
                </div>
                {showPrompt ? t('ai_tuning.close_prompt') : t('ai_tuning.open_prompt')}
                {showPrompt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Expanded Prompt Editor */}
            {showPrompt && (
                <div className="flex flex-col space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between ml-1">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-gold animate-pulse"></div>
                            <label className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
                                {activeTab === 'profile' ? t('ai_tuning.profiling_core') : t('ai_tuning.analysis_core')}
                            </label>
                        </div>
                        <button 
                            type="button"
                            onClick={() => {
                                if (activeTab === 'profile') setSettings({ ...settings, system_prompt: "" });
                                else setSettings({ ...settings, analysis_prompt: "" });
                            }}
                            className="text-[10px] text-gray-500 hover:text-red-500 transition-colors font-bold uppercase tracking-widest"
                        >
                            {t('ai_tuning.purge_reset')}
                        </button>
                    </div>
                    
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 to-transparent blur opacity-25 group-hover:opacity-40 transition-opacity rounded-3xl pointer-events-none"></div>
                        <textarea 
                            value={activeTab === 'profile' 
                                ? (settings?.system_prompt || previews?.system_prompt || "") 
                                : (settings?.analysis_prompt || previews?.analysis_prompt || "")}
                            onChange={(e) => {
                                if (activeTab === 'profile') setSettings({ ...settings, system_prompt: e.target.value });
                                else setSettings({ ...settings, analysis_prompt: e.target.value });
                            }}
                            className="relative w-full bg-black/80 border border-white/10 rounded-3xl px-8 py-8 text-[15px] text-gray-200 font-mono leading-relaxed focus:outline-none focus:border-gold/40 transition-all min-h-[500px] shadow-2xl scrollbar-hide"
                            placeholder={t('ai_tuning.prompt_placeholder')}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                        <Info className="w-4 h-4 text-blue-400 shrink-0" />
                        <p className="text-[10px] text-blue-200/60 leading-relaxed font-medium">
                            {t('ai_tuning.dna_info')}
                        </p>
                    </div>
                </div>
            )}

            {/* Actions Footer */}
            <div className="pt-6 mt-4 border-t border-white/5 space-y-4">
                {(error || success) && (
                    <div className={`${error ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'} text-[10px] font-black uppercase tracking-widest px-6 py-5 rounded-2xl flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        {error ? <AlertCircle className="w-5 h-5" /> : <Zap className="w-5 h-5 fill-current" />}
                        {error || t('ai_tuning.sync_success')}
                    </div>
                )}
                
                <div className="flex gap-4">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-5 text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase tracking-[0.2em] bg-white/5 rounded-2xl hover:bg-white/10"
                    >
                        {t('ai_tuning.return_dashboard')}
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-[2] py-5 bg-gold text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-yellow-400 transition-all hover:shadow-[0_0_40px_rgba(250,204,21,0.25)] disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? t('ai_tuning.syncing') : t('ai_tuning.upload_core')}
                    </button>
                </div>
            </div>
        </div>
    );
}
