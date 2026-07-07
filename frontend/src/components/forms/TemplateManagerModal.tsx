import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Globe } from 'lucide-react';
import { API, apiGet, apiPost, apiDelete } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';

interface Template {
    id: string;
    label: string;
    category: string;
    weight: number;
}

interface Platform {
    id: string;
    name: string;
}

export function TemplateManagerModal({ onClose }: { onClose: () => void }) {
    const { t } = useLanguage();
    // Tab state
    const [activeTab, setActiveTab] = useState<'tags' | 'platforms' | 'failed-cases'>('tags');

    // Template state
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [isAddingTemplate, setIsAddingTemplate] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ label: '', category: 'Preflop', weight: 0 });

    // OCR Template state
    const [ocrTemplates, setOcrTemplates] = useState<{name: string, type: 'card'|'anchor'}[]>([]);
    const [loadingOcr, setLoadingOcr] = useState(true);

    // Platform state
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loadingPlatforms, setLoadingPlatforms] = useState(true);
    const [newPlatformName, setNewPlatformName] = useState('');
    const [isAddingPlatform, setIsAddingPlatform] = useState(false);
    const [platformError, setPlatformError] = useState('');
    const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);

    // Failed Cases state
    const [failedCases, setFailedCases] = useState<any[]>([]);
    const [loadingFailedCases, setLoadingFailedCases] = useState(true);
    const [labelingFile, setLabelingFile] = useState<string | null>(null);
    const [labelText, setLabelText] = useState('');
    const [labelType, setLabelType] = useState<'none' | 'rank' | 'suit'>('none');

    useEffect(() => {
        fetchTemplates();
        fetchPlatforms();
        fetchOcrTemplates();
        fetchFailedCases();
    }, []);

    const fetchFailedCases = async () => {
        try {
            const res = await apiGet(API.ocrFailedCases);
            const json = await res.json();
            if (json.success && json.data) {
                setFailedCases(json.data);
            }
        } catch (err) {
            console.error('Failed to fetch failed cases:', err);
        } finally {
            setLoadingFailedCases(false);
        }
    };

    const handleLabelSubmit = async (filename: string) => {
        if (!labelText.trim()) return;
        try {
            const res = await apiPost(API.ocrFailedCaseLabel, {
                filename,
                label: labelText.trim(),
                is_rank: labelType === 'rank',
                is_suit: labelType === 'suit'
            });
            if (res.ok) {
                setLabelingFile(null);
                setLabelText('');
                setLabelType('none');
                fetchFailedCases();
                fetchOcrTemplates();
            }
        } catch (err) {
            console.error('Failed to label case:', err);
        }
    };

    const fetchOcrTemplates = async () => {
        try {
            const res = await apiGet(API.ocrTemplates);
            const json = await res.json();
            if (json.success && json.data) {
                setOcrTemplates(json.data);
            }
        } catch (err) {
            console.error('Failed to fetch OCR templates:', err);
        } finally {
            setLoadingOcr(false);
        }
    };

    const handleDeleteOcrTemplate = async (type: string, filename: string) => {
        if (!confirm(t('template_manager.confirm_delete_ocr') || `Are you sure you want to delete the ${type} template:`)) return;
        try {
            const res = await apiDelete(API.ocrTemplateDelete(type, filename));
            if (res.ok) fetchOcrTemplates();
        } catch (err) {
            console.error('Failed to delete OCR template:', err);
        }
    };

    // --- Templates ---
    const fetchTemplates = async () => {
        try {
            const res = await fetch(API.templates, { credentials: 'include' });
            if (res.ok) {
                const json = await res.json();
                setTemplates(json.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm(t('template_manager.confirm_delete') || 'Are you sure you want to delete this template?')) return;
        try {
            const res = await fetch(API.template(id), {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) fetchTemplates();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmitTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editId ? API.template(editId) : API.templates;
        const method = editId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, weight: Number(formData.weight) }),
                credentials: 'include'
            });
            if (res.ok) {
                setIsAddingTemplate(false);
                setEditId(null);
                setFormData({ label: '', category: 'Preflop', weight: 0 });
                fetchTemplates();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const startEditTemplate = (t: Template) => {
        setEditId(t.id);
        setFormData({ label: t.label, category: t.category, weight: t.weight });
        setIsAddingTemplate(true);
    };

    // --- Platforms ---
    const fetchPlatforms = async () => {
        try {
            const res = await fetch(API.platforms, { credentials: 'include' });
            if (res.ok) {
                const json = await res.json();
                setPlatforms(json.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPlatforms(false);
        }
    };

    const handleAddPlatform = async (e: React.FormEvent) => {
        e.preventDefault();
        setPlatformError('');
        if (!newPlatformName.trim()) return;

        try {
            const res = await fetch(API.platforms, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPlatformName.trim() }),
                credentials: 'include'
            });
            const json = await res.json();
            if (res.ok) {
                setNewPlatformName('');
                setIsAddingPlatform(false);
                fetchPlatforms();
            } else {
                setPlatformError(json.error || 'Failed to add platform');
            }
        } catch (err) {
            console.error(err);
            setPlatformError('Network error');
        }
    };

    const handleDeletePlatform = async (id: string) => {
        setPlatformError('');
        try {
            const res = await fetch(API.platform(id), {
                method: 'DELETE',
                credentials: 'include'
            });
            const json = await res.json();
            if (res.ok) {
                fetchPlatforms();
            } else {
                setPlatformError(json.error || 'Failed to delete platform');
            }
        } catch (err) {
            console.error(err);
            setPlatformError('Network error');
        }
    };

    return (
        <div className="space-y-4">
            {/* Tab Switcher */}
            <div className="flex border-b border-white/10 mb-4">
                <button
                    onClick={() => setActiveTab('tags')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'tags'
                        ? 'text-gold border-gold'
                        : 'text-gray-500 border-transparent hover:text-gray-300'
                        }`}
                >
                    {t('template_manager.quick_tags') || "Quick Tags"}
                </button>
                <button
                    onClick={() => setActiveTab('platforms')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'platforms'
                        ? 'text-gold border-gold'
                        : 'text-gray-500 border-transparent hover:text-gray-300'
                        }`}
                >
                    <Globe className="w-3.5 h-3.5" />
                    {t('template_manager.platforms') || "Platforms"}
                </button>
                <button
                    onClick={() => setActiveTab('failed-cases')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'failed-cases'
                        ? 'text-gold border-gold'
                        : 'text-gray-500 border-transparent hover:text-gray-300'
                        }`}
                >
                    {t('template_manager.failed_cases') || "Failed Cases"}
                </button>
            </div>

            {/* ============ TAGS TAB ============ */}
            {activeTab === 'tags' && (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-gray-200">{t('template_manager.manage_tags') || "Manage Quick Tags"}</h3>
                        {!isAddingTemplate && (
                            <button
                                onClick={() => { setIsAddingTemplate(true); setEditId(null); setFormData({ label: '', category: 'Preflop', weight: 0 }); }}
                                className="flex items-center text-xs bg-gold/20 text-gold px-2 py-1 rounded hover:bg-gold/30 transition-colors"
                            >
                                <Plus className="w-3 h-3 mr-1" /> {t('template_manager.add_new') || "Add New"}
                            </button>
                        )}
                    </div>

                    {isAddingTemplate && (
                        <form onSubmit={handleSubmitTemplate} className="bg-background/50 p-3 rounded-md border border-border mb-4 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">{t('template_manager.label') || "Label"}</label>
                                    <input
                                        autoFocus
                                        required
                                        value={formData.label}
                                        onChange={e => setFormData({ ...formData, label: e.target.value })}
                                        className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-white focus:border-gold outline-none"
                                        placeholder="e.g. 3-bet light"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">{t('template_manager.category') || "Category"}</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-white focus:border-gold outline-none"
                                    >
                                        <option>Preflop</option>
                                        <option>Flop</option>
                                        <option>Turn</option>
                                        <option>River</option>
                                        <option>Postflop</option>
                                        <option>General</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-2">
                                <button type="button" onClick={() => setIsAddingTemplate(false)} className="text-xs text-gray-400 hover:text-white px-2 py-1">{t('template_manager.cancel') || "Cancel"}</button>
                                <button type="submit" className="text-xs bg-felt-light text-white px-3 py-1 rounded hover:bg-felt-default">
                                    {editId ? (t('template_manager.save_changes') || 'Save Changes') : (t('template_manager.create_tag') || 'Create Tag')}
                                </button>
                            </div>
                        </form>
                    )}

                    {loadingTemplates ? (
                        <div className="text-center text-gray-500 py-12 text-sm animate-pulse">{t('template_manager.loading_templates') || "Loading intelligence templates..."}</div>
                    ) : (
                        <div className="space-y-8">
                            {templates.length === 0 && (
                                <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-white/5">
                                    <p className="text-xs text-gray-500">{t('template_manager.no_tags') || "No quick tags configured yet."}</p>
                                </div>
                            )}

                            {['Preflop', 'Flop', 'Turn', 'River', 'Postflop', 'General'].map(cat => {
                                const catTemplates = templates.filter((t: Template) => t.category === cat);
                                if (catTemplates.length === 0) return null;

                                return (
                                    <div key={cat} className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5"></div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{cat}</span>
                                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5"></div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {catTemplates.map((t: Template) => (
                                                <div key={t.id} className="group flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:border-white/20 hover:bg-white/[0.05] transition-all">
                                                    <span className="text-sm font-medium text-white/90">{t.label}</span>
                                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEditTemplate(t)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ============ PLATFORMS TAB ============ */}
            {activeTab === 'platforms' && (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-gray-200">{t('template_manager.manage_platforms') || "Manage Platforms"}</h3>
                        {!isAddingPlatform && (
                            <button
                                onClick={() => { setIsAddingPlatform(true); setNewPlatformName(''); setPlatformError(''); }}
                                className="flex items-center text-xs bg-gold/20 text-gold px-2 py-1 rounded hover:bg-gold/30 transition-colors"
                            >
                                <Plus className="w-3 h-3 mr-1" /> {t('template_manager.add_platform') || "Add Platform"}
                            </button>
                        )}
                    </div>

                    {platformError && (
                        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2 mb-3">
                            {platformError}
                        </div>
                    )}

                    {isAddingPlatform && (
                        <form onSubmit={handleAddPlatform} className="bg-background/50 p-3 rounded-md border border-border mb-4 space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">{t('template_manager.platform_name') || "Platform Name"}</label>
                                <input
                                    autoFocus
                                    required
                                    value={newPlatformName}
                                    onChange={e => setNewPlatformName(e.target.value)}
                                    className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-white focus:border-gold outline-none"
                                    placeholder="e.g. GG Poker"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setIsAddingPlatform(false)} className="text-xs text-gray-400 hover:text-white px-2 py-1">{t('template_manager.cancel') || "Cancel"}</button>
                                <button type="submit" className="text-xs bg-felt-light text-white px-3 py-1 rounded hover:bg-felt-default">{t('template_manager.create') || "Create"}</button>
                            </div>
                        </form>
                    )}

                    {loadingPlatforms ? (
                        <div className="text-center text-gray-500 py-12 text-sm animate-pulse">{t('template_manager.loading_networks') || "Loading networks..."}</div>
                    ) : (
                        <div className="space-y-6">
                            {/* Platform Navigation */}
                            <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-white/5">
                                {platforms.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPlatformId(p.id)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                                            selectedPlatformId === p.id
                                                ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20'
                                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:bg-white/10'
                                        }`}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                                {platforms.length === 0 && (
                                    <p className="text-xs text-gray-500 italic">No platforms registered.</p>
                                )}
                            </div>

                            {/* Selected Platform Content */}
                            {selectedPlatformId ? (
                                (() => {
                                    const p = platforms.find(p => p.id === selectedPlatformId);
                                    if (!p) return null;
                                    const relevantTemplates = ocrTemplates.filter(t => 
                                        t.name.toUpperCase().includes(p.name.toUpperCase().replace(/\s+/g, '_')) || 
                                        t.name.toUpperCase().includes(p.name.split(' ')[0].toUpperCase())
                                    );

                                    return (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center text-gold">
                                                        <Globe className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-white tracking-tight">{p.name}</h4>
                                                        <p className="text-xs text-gray-500">{relevantTemplates.length} {t('template_manager.templates_synced') || "templates synced"}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeletePlatform(p.id)}
                                                    className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    {t('template_manager.remove_platform') || "Remove Platform"}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                {relevantTemplates.map((t, idx) => (
                                                    <div key={idx} className="group relative bg-[#111318] border border-gray-800 rounded-xl overflow-hidden hover:border-gold/50 transition-all">
                                                        {/* Image Preview */}
                                                        <div className="aspect-square bg-black/40 flex items-center justify-center p-2 relative">
                                                            <img 
                                                                src={`${API.base}/api/ocr/templates/${t.type === 'card' ? 'card' : 'anchor'}/${t.name}`}
                                                                alt={t.name}
                                                                className="max-w-full max-h-full object-contain"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect width="18" height="18" x="3" y="3" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="9" cy="9" r="2"%3E%3C/circle%3E%3Cpath d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"%3E%3C/path%3E%3C/svg%3E';
                                                                }}
                                                            />
                                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button 
                                                                    onClick={() => handleDeleteOcrTemplate(t.type === 'card' ? 'cards' : 'anchors', t.name)}
                                                                    className="p-1.5 bg-black/80 text-red-400 hover:text-red-300 rounded-lg backdrop-blur-sm"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Label */}
                                                        <div className="p-2 border-t border-gray-800">
                                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                                <span className="text-[10px] font-black text-gray-300 truncate">{t.name.split('_')[0]}</span>
                                                                <span className={`text-[8px] px-1 py-0.5 rounded font-black tracking-tighter uppercase shrink-0 ${
                                                                    t.type === 'anchor' 
                                                                        ? 'bg-purple-500/20 text-purple-400' 
                                                                        : 'bg-blue-500/20 text-blue-400'
                                                                }`}>
                                                                    {t.type}
                                                                </span>
                                                            </div>
                                                            <span className="text-[8px] text-gray-600 font-mono truncate block">{t.name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {relevantTemplates.length === 0 && (
                                                    <div className="col-span-full py-12 text-center border border-dashed border-white/5 rounded-2xl bg-white/5">
                                                        <p className="text-xs text-gray-500 italic">{t('template_manager.no_recorded') || "No templates recorded for this platform yet."}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="py-24 text-center border border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                                    <Globe className="w-12 h-12 text-gray-700 mx-auto mb-4 opacity-20" />
                                    <h4 className="text-gray-400 font-medium">{t('template_manager.select_platform') || "Select a platform to view templates"}</h4>
                                    <p className="text-xs text-gray-600 mt-2">{t('template_manager.sync_ocr') || "Sync OCR box templates and card anchors per network"}</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <div className="pt-4 flex justify-end border-t border-white/5">
                <button onClick={onClose} className="px-4 py-2 bg-card border border-white/5 text-sm text-white rounded-full hover:bg-white/5 transition-colors">
                    {t('template_manager.close') || "Close"}
                </button>
            </div>
        </div>
    );
}
