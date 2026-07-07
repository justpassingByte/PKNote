"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "./en.json";
import vi from "./vi.json";
import { getUserProfile, updateUserLanguage } from "@/app/actions";

export type Language = "en" | "vi";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: string) => string;
    isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, any> = { en, vi };

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>("vi");
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const initializeLanguage = async () => {
            // 1. LocalStorage
            const stored = localStorage.getItem("language") as Language;
            if (stored && ["en", "vi"].includes(stored)) {
                setLanguageState(stored);
            }

            // 2. Fetch from user profile if logged in
            try {
                const profile = await getUserProfile();
                if (profile?.user?.language && ["en", "vi"].includes(profile.user.language)) {
                    setLanguageState(profile.user.language as Language);
                    localStorage.setItem("language", profile.user.language);
                }
            } catch (err) {
                // Ignore, guest user or network error
            } finally {
                setIsLoaded(true);
            }
        };
        initializeLanguage();
    }, []);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("language", lang);

        try {
            await updateUserLanguage(lang);
        } catch (err) {
            console.error("Failed to persist language to backend", err);
        }
    };

    const t = (key: string): string => {
        const keys = key.split(".");
        let value = translations[language];
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                // Fallback to English
                let fallback = translations["en"];
                for (const fbK of keys) {
                    if (fallback && fallback[fbK] !== undefined) fallback = fallback[fbK];
                    else return key;
                }
                return typeof fallback === "string" ? fallback : key;
            }
        }
        return typeof value === "string" ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isLoaded }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
