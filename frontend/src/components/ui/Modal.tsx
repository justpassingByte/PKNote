import { X } from 'lucide-react';
import { ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    subtitle?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    hideOverflow?: boolean;
}

export function Modal({ isOpen, onClose, title, children, subtitle, size = 'md', hideOverflow = false }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    const sizeClasses = {
        sm: 'sm:max-w-md',
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl',
        xl: 'sm:max-w-4xl',
        full: 'sm:max-w-[95vw]',
    };

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-md"
        >
            <div className={`bg-card w-full ${sizeClasses[size]} rounded-t-2xl sm:rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-visible border border-white/5 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 relative max-h-[90vh] sm:max-h-[95vh] flex flex-col`}>
                {/* Top accent line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>

                {/* Header */}
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/5 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">{title}</h2>
                        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className={`p-4 sm:p-6 ${hideOverflow ? 'overflow-visible' : 'overflow-y-auto scrollbar-hide'}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}
