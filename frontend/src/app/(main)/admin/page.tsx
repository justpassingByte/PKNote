"use client";

import { useState, useEffect } from "react";
import { 
    Users, 
    TrendingUp, 
    CreditCard, 
    Database, 
    Shield, 
    ChevronRight, 
    Clock, 
    BarChart3,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Calendar,
    ArrowUpRight,
    Zap,
    Trash2,
    Plus,
    Search,
    Heart,
    Filter,
    User,
    UploadCloud,
    Save
} from "lucide-react";

interface Stats {
    totalUsers: number;
    premiumUsers: number;
    totalRevenue: number;
    totalHands: number;
    loyalUsers: number;
    conversionRate: string;
    growth: number[];
    recentActivity: Array<{
        id: string;
        email: string;
        amount: number;
        tier: string;
        date: string;
    }>;
}

interface User {
    id: string;
    email: string;
    premium_tier: string;
    is_admin: boolean;
    subscription_expiry: string | null;
    created_at: string;
    _count: { hands: number };
    usages: any[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'plans' | 'database'>('stats');
    const [plans, setPlans] = useState<any[]>([]);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [tierFilter, setTierFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    
    // Database tab states
    const [backupEmail, setBackupEmail] = useState("");
    const [isSavingEmail, setIsSavingEmail] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);

    const initialPlanState = {
        id: "",
        name: "",
        price: 0,
        description: "",
        features: [],
        ai_limit: 0,
        name_ocr_limit: 0,
        hand_ocr_limit: 0,
        max_devices: 1,
        is_popular: false,
        color_theme: "gold"
    };

    const fetchStats = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/admin/stats`, { credentials: "include" });
            const json = await res.json();
            if (json.success) setStats(json.data);
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const params = new URLSearchParams({
                tier: tierFilter,
                status: statusFilter,
                search: searchTerm
            });
            const res = await fetch(`${baseUrl}/api/admin/users?${params}`, { credentials: "include" });
            const json = await res.json();
            if (json.success) setUsers(json.data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    const fetchPlans = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/admin/pricing`, { credentials: "include" });
            const json = await res.json();
            if (json.success) setPlans(json.data);
        } catch (err) {
            console.error("Failed to fetch plans:", err);
        }
    };

    const fetchSettings = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/admin/db/settings`, { credentials: "include" });
            const json = await res.json();
            if (json.success) setBackupEmail(json.data.email);
        } catch (err: any) {
            console.error("Failed to fetch settings:", err);
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchStats(), fetchUsers(), fetchPlans(), fetchSettings()]);
            setLoading(false);
        };
        load();
    }, [tierFilter, statusFilter, searchTerm]);

    const handleUpdateUser = async (userId: string, tier: string, days: number) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/admin/users/update-subscription`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, tier, expiryDays: days }),
                credentials: "include"
            });
            if (res.ok) fetchUsers();
        } catch (err) { console.error(err); }
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/admin/pricing`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingPlan),
                credentials: "include"
            });
            const json = await res.json();
            if (json.success) {
                alert("Plan saved!");
                setEditingPlan(null);
                fetchPlans();
            }
        } catch (err) {
            console.error("Save failed:", err);
        }
    };

    const handleDeletePlan = async (planId: string) => {
        if (!confirm("Are you sure? This will affect all current subscribers to this plan.")) return;
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/admin/pricing/${planId}`, {
                method: "DELETE",
                credentials: "include"
            });
            const json = await res.json();
            if (json.success) {
                alert("Plan deleted!");
                fetchPlans();
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const handleSaveEmail = async () => {
        setIsSavingEmail(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            await fetch(`${baseUrl}/api/admin/db/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: backupEmail }),
                credentials: "include"
            });
            alert("Backup email saved successfully!");
        } catch (err) {
            alert("Error saving email");
        } finally {
            setIsSavingEmail(false);
        }
    };

    const handleManualBackup = async () => {
        if (!confirm(`Are you sure you want to trigger a manual backup to ${backupEmail}?`)) return;
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/admin/db/backup`, { method: 'POST', credentials: "include" });
            const json = await res.json();
            alert(json.message || "Backup triggered");
        } catch (err: any) {
            alert("Backup failed: " + err.message);
        }
    };

    const handleRestoreBackup = async () => {
        if (!restoreFile) return alert("Please select a file to restore.");
        if (!confirm("WARNING: This will overwrite the CURRENT database. This action is irreversible. Proceed?")) return;
        
        try {
            const formData = new FormData();
            formData.append('backup', restoreFile);
            
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${baseUrl}/api/admin/db/restore`, { 
                method: 'POST', 
                body: formData,
                credentials: "include"
            });
            const json = await res.json();
            alert(json.message || "Restore triggered.");
            setRestoreFile(null);
        } catch (err) {
            alert("Error trying to restore database");
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gold">Loading Admin...</div>;

    // Features are dynamically loaded from and saved to the database.
    return (
        <main className="flex-1 pt-24 px-4 sm:px-8 pb-12 min-h-screen relative overflow-hidden">
            {/* Background Aesthetics */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3">
                            <Shield className="w-8 h-8 text-gold" />
                            Admin Central
                        </h1>
                        <p className="text-gray-500 mt-1">Intelligence management and revenue tracking</p>
                    </div>

                    {/* System Server Health Global Card */}
                    <div className="flex items-center gap-4 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-3 pl-4 pr-5 shadow-2xl relative overflow-hidden group min-w-fit cursor-default hover:border-emerald-500/30 transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-30"></div>
                            <Database className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="relative z-10 flex flex-col">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">System Health</h3>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Healthy</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Automated Cron: Active (Sun 02:00 AM)</p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        label="Total Users" 
                        value={stats?.totalUsers || 0} 
                        icon={Users} 
                        color="text-blue-400" 
                        subtext={`${stats?.premiumUsers || 0} Premium`}
                    />
                    <StatCard 
                        label="Total Revenue" 
                        value={`$${stats?.totalRevenue || 0}`} 
                        icon={TrendingUp} 
                        color="text-emerald-400" 
                        subtext={`CR: ${stats?.conversionRate || 0}%`}
                    />
                    <StatCard 
                        label="Hands Analyzed" 
                        value={stats?.totalHands || 0} 
                        icon={BarChart3} 
                        color="text-purple-400" 
                        subtext="Processing daily"
                    />
                    <StatCard 
                        label="Loyal Users" 
                        value={stats?.loyalUsers || 0} 
                        icon={Heart} 
                        color="text-red-400" 
                        subtext="Power active users"
                    />
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-between border-b border-white/10">
                    <div className="flex gap-4">
                        <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="Overview" />
                        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="User Management" />
                        <TabButton active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} label="Subscription Plans" />
                        <TabButton active={activeTab === 'database'} onClick={() => setActiveTab('database')} label="Database" />
                    </div>
                    {activeTab === 'plans' && (
                        <button 
                            onClick={() => setEditingPlan({...initialPlanState})}
                            className="mb-2 bg-gold hover:bg-yellow-500 text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-gold/20"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Plan
                        </button>
                    )}
                </div>

                {/* User Table */}
                {activeTab === 'users' && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input 
                                    type="text"
                                    placeholder="Search by email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-card border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-gold/30 transition-all"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <select 
                                    value={tierFilter}
                                    onChange={(e) => setTierFilter(e.target.value)}
                                    className="bg-card border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold/30 transition-all cursor-pointer"
                                >
                                    <option value="ALL">All Tiers</option>
                                    <option value="FREE">Free</option>
                                    <option value="PRO">Pro</option>
                                    <option value="PRO_PLUS">Elite</option>
                                    <option value="ENTERPRISE">Enterprise</option>
                                </select>
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-card border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold/30 transition-all cursor-pointer"
                                >
                                    <option value="ALL">All Roles</option>
                                    <option value="ACTIVE">Active Sub</option>
                                    <option value="EXPIRED">Expired Sub</option>
                                </select>
                                <select 
                                    value={(window as any).verifiedFilter || "ALL"}
                                    onChange={(e) => {
                                        (window as any).verifiedFilter = e.target.value;
                                        fetchUsers();
                                    }}
                                    className="bg-card border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold/30 transition-all cursor-pointer"
                                >
                                    <option value="ALL">All Verify</option>
                                    <option value="true">Verified Only</option>
                                    <option value="false">Unverified</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Tier & Verified</th>
                                            <th className="px-6 py-4">AI Usage (Current)</th>
                                            <th className="px-6 py-4">Expiry</th>
                                            <th className="px-6 py-4 text-right">Manage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map((user: any) => (
                                            <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border border-white/10 shrink-0">
                                                            <User className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white group-hover:text-gold transition-colors">{user.email}</p>
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{user.id.substring(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded inline-flex items-center gap-1 ${
                                                            user.premium_tier === 'FREE' ? 'bg-gray-500/10 text-gray-400' :
                                                            user.premium_tier === 'PRO' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                                                        }`}>
                                                            {plans.find(p => p.id === user.premium_tier)?.name || user.premium_tier}
                                                            {user.is_admin && <Shield className="w-3 h-3 ml-1 text-gold" />}
                                                        </span>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${user.email_verified ? 'text-emerald-400' : 'text-yellow-500'}`}>
                                                            {user.email_verified ? "VERIFIED" : "UNVERIFIED"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-white">
                                                        {user.usages && user.usages.length > 0 ? (
                                                            <span className="font-mono text-blue-300">{user.usages[0].ai_analysis_used} AI Used</span>
                                                        ) : (
                                                            <span className="text-gray-500">No usage data</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs ${user.subscription_expiry && new Date(user.subscription_expiry) < new Date() ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                                                        {user.subscription_expiry ? new Date(user.subscription_expiry).toLocaleDateString() : 'Lifetime / Free'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap justify-end max-w-[140px] ml-auto">
                                                        <button onClick={() => handleUpdateUser(user.id, 'FREE', 0)} className="text-[9px] bg-white/5 hover:bg-gray-500/20 text-gray-400 px-2 py-1 rounded border border-white/10 transition-all uppercase font-bold">
                                                            FREE
                                                        </button>
                                                        <button onClick={() => handleUpdateUser(user.id, 'PRO', 30)} className="text-[9px] bg-white/5 hover:bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-white/10 transition-all uppercase font-bold">
                                                            PRO
                                                        </button>
                                                        <button onClick={() => handleUpdateUser(user.id, 'PRO_PLUS', 30)} className="text-[9px] bg-white/5 hover:bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-white/10 transition-all uppercase font-bold">
                                                            ELITE
                                                        </button>
                                                        <button onClick={async () => {
                                                            if(confirm('Are you sure you want to delete this user?')) {
                                                                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                                                                await fetch(`${baseUrl}/api/admin/users/${user.id}`, { method: 'DELETE', credentials: "include" });
                                                                fetchUsers();
                                                            }
                                                        }} className="text-[9px] bg-red-500/10 hover:bg-red-500/30 text-red-500 px-2 py-1 rounded border border-red-500/20 transition-all uppercase font-bold flex items-center gap-1 w-full mt-1 justify-center">
                                                            <Trash2 className="w-3 h-3" /> DEL
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Plans Management */}
                {activeTab === 'plans' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
                        {plans.map((plan: any) => (
                            <div key={plan.id} className="bg-card border border-white/10 rounded-2xl p-6 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 flex gap-2">
                                    <button 
                                        onClick={() => handleDeletePlan(plan.id)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-all"
                                        title="Delete Plan"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setEditingPlan({...plan})}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-gold/20 text-gray-400 hover:text-gold transition-all"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <h3 className="text-xl font-black text-white mb-1">{plan.name}</h3>
                                <div className="text-2xl font-black text-gold mb-6">${plan.price}<span className="text-[10px] text-gray-500 ml-1">/mo</span></div>
                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                                        <span>AI / Daily</span>
                                        <span className="text-white">{plan.ai_limit}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                                        <span>Name OCR</span>
                                        <span className="text-white">{plan.name_ocr_limit}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                                        <span>Hand OCR</span>
                                        <span className="text-white">{plan.hand_ocr_limit}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                                        <span>Devices</span>
                                        <span className="text-white">{plan.max_devices}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Edit Plan Modal */}
                {editingPlan && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <h2 className="text-xl font-black text-white mb-8 flex items-center gap-2 uppercase tracking-tighter">
                                <Zap className="text-gold w-5 h-5" />
                                Edit Plan {editingPlan.id}
                            </h2>
                            <form onSubmit={handleSavePlan} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Plan ID (Unique)</label>
                                    <input 
                                        value={editingPlan.id}
                                        onChange={(e) => setEditingPlan({...editingPlan, id: e.target.value.toUpperCase()})}
                                        placeholder="e.g. VIP_MONTHLY"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-gold/50 text-sm font-mono"
                                        disabled={plans.some(p => p.id === editingPlan.id && editingPlan.id !== "") && !plans.find(p => p.id === editingPlan.id)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Display Name</label>
                                        <input 
                                            value={editingPlan.name}
                                            onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-gold/50 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Price ($)</label>
                                        <input 
                                            type="number"
                                            value={editingPlan.price}
                                            onChange={(e) => setEditingPlan({...editingPlan, price: parseFloat(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-gold/50 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Description</label>
                                    <textarea 
                                        value={editingPlan.description || ""}
                                        onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                                        placeholder="Short description for the pricing card"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-gold/50 text-sm resize-none h-16"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Analyst / Day</label>
                                        <input 
                                            type="number"
                                            value={editingPlan.ai_limit}
                                            onChange={(e) => setEditingPlan({...editingPlan, ai_limit: parseInt(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-gold/50 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Name OCR / Day</label>
                                        <input 
                                            type="number"
                                            value={editingPlan.name_ocr_limit}
                                            onChange={(e) => setEditingPlan({...editingPlan, name_ocr_limit: parseInt(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-gold/50 text-sm font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hand OCR / Day</label>
                                        <input 
                                            type="number"
                                            value={editingPlan.hand_ocr_limit}
                                            onChange={(e) => setEditingPlan({...editingPlan, hand_ocr_limit: parseInt(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-gold/50 text-sm font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Max Devices</label>
                                        <input 
                                            type="number"
                                            value={editingPlan.max_devices}
                                            onChange={(e) => setEditingPlan({...editingPlan, max_devices: parseInt(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-gold/50 text-sm font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                        <span>Plan Features</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setEditingPlan({...editingPlan, features: [...editingPlan.features, "New Feature"]})}
                                            className="text-gold hover:text-yellow-500 flex items-center gap-1 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" /> Add Feature
                                        </button>
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {editingPlan.features.map((feat: string, index: number) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    value={feat}
                                                    onChange={(e) => {
                                                        const newFeatures = [...editingPlan.features];
                                                        newFeatures[index] = e.target.value;
                                                        setEditingPlan({...editingPlan, features: newFeatures});
                                                    }}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-gold/50 text-sm"
                                                    placeholder="Feature description"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newFeatures = [...editingPlan.features];
                                                        newFeatures.splice(index, 1);
                                                        setEditingPlan({...editingPlan, features: newFeatures});
                                                    }}
                                                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-red-500 hover:border-red-500/50 transition-all flex items-center justify-center"
                                                    title="Remove feature"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {(!editingPlan.features || editingPlan.features.length === 0) && (
                                            <div className="text-xs text-gray-500 italic p-4 text-center border border-dashed border-white/10 rounded-xl">
                                                No features added. Click "Add Feature" to create one.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="flex-1 bg-gold text-black font-black py-4 rounded-xl uppercase text-xs tracking-widest hover:bg-yellow-500 transition-colors shadow-lg shadow-gold/20">
                                        Deploy Configuration
                                    </button>
                                    <button type="button" onClick={() => setEditingPlan(null)} className="px-8 bg-white/5 text-gray-400 font-bold rounded-xl text-xs uppercase tracking-widest border border-white/10">
                                        Dismiss
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 duration-500">
                        <div className="bg-card border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
                                Growth Metrics
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </h3>
                            <div className="h-64 flex items-end justify-between gap-2 px-2">
                                {(stats?.growth || [0, 0, 0, 0, 0, 0, 0]).map((val, i) => {
                                    const max = Math.max(...(stats?.growth || [1]));
                                    const height = max === 0 ? 0 : (val / max) * 100;
                                    return (
                                        <div key={i} className="flex-1 space-y-2">
                                            <div 
                                                className="bg-gold/20 hover:bg-gold/40 transition-all rounded-t-lg border-t border-x border-gold/30 relative group" 
                                                style={{ height: `${Math.max(height, 5)}%` }}
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {val}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-gray-600 text-center">T-{6-i}d</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="bg-card border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-6">Recent Activity</h3>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                                    stats.recentActivity.map(activity => (
                                        <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-gold/20 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                                    <CreditCard className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{activity.email}</p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {new Date(activity.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        <span className="ml-2 text-gold">[{activity.tier}]</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-emerald-400 font-bold text-sm">+${activity.amount}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                                        <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                                        <p className="text-xs uppercase font-bold tracking-widest">No recent transactions</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Database Management - Premium UI */}
                {activeTab === 'database' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Backup Configuration Card */}
                            <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-white/10 to-transparent group">
                                <div className="absolute inset-0 bg-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="relative h-full bg-[#050505] rounded-3xl p-8 flex flex-col justify-between overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
                                    
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                                                <Save className="w-5 h-5 text-gray-300" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">Auto-Backup Vault</h3>
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed mb-6">
                                            Securely configure your remote backup destination. Every week, a full snapshot of the VillainVault database is encrypted and dispatched directly to this secure inbox.
                                        </p>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">
                                                Destination Inbox
                                            </label>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <div className="relative flex-1">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Shield className="h-4 w-4 text-gold/50" />
                                                    </div>
                                                    <input 
                                                        type="email"
                                                        value={backupEmail}
                                                        onChange={(e) => setBackupEmail(e.target.value)}
                                                        placeholder="admin@villainvault.ai"
                                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all font-mono shadow-inner block"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={handleSaveEmail}
                                                    disabled={isSavingEmail}
                                                    className="shrink-0 bg-white/5 hover:bg-gold hover:text-black text-white px-6 py-3 rounded-xl border border-white/10 hover:border-gold transition-all duration-300 flex items-center justify-center gap-2 uppercase text-xs font-black tracking-widest group/btn"
                                                >
                                                    {isSavingEmail ? "Saving..." : (
                                                        <>Set Vault <ArrowUpRight className="w-4 h-4 opacity-50 group-hover/btn:opacity-100" /></>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-white/5">
                                        <button 
                                            onClick={handleManualBackup}
                                            className="w-full relative overflow-hidden group/manual"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl opacity-20 group-hover/manual:opacity-100 transition-opacity duration-500 blur-xl"></div>
                                            <div className="relative bg-[#0a0a0a] border border-blue-500/30 group-hover/manual:border-blue-400 group-hover/manual:bg-blue-900/20 text-blue-400 group-hover/manual:text-white font-black py-4 rounded-xl uppercase text-xs tracking-widest transition-all duration-300 transform group-hover/manual:-translate-y-[1px] flex items-center justify-center gap-3">
                                                <Zap className="w-4 h-4" />
                                                Force Immediate Extraction
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Restore Protocol Card */}
                            <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-red-500/30 to-transparent group">
                                <div className="absolute inset-0 bg-red-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="relative h-full bg-[#050500] rounded-3xl p-8 flex flex-col justify-between overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-red-600/10 rounded-full blur-[80px]"></div>
                                    
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 shadow-inner">
                                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                                </div>
                                                <h3 className="text-xl font-bold text-red-100">Disaster Recovery</h3>
                                            </div>
                                            <span className="text-[9px] font-black uppercase text-red-500/70 border border-red-500/20 px-2 py-1 rounded bg-red-500/10">High Risk</span>
                                        </div>
                                        
                                        <p className="text-sm text-red-200/50 leading-relaxed mb-6 font-medium">
                                            Uploading a timeline snapshot will permanently overwrite the current state vector. 
                                            Only valid <code className="text-red-400 bg-red-950/30 px-1 rounded">.sql</code> or <code className="text-red-400 bg-red-950/30 px-1 rounded">.sql.gz</code> dumps generated by pg_dump are accepted.
                                        </p>

                                        <div className="relative group/upload">
                                            <div className="absolute inset-0 bg-red-500/5 rounded-2xl scale-[0.98] group-hover/upload:scale-100 transition-transform duration-300"></div>
                                            <div className="relative border-2 border-dashed border-red-500/20 group-hover/upload:border-red-500/40 bg-[#0a0000] hover:bg-red-950/20 rounded-2xl p-6 transition-all duration-300 text-center cursor-pointer overflow-hidden">
                                                <UploadCloud className="w-8 h-8 text-red-500/50 mx-auto mb-3 group-hover/upload:-translate-y-1 transition-transform" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-red-200 group-hover/upload:text-red-100">
                                                        {restoreFile ? restoreFile.name : "Select Snapshot Payload"}
                                                    </p>
                                                    <p className="text-[10px] text-red-500/50 uppercase tracking-widest font-mono">
                                                        {restoreFile ? (restoreFile.size / 1024 / 1024).toFixed(2) + " MB" : "Click to browse"}
                                                    </p>
                                                </div>
                                                <input 
                                                    type="file" 
                                                    accept=".sql,.gz" 
                                                    onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-red-500/10">
                                        <button 
                                            onClick={handleRestoreBackup}
                                            disabled={!restoreFile}
                                            className="w-full relative overflow-hidden group/restore disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-600 rounded-xl opacity-0 group-hover/restore:opacity-100 transition-opacity duration-300"></div>
                                            <div className="relative bg-red-500/20 border border-red-500/30 group-hover/restore:border-transparent text-red-200 group-hover/restore:text-white font-black py-4 rounded-xl uppercase text-xs tracking-widest transition-all duration-300 flex items-center justify-center gap-3">
                                                <Shield className="w-4 h-4" />
                                                Execute Protocol 0
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

function StatCard({ label, value, icon: Icon, color, subtext }: any) {
    return (
        <div className="bg-card border border-white/10 rounded-2xl p-6 hover:border-gold/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-white/5`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-gold transition-colors" />
            </div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</h4>
            <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{value}</span>
            </div>
            <p className="mt-1 text-[10px] text-gray-600 font-medium">{subtext}</p>
        </div>
    );
}

function TabButton({ active, onClick, label }: any) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-3 text-sm font-bold transition-all relative ${
                active ? 'text-gold' : 'text-gray-500 hover:text-white'
            }`}
        >
            {label}
            {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold rounded-t-full" />}
        </button>
    );
}
