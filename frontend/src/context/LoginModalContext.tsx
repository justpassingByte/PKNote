'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LoginModal } from '@/components/ui/LoginModal';

interface LoginModalContextValue {
    /** Open the login modal with an optional reason message */
    openLogin: (reason?: string) => void;
    closeLogin: () => void;
    isOpen: boolean;
}

const LoginModalContext = createContext<LoginModalContextValue>({
    openLogin: () => {},
    closeLogin: () => {},
    isOpen: false,
});

export function LoginModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState<string | undefined>();

    const openLogin = useCallback((msg?: string) => {
        setReason(msg);
        setIsOpen(true);
    }, []);

    const closeLogin = useCallback(() => {
        setIsOpen(false);
        setReason(undefined);
    }, []);

    return (
        <LoginModalContext.Provider value={{ openLogin, closeLogin, isOpen }}>
            {children}
            <LoginModal isOpen={isOpen} onClose={closeLogin} reason={reason} />
        </LoginModalContext.Provider>
    );
}

export function useLoginModal() {
    return useContext(LoginModalContext);
}
