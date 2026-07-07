---
feature: adaptive-poker-hud-v2
status: Draft
---

# Feature: Adaptive Poker HUD (V2)

## Problem Statement
Current HUD solutions are rigid and highly dependent on specific poker site structures, which can change frequently and cause the HUD to break. There is a need for an adaptive, vision-based desktop HUD that uses user-configured bounding boxes (via drag & drop) to automatically detect poker tables, seats, and player names, extract stats via API, and render overlays independent of site-specific memory reading or hardcoded screen locations.

## Goals
- Build a desktop HUD client in C# (.NET 8) with WPF.
- Implement an overlay system using Windows Graphics Capture.
- Auto-detect poker tables & seats based on a Config System where users draw bounding boxes (normalized 0 -> 1 coordinates).
- Extract player names via OCR (pluggable Tesseract/PaddleOCR/External API) and fetch stats to render the HUD.
- Support interactive Quick Action buttons (+CBet, +FoldTo3Bet) to instantly update stats.
- Support inline and full-panel note taking on players.
- Handle Multi-table setups reliably with 1 overlay per table via a Dictionary state store.
- Lay the ground architecture to support future extensions for real-time vision (board/action reading).

## Non-Goals
- Real-time vision detection for board cards and bets/actions in this iteration (this is a future goal).
- Direct memory reading from poker clients.
- Complex AI models or high-end visuals (focus is on event system, layout correctness, and latency).

## User Stories
- **Config User**: "As a user, I want to press Alt+C to enter config mode and draw bounding boxes for seats and names, so the HUD can adapt to my specific poker client layout."
- **Player**: "As a player, when an opponent sits down, I want the OCR to automatically read their name, fetch their stats, and display the HUD at my anchored location."
- **Grinder**: "As a multi-tabler, I want to quickly click '+CBet' on a player's HUD to update their stats in real-time, giving me optimistic UI updates instantly."
- **Note Taker**: "As a player, I want to click a HUD to quickly add a note inline, or open a full panel for detailed notes."

## Success Criteria
- User configs layout once per site/table-size -> works across all instances of that layout.
- When a player sits, the HUD appears automatically.
- Clicking a quick action updates the underlying stat and the UI immediately (<100ms feedback).
- Multi-tabling is stable with no cross-contamination of HUDs.
- The layout scales correctly when the poker window is resized, maintaining accurate bounding box mappings.

## Constraints
- Main polling loop is 300ms.
- OCR must only run on state change (detect occupancy change via pixel diff/brightness).
- API calls must be cached and batched to prevent lag across multiple tables.
- Click-through behavior must be robust (toggling `WS_EX_TRANSPARENT` for input).
- **Maximum 8 concurrent tables.** Beyond this limit, the system must warn the user gracefully rather than silently degrading.
- **Config profiles** are stored locally on the user's machine at `%AppData%\PokerHUD\profiles\` as JSON files — not bundled inside the application.
- **DPI Awareness:** The application must declare `Per-Monitor DPI Aware V2` (`PerMonitorV2`) to ensure bounding box calculations remain accurate when the poker window is dragged across monitors with different DPI settings.
- **OCR errors must be surfaced explicitly:** When name extraction fails after all retries, the HUD seat must display a visible error state (e.g., red badge / "?" indicator) so the user knows intervention is needed. Silent failures are not acceptable.

## Open Questions
*(Đã được chốt — không còn câu hỏi mở)*

### Resolved
| Question | Answer |
|---|---|
| OCR fallback UX khi thất bại? | Hiển thị badge lỗi rõ ràng (đỏ/"?") trên HUD seat để user biết cần can thiệp thủ công. |
| Hỗ trợ DPI scaling? | Dùng chuẩn `Per-Monitor DPI Aware V2` của Windows 10/11. |
| Lưu config ở đâu? | `%AppData%\PokerHUD\profiles\` trên máy user (JSON files). |
| Giới hạn số bàn? | Tối đa **8 bàn** cùng lúc. |
