'use client';

import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Monitor, Copy, Check, AlertTriangle, Loader2, Clock, Wifi, Shield } from 'lucide-react';
import { apiFetch, API } from '@/lib/api';

interface ApiKeyDevice {
    id: string;
    deviceId: string;
    deviceName: string | null;
    ipAddress: string | null;
    lastUsed: string;
    createdAt: string;
}

interface ApiKeyData {
    id: string;
    keyPrefix: string;
    name: string;
    isActive: boolean;
    lastUsedAt: string | null;
    createdAt: string;
    devices: ApiKeyDevice[];
}

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKeyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [keyName, setKeyName] = useState('');

    const fetchKeys = useCallback(async () => {
        try {
            const res = await apiFetch(API.apiKeys);
            const json = await res.json();
            if (json.success) {
                setKeys(json.data);
            }
        } catch {
            setError('Failed to load API keys');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    async function handleGenerate() {
        setGenerating(true);
        setError(null);
        setNewKey(null);
        try {
            const res = await apiFetch(API.apiKeys, {
                method: 'POST',
                body: JSON.stringify({ name: keyName || 'Desktop App' }),
            });
            const json = await res.json();
            if (json.success) {
                setNewKey(json.data.rawKey);
                setKeyName('');
                fetchKeys();
            } else {
                setError(json.error || 'Failed to generate API key');
            }
        } catch {
            setError('Network error');
        } finally {
            setGenerating(false);
        }
    }

    async function handleDeleteKey(keyId: string) {
        if (!confirm('Bạn có chắc chắn muốn xoá API key này? Khi xoá thì toàn bộ thiết bị đang dùng key này sẽ mất kết nối.')) return;
        try {
            await apiFetch(API.apiKeyPermanent(keyId), { method: 'DELETE' });
            fetchKeys();
        } catch {
            setError('Failed to delete key');
        }
    }

    async function handleRemoveDevice(keyId: string, deviceId: string) {
        try {
            await apiFetch(API.apiKeyDevices(keyId, deviceId), { method: 'DELETE' });
            fetchKeys();
        } catch {
            setError('Failed to remove device');
        }
    }

    function handleCopy() {
        if (newKey) {
            navigator.clipboard.writeText(newKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    function timeAgo(dateStr: string) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    }

    const activeKeys = keys.filter(k => k.isActive);
    const totalDevices = activeKeys.reduce((sum, k) => sum + k.devices.length, 0);

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.25)]">
                            <Key className="w-5 h-5 text-black" />
                        </div>
                        API Keys
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Generate API keys for the VillainVault Desktop App</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500">Active Devices</div>
                    <div className="text-lg font-bold text-white">{totalDevices}</div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm py-3 px-4 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-300">×</button>
                </div>
            )}

            {/* Generate Section */}
            <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4 text-gold" />
                    Generate New Key
                </h2>

                <div className="flex gap-3">
                    <input
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                        placeholder="Key name (e.g., Desktop App)"
                        className="flex-1 bg-black/40 border border-white/8 rounded-xl py-2.5 px-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all text-sm"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="bg-gradient-to-r from-gold to-yellow-500 text-black font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_4px_15px_rgba(212,175,55,0.25)] text-sm"
                    >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Generate
                    </button>
                </div>

                {/* Newly generated key (shown ONCE) */}
                {newKey && (
                    <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Copy your API key now</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-3">This is the only time you&apos;ll see this key. Store it securely.</p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-black/60 border border-white/5 rounded-lg py-2.5 px-3 text-emerald-300 text-xs font-mono break-all select-all">
                                {newKey}
                            </code>
                            <button
                                onClick={handleCopy}
                                className="shrink-0 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Keys List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 text-gold animate-spin" />
                </div>
            ) : keys.length === 0 ? (
                <div className="text-center py-12">
                    <Key className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No API keys yet. Generate one above to use with the Desktop App.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {keys.map(key => (
                        <div
                            key={key.id}
                            className={`border rounded-2xl p-5 transition-all ${
                                key.isActive
                                    ? 'bg-white/[0.02] border-white/8 hover:border-white/12'
                                    : 'bg-white/[0.01] border-white/4 opacity-50'
                            }`}
                        >
                            {/* Key Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        key.isActive ? 'bg-gold/10' : 'bg-red-500/10'
                                    }`}>
                                        <Key className={`w-4 h-4 ${key.isActive ? 'text-gold' : 'text-red-400'}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white text-sm font-bold">{key.name}</span>
                                            {!key.isActive && (
                                                <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full uppercase font-bold">Revoked</span>
                                            )}
                                        </div>
                                        <code className="text-xs text-gray-500 font-mono">{key.keyPrefix}•••••••</code>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {key.lastUsedAt && (
                                        <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {timeAgo(key.lastUsedAt)}
                                        </span>
                                    )}
                                    {key.isActive && (
                                        <button
                                            onClick={() => handleDeleteKey(key.id)}
                                            className="text-red-500/50 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                            title="Delete Key (Xoá Key)"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Devices */}
                            {key.devices.length > 0 ? (
                                <div className="bg-black/20 rounded-xl border border-white/4 divide-y divide-white/4">
                                    {key.devices.map(device => (
                                        <div key={device.id} className="flex items-center gap-3 px-4 py-2.5">
                                            <Monitor className="w-4 h-4 text-gray-600 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-white/70 truncate">
                                                    {device.deviceName || device.deviceId}
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-gray-600">
                                                    {device.ipAddress && (
                                                        <span className="flex items-center gap-1">
                                                            <Wifi className="w-2.5 h-2.5" />
                                                            {device.ipAddress}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {timeAgo(device.lastUsed)}
                                                    </span>
                                                </div>
                                            </div>
                                            {key.isActive && (
                                                <button
                                                    onClick={() => handleRemoveDevice(key.id, device.deviceId)}
                                                    className="text-gray-700 hover:text-red-400 p-1 rounded transition-colors"
                                                    title="Remove Device"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-3 text-[11px] text-gray-600">
                                    No devices connected yet
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Info Footer */}
            <div className="bg-gold/5 border border-gold/10 rounded-xl px-5 py-4 flex items-start gap-3">
                <Shield className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div className="text-xs text-gray-400 leading-relaxed">
                    <p className="text-gold/80 font-bold mb-1">How to use API keys</p>
                    <p>Paste your API key in the VillainVault Desktop App settings. Each key tracks which devices are using it, limited by your subscription plan. You can revoke keys or remove devices anytime.</p>
                </div>
            </div>
        </div>
    );
}
