import { useState, useEffect } from 'react';
import { FileText, Zap } from 'lucide-react';
import { API, apiFetch, apiPost } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';

interface Template {
    id: string;
    label: string;
    category: string;
}

export function AddNoteForm({ playerId, onSuccess, onCancel }: { playerId: string, onSuccess?: () => void, onCancel?: () => void }) {
    const { t } = useLanguage();
    const [street, setStreet] = useState('Preflop');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);

    useEffect(() => {
        apiFetch(API.templates)
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data) {
                    const intelligenceTags = json.data.filter((t: Template) => t.category !== 'card_ocr');
                    setTemplates(intelligenceTags);
                }
            })
            .catch(err => console.error("Failed to fetch templates:", err));
    }, []);

    const handleChipClick = (str: string) => {
        setContent(prev => {
            const sp = prev.trim() ? prev.trim() + " " : "";
            return sp + str;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                player_id: playerId,
                street,
                note_type: 'Custom',
                content,
            };

            const res = await apiPost(API.notes, payload);

            if (res.ok) {
                if (onSuccess) onSuccess();
                setContent('');
            } else {
                console.error('Failed to add note');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Street Selector */}
            <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{t('note_form.street') || "Street"}</label>
                <div className="grid grid-cols-4 gap-2">
                    {['Preflop', 'Flop', 'Turn', 'River'].map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setStreet(s)}
                            className={`py-2 text-xs font-bold rounded-lg uppercase transition-all border ${street === s
                                ? 'bg-felt-default text-white border-felt-light shadow-[0_0_10px_rgba(22,163,74,0.15)]'
                                : 'bg-black/30 text-gray-500 border-white/5 hover:text-gray-300 hover:border-white/10'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Tags */}
            {templates.length > 0 && (
                <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                        <Zap className="w-3 h-3" /> {t('note_form.quick_tags') || "Quick Tags"}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {templates.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => handleChipClick(t.label)}
                                className="px-2.5 py-1 bg-white/[0.03] hover:bg-gold/10 hover:text-gold hover:border-gold/30 border border-white/5 text-[11px] text-gray-400 rounded-full transition-all"
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Textarea */}
            <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{t('note_form.note_content') || "Note Content"}</label>
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                    rows={3}
                    placeholder={t('note_form.content_placeholder') || "e.g. 3-bet light from BB with suited connectors..."}
                    className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all resize-none placeholder:text-gray-600"
                />
                <div className="flex justify-end mt-1">
                    <span className={`text-[10px] font-mono ${content.length > 0 ? 'text-gray-500' : 'text-transparent'}`}>{content.length} {t('note_form.chars') || "chars"}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2.5 border border-white/5 text-gray-400 text-sm rounded-xl hover:bg-white/5 hover:text-white transition-all"
                    >
                        {t('note_form.cancel') || "Cancel"}
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading || content.length === 0}
                    className="flex-1 flex justify-center items-center gap-2 px-5 py-2.5 bg-felt-light text-white text-sm font-semibold rounded-xl hover:bg-felt-default transition-all border border-green-500/20 shadow-[0_0_15px_rgba(22,163,74,0.1)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <FileText className="w-4 h-4" />
                    {loading ? (t('note_form.saving') || 'Saving...') : (t('note_form.add_note') || 'Add Note')}
                </button>
            </div>
        </form>
    );
}
