import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, FileJson, ChevronDown, ChevronUp } from 'lucide-react';
import { API } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';

const EXAMPLE_STRUCTURE = `[
  {
    "name": "Isildur1",
    "playstyle": "LAG",
    "platform_id": "your-platform-uuid",
    "notes": [
      {
        "street": "Preflop",
        "note_type": "Custom",
        "content": "3-bet light from BB with suited connectors"
      },
      {
        "street": "Flop",
        "note_type": "Custom",
        "content": "C-bets 80% on dry boards"
      }
    ]
  },
  {
    "name": "Phil_Ivey",
    "playstyle": "TAG",
    "notes": []
  }
]`;

export function ImportJsonModal({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void }) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState<number | null>(null);
    const [skippedCount, setSkippedCount] = useState<number>(0);
    const [fileName, setFileName] = useState<string | null>(null);
    const [showStructure, setShowStructure] = useState(false);

    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setLoading(true);
        setError(null);
        setSuccessCount(null);

        try {
            const text = await file.text();
            let jsonData;
            try {
                jsonData = JSON.parse(text);
            } catch {
                throw new Error('Invalid JSON format. Please upload a valid JSON file.');
            }

            if (!Array.isArray(jsonData)) {
                throw new Error('JSON root must be an array of player objects.');
            }

            const payload = jsonData.map((p: any) => ({
                name: p.name,
                // Support both export formats (platform_id flat vs nested platform object)
                platform_id: p.platform_id || p.platform?.id,
                platform_name: p.platform?.name,
                playstyle: p.playstyle || "UNKNOWN",
                ai_profile: p.ai_profile,
                notes: Array.isArray(p.notes) ? p.notes.map((n: any) => ({
                    street: n.street || "Preflop",
                    note_type: n.note_type || "Custom",
                    content: n.content
                })).filter((n: any) => n.content) : []
            }));

            const res = await fetch(API.playerBulk, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Automatically send the httpOnly token cookie
                body: JSON.stringify(payload),
            });

            const resJson = await res.json();

            if (!res.ok) {
                throw new Error(resJson.error || 'Server rejected the import payload.');
            }

            setSuccessCount(resJson.data?.count || jsonData.length);
            setSkippedCount(resJson.data?.skipped || 0);
            setTimeout(() => { if (onSuccess) onSuccess(); }, 1800);

        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during import.');
        } finally {
            setLoading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    return (
        <div className="space-y-5">
            <p className="text-gray-400 text-sm leading-relaxed">
                {t('import_json.desc') || "Upload a JSON file containing player data and notes. The system will parse and bulk-insert everything into the database."}
            </p>

            {/* Upload Zone */}
            <div className={`relative p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all ${successCount !== null ? 'border-green-500/30 bg-green-500/5'
                : error ? 'border-red-500/30 bg-red-500/5'
                    : 'border-white/10 bg-black/30 hover:border-gold/40 hover:bg-gold/5'
                }`}>
                <input
                    type="file"
                    accept=".json,application/json"
                    ref={fileRef}
                    onChange={handleFileUpload}
                    disabled={loading || successCount !== null}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />

                {loading ? (
                    <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
                            <Loader2 className="w-6 h-6 text-gold animate-spin" />
                        </div>
                        <span className="text-sm font-semibold text-white mb-1">{t('import_json.processing') || "Processing Import..."}</span>
                        {fileName && <span className="text-[11px] text-gray-500 font-mono">{fileName}</span>}
                    </div>
                ) : successCount !== null ? (
                    <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <span className="text-sm font-bold text-green-400 mb-1">{t('import_json.success') || "Import Successful!"}</span>
                        <span className="text-xs text-gray-400">{successCount} {t('import_json.added') || "players added to database"}</span>
                        {skippedCount > 0 && (
                            <span className="text-xs text-yellow-500 mt-1">{skippedCount} {t('import_json.skipped') || "duplicate(s) skipped"}</span>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4">
                            <UploadCloud className="w-6 h-6 text-gray-500" />
                        </div>
                        <span className="text-sm font-semibold text-white mb-1">{t('import_json.click_drag') || "Click or Drag to Upload"}</span>
                        <span className="text-[11px] text-gray-500">{t('import_json.accepts') || "Accepts .json files"}</span>
                    </div>
                )}
            </div>

            {/* JSON Structure Guide */}
            <div className="border border-white/5 rounded-xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowStructure(!showStructure)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
                >
                    <div className="flex items-center gap-2">
                        <FileJson className="w-4 h-4 text-gold" />
                        <span className="text-sm font-semibold text-white">{t('import_json.expected_structure') || "Expected JSON Structure"}</span>
                    </div>
                    {showStructure ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>

                {showStructure && (
                    <div className="border-t border-white/5">
                        {/* Field Reference */}
                        <div className="px-4 py-3 space-y-2 bg-black/20">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">{t('import_json.field_ref') || "Field Reference"}</p>
                            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                                <code className="text-gold font-mono">name</code>
                                <span className="text-gray-400">{t('import_json.player_name') || "Player name"} <span className="text-red-400">{t('import_json.required') || "*required"}</span></span>

                                <code className="text-gold font-mono">playstyle</code>
                                <span className="text-gray-400">LAG | TAG | NIT | FISH | MANIAC | CALLING STATION | UNKNOWN</span>

                                <code className="text-gold font-mono">platform_id</code>
                                <span className="text-gray-400">{t('import_json.platform_uuid') || "Platform UUID"} <span className="text-gray-600">{t('import_json.optional_defaults_first') || "(optional, defaults to first)"}</span></span>

                                <code className="text-gold font-mono">notes[]</code>
                                <span className="text-gray-400">{t('import_json.array_notes') || "Array of note objects"} <span className="text-gray-600">{t('import_json.optional') || "(optional)"}</span></span>

                                <code className="text-gold font-mono">notes[].street</code>
                                <span className="text-gray-400">Preflop | Flop | Turn | River</span>

                                <code className="text-gold font-mono">notes[].note_type</code>
                                <span className="text-gray-400">{t('import_json.category_label') || "Category label"} <span className="text-gray-600">{t('import_json.defaults_custom') || "(defaults to \"Custom\")"}</span></span>

                                <code className="text-gold font-mono">notes[].content</code>
                                <span className="text-gray-400">{t('import_json.note_text') || "Note text"} <span className="text-red-400">{t('import_json.required') || "*required"}</span></span>
                            </div>
                        </div>

                        {/* Example JSON */}
                        <div className="border-t border-white/5 px-4 py-3 bg-black/30">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t('import_json.example') || "Example"}</p>
                                <button
                                    type="button"
                                    onClick={() => { navigator.clipboard.writeText(EXAMPLE_STRUCTURE); }}
                                    className="text-[10px] text-gray-500 hover:text-gold transition-colors uppercase tracking-wider font-semibold"
                                >
                                    {t('import_json.copy') || "Copy"}
                                </button>
                            </div>
                            <pre className="text-[11px] text-gray-400 font-mono leading-relaxed overflow-x-auto max-h-48 scrollbar-thin scrollbar-thumb-white/10">
                                {EXAMPLE_STRUCTURE}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-300">{error}</span>
                </div>
            )}

            {/* Cancel */}
            {onCancel && !successCount && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-5 py-2.5 text-sm text-gray-400 hover:text-white border border-white/5 rounded-xl hover:bg-white/5 transition-all"
                    >
                        {t('import_json.cancel') || "Cancel"}
                    </button>
                </div>
            )}
        </div>
    );
}
