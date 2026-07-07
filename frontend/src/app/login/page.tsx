import { redirect } from 'next/navigation';

// Login page removed — auth is now handled via the modal on any page.
export default function LoginPage() {
    redirect('/');
}
