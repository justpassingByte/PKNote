"use server";

import { API } from "@/lib/api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server Action: login.
 */
export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        const res = await fetch(`${API.base}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, deviceId: "web-client" }),
        });

        const json = await res.json();
        if (!json.success) {
            return { error: json.error || "Login failed" };
        }

        // Set cookie
        const cookieStore = await cookies();
        const secure = process.env.NEXT_PUBLIC_API_URL?.startsWith('https') || false;

        cookieStore.set("token", json.token, {
            httpOnly: true,
            secure: secure,
            maxAge: 7 * 24 * 60 * 60, // 7 days
            sameSite: "lax",
            path: "/",
        });
    } catch (err) {
        return { error: "Network error during login" };
    }

    redirect("/dashboard");
}

/**
 * Server Action: register.
 */
export async function register(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        const res = await fetch(`${API.base}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, deviceId: "web-client" }),
        });

        const json = await res.json();
        if (!json.success) {
            return { error: json.error || "Registration failed" };
        }

        // Set cookie (since register auto-logs in)
        const cookieStore = await cookies();
        const secure = process.env.NEXT_PUBLIC_API_URL?.startsWith('https');
        cookieStore.set("token", json.token, {
            httpOnly: true,
            secure: secure,
            maxAge: 7 * 24 * 60 * 60, // 7 days
            sameSite: "lax",
            path: "/",
        });
    } catch (err) {
        return { error: "Network error during registration" };
    }

    redirect("/dashboard");
}

/**
 * Server Action: logout.
 */
export async function logout() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
        try {
            await fetch(`${API.base}/api/auth/logout`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (e) { /* ignore */ }
    }

    cookieStore.delete("token");
    redirect("/");
}
