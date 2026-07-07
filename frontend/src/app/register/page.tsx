import { redirect } from 'next/navigation';

// Register page removed — auth is now handled via the modal on any page.
export default function RegisterPage() {
    redirect('/dashboard');
}
