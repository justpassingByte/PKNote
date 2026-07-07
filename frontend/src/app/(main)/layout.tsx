import { Header } from "@/components/layout/Header";
import { getAuthUser } from "@/lib/auth";
import { LoginModalProvider } from "@/context/LoginModalContext";
import { LanguageProvider } from "@/i18n/LanguageContext";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthUser();

    return (
        <LanguageProvider>
            <LoginModalProvider>
                <div className="flex flex-col min-h-screen">
                    <Header user={user} />
                    {children}
                </div>
            </LoginModalProvider>
        </LanguageProvider>
    );
}
