import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch("https://api.github.com/repos/justpassingByte/PoNotesFE/releases/latest", {
            headers: {
                "Accept": "application/vnd.github.v3+json",
                // Provide a User-Agent as required by GitHub API
                "User-Agent": "VillainVault-API"
            },
            next: { revalidate: 600 } // Cache results for 10 minutes to prevent API rate limiting
        });

        if (response.ok) {
            const data = await response.json();
            const downloadUrl = data.assets?.[0]?.browser_download_url;
            
            if (downloadUrl) {
                return NextResponse.redirect(downloadUrl);
            }
        }
    } catch (error) {
        console.error("Failed to fetch latest GitHub release:", error);
    }

    // Fallback to the releases page if API fails
    return NextResponse.redirect("https://github.com/justpassingByte/PoNotesFE/releases/latest");
}
