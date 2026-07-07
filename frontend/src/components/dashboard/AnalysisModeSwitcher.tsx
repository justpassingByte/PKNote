"use client";

import { useState, useEffect } from "react";
import { Zap, BookOpen } from "lucide-react";
import { getAppSettings, updateAppSettings } from "@/app/actions";

interface AnalysisModeSwitcherProps {
    onChange?: (mode: string) => void;
}

export function AnalysisModeSwitcher({ onChange }: AnalysisModeSwitcherProps) {
    const [mode, setMode] = useState<"simple" | "advanced">("simple");
    const [aiEnabled, setAiEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await getAppSettings();
            if (data) {
                setMode(data.analysis_mode || "simple");
                setAiEnabled(data.ai_enabled || false);
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            setLoading(false);
        }
    };

    const handleModeChange = async (newMode: "simple" | "advanced") => {
        setMode(newMode);
        onChange?.(newMode);
        try {
            await updateAppSettings({ analysis_mode: newMode });
        } catch (err) {
            console.error("Failed to update analysis mode", err);
        }
    };

    if (loading || !aiEnabled) return null;

    return (
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
            <button
                onClick={() => handleModeChange("simple")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${mode === "simple"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-gray-500 hover:text-gray-300 border border-transparent"
                    }`}
            >
                <BookOpen className="w-3 h-3" /> Simple
            </button>
            <button
                onClick={() => handleModeChange("advanced")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${mode === "advanced"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "text-gray-500 hover:text-gray-300 border border-transparent"
                    }`}
            >
                <Zap className="w-3 h-3" /> Advanced
            </button>
        </div>
    );
}
