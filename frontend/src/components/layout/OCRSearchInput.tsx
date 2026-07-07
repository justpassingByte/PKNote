import React, { useRef, useState } from 'react';
import { Search, ImagePlus, Loader2, Clipboard } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface OCRSearchInputProps {
    onSearch: (query: string) => void;
}

export function OCRSearchInput({ onSearch }: OCRSearchInputProps) {
    const [query, setQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        onSearch(val);
    };

    const runOCR = async (source: File | Blob) => {
        setIsScanning(true);
        try {
            const worker = await Tesseract.createWorker('chi_sim+chi_tra+eng');
            const { data: { text } } = await worker.recognize(source);
            await worker.terminate();

            const extractedText = text.trim().replace(/\n/g, ' ');
            setQuery(extractedText);
            onSearch(extractedText);
        } catch (err) {
            console.error('OCR Error:', err);
        } finally {
            setIsScanning(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await runOCR(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
        // If no image found, let the default text paste happen
    };

    return (
        <div className="flex items-center w-full relative group">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />

            <input
                type="text"
                value={query}
                onChange={handleTextChange}
                onPaste={handlePaste}
                placeholder={isScanning ? "Scanning image..." : "Search or paste screenshot (Ctrl+V)..."}
                className="w-full bg-background border border-border rounded-full py-1.5 pl-10 pr-10 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                disabled={isScanning}
            />

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                title="Upload or paste image for OCR search"
                className={`absolute right-2 p-1.5 rounded-full transition-colors ${isScanning ? 'text-gold' : 'text-gray-400 hover:text-white hover:bg-card border border-transparent hover:border-gray-500'
                    }`}
            >
                {isScanning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <ImagePlus className="w-4 h-4" />
                )}
            </button>
        </div>
    );
}
