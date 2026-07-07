import { useState, useRef, useEffect } from 'react';
import { Plus, Upload, Image as ImageIcon, Loader2, Zap } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { API, apiFetch, apiPost } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';

interface PlatformOption {
    id: string;
    name: string;
}

interface QuickTag {
    id: string;
    label: string;
    category: string;
}

export function AddPlayerForm({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void }) {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [platforms, setPlatforms] = useState<PlatformOption[]>([]);
    const [platformId, setPlatformId] = useState('');
    const [playstyle, setPlaystyle] = useState('UNKNOWN');
    const [street, setStreet] = useState('Preflop');
    const [noteContent, setNoteContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [quickTags, setQuickTags] = useState<QuickTag[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch real platforms from the database
    useEffect(() => {
        apiFetch(API.platforms)
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data) {
                    setPlatforms(json.data);
                    if (json.data.length > 0) {
                        setPlatformId(json.data[0].id); // Auto-select first platform
                    }
                }
            })
            .catch(err => console.error('Failed to fetch platforms:', err));

        // Fetch quick tags from templates (exclude layout templates)
        apiFetch(API.templates)
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data) {
                    const intelligenceTags = json.data.filter((t: QuickTag) => t.category !== 'card_ocr');
                    setQuickTags(intelligenceTags);
                }
            })
            .catch(err => console.error('Failed to fetch templates:', err));
    }, []);

    const handleQuickTag = (label: string) => {
        setNoteContent(prev => {
            const sp = prev.trim() ? prev.trim() + ' ' : '';
            return sp + label;
        });
    };

    const runOCR = async (source: File | Blob) => {
        setScanning(true);
        try {
            // Use worker for reliable multi-language support
            const worker = await Tesseract.createWorker('chi_sim+chi_tra+eng');
            const { data: { text } } = await worker.recognize(source);
            await worker.terminate();

            console.log('OCR raw output:', text);

            // Take first line, trim whitespace only (preserve all characters including Chinese)
            const firstLine = text.trim().split('\n')[0].trim();
            if (firstLine) {
                setName(firstLine);
            }
        } catch (error) {
            console.error('OCR Error:', error);
        } finally {
            setScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await runOCR(file);
    };

    // Handle Ctrl+V paste of image from clipboard
    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const blob = item.getAsFile();
                if (blob) await runOCR(blob);
                return;
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create Player
            const payload = {
                name,
                platform_id: platformId,
                playstyle,
            };

            const res = await apiPost(API.players, payload);

            if (res.ok) {
                const json = await res.json();
                const newPlayerId = json.data.id;

                // 2. Optionally Create Initial Note
                if (noteContent.trim() !== '') {
                    await apiPost(API.notes, {
                        player_id: newPlayerId,
                        street,
                        note_type: 'Custom',
                        content: noteContent
                    });
                }

                if (onSuccess) onSuccess();
            } else {
                console.error('Failed to create player');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} onPaste={handlePaste} className="space-y-5">
            {/* OCR Zone — compact with button */}
            <div className="p-4 border border-white/5 rounded-xl bg-black/20 flex items-center justify-between gap-3">
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleOCRUpload}
                    className="hidden"
                />

                {scanning ? (
                    <div className="flex items-center gap-3 text-gold">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">{t('player_form.scanning') || "Scanning image..."}</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 text-gray-400">
                            <ImageIcon className="w-5 h-5 opacity-50" />
                            <div>
                                <span className="text-sm text-white font-medium block">{t('player_form.ocr_autofill') || "OCR Auto-fill"}</span>
                                <span className="text-[10px] text-gray-500">{t('player_form.paste_screenshot') || "Paste screenshot anywhere (Ctrl+V)"}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 hover:text-gold bg-white/5 hover:bg-gold/10 border border-white/5 hover:border-gold/30 rounded-lg transition-all uppercase tracking-wider"
                        >
                            <Upload className="w-3 h-3 inline mr-1.5" />{t('player_form.browse') || "Browse"}
                        </button>
                    </>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('player_form.player_name') || "Player Name"} <span className="text-red-400">*</span></label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onPaste={handlePaste}
                        required
                        placeholder={scanning ? (t('player_form.scanning_placeholder') || 'Scanning...') : (t('player_form.name_placeholder') || 'e.g. Isildur1 (or paste screenshot here)')}
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                    />
                </div>

                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('player_form.platform') || "Platform"}</label>
                    <select
                        value={platformId}
                        onChange={e => setPlatformId(e.target.value)}
                        className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                    >
                        {platforms.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('player_form.playstyle') || "Playstyle"}</label>
                    <select
                        value={playstyle}
                        onChange={e => setPlaystyle(e.target.value)}
                        className="w-full bg-background border border-border text-sm rounded-md px-3 py-2 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                    >
                        <option value="UNKNOWN">{t('player_form.playstyle_unknown') || "Unknown"}</option>
                        <option value="LAG">{t('player_form.playstyle_lag') || "LAG (Aggressive)"}</option>
                        <option value="TAG">{t('player_form.playstyle_tag') || "TAG (Tight)"}</option>
                        <option value="NIT">{t('player_form.playstyle_nit') || "NIT (Very Tight)"}</option>
                        <option value="FISH">{t('player_form.playstyle_fish') || "FISH (Passive)"}</option>
                        <option value="MANIAC">{t('player_form.playstyle_maniac') || "MANIAC"}</option>
                        <option value="CALLING STATION">{t('player_form.playstyle_calling_station') || "CALLING STATION"}</option>
                    </select>
                </div>
            </div>

            {/* Initial Note Section */}
            <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('player_form.initial_note') || "Initial Note (Optional)"}</label>

                    <div className="flex gap-1">
                        {['Preflop', 'Flop', 'Turn', 'River'].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStreet(s)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase transition-all border ${street === s
                                    ? 'bg-felt-default text-white border-felt-light shadow-[0_0_8px_rgba(22,163,74,0.15)]'
                                    : 'bg-black/30 text-gray-500 border-white/5 hover:text-gray-300'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Tags */}
                {quickTags.length > 0 && (
                    <div className="mb-3">
                        <label className="flex items-center gap-1 text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                            <Zap className="w-3 h-3" /> {t('player_form.quick_tags') || "Quick Tags"}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {quickTags.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleQuickTag(t.label)}
                                    className="px-2.5 py-1 bg-white/[0.03] hover:bg-gold/10 hover:text-gold hover:border-gold/30 border border-white/5 text-[11px] text-gray-400 rounded-full transition-all"
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <textarea
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    rows={2}
                    placeholder={t('player_form.note_placeholder') || "E.g. Overfolds to 3-bets OOP..."}
                    className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all resize-none placeholder:text-gray-600"
                />
            </div>



            <div className="pt-4 flex gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 border border-white/5 text-gray-400 rounded-xl hover:bg-white/5 hover:text-white transition-all"
                    >
                        {t('player_form.cancel') || "Cancel"}
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex justify-center items-center px-4 py-2.5 bg-gold text-black font-semibold rounded-xl hover:bg-yellow-500 transition-all shadow-[0_0_15px_rgba(212,175,55,0.15)] disabled:opacity-50"
                >
                    {loading ? (t('player_form.saving') || 'Saving...') : (
                        <>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('player_form.add_player') || 'Add Player'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
