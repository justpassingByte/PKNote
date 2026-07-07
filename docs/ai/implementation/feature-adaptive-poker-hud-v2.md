---
feature: adaptive-poker-hud-v2
status: Draft
---

# Implementation: Adaptive Poker HUD (V2)

## Architectural Approach
This desktop client will be built as a C# .NET 8 WPF Application because WPF natively supports transparent borderless windows that overlay nicely using `AllowsTransparency="True"`, `Background="Transparent"`, and `WindowStyle="None"`. The `WS_EX_TRANSPARENT` ex-style will handle the click-through vs click-capture mode toggling via raw P/Invoke (`SetWindowLong`).

To capture regions quickly without full desktop overhead, `Windows.Graphics.Capture` will be the primary screen-scraping engine, enabling 300ms polling latency with very low CPU hit.

## Module Details
1. **WindowService (Track/Attach)**: Uses `EnumWindows` and `GetWindowRect` to identify target tables by window title/class. Polls its bounding box to snap the WPF overlay perfectly onto it.
2. **LayoutManager (Projections)**: Translates normalized JSON coordinates (0 to 1) to exact `x, y, w, h` pixel coordinates inside the WPF overlay’s current screen rect.
3. **SeatEngine (Diffing)**: Crops down the `seat_bbox` capture rect. Compares histogram variance/average pixel brightness against thresholds or a "known empty" baseline image to declare an occupant.
4. **OCRService**: Takes `name_bbox` cropped images. Applies ImageMagick/OpenCV grayscale, contrast scaling `+1.5x`, and feeds into `Tesseract` or a lightweight `PaddleOCR` C# wrapper. Only fires when `SeatEngine` flags a delta transition `UNKNOWN -> OCCUPIED` or if brightness drops/spikes noticeably indicating a new player.
5. **ActionEngine & Quick Actions**: WPF Buttons attached to the `hud_anchor` location. Handled by a dictionary of player IDs. Local state updates immediately, while background `HttpClient` task pushes `/event/cbet` to the backend logic.

## Challenges & Solutions
1. **Toggling Input focus**: Clicking `Alt+H` invokes `P/Invoke` to strip `WS_EX_TRANSPARENT`. This allows WPF buttons to catch mouse clicks. Clicking `Esc` or restoring mode puts it back, allowing the user to click poker buttons on the table beneath it.
2. **Scaling Config**: The config mode must overlay green translucent rectangles. Mouse dragging converts raw pixel offsets back to relative `(PixelX / Width) = NormalizedX` for storing into the config profile.
3. **Resiliency to DPI Changes**: GDI and WGC must be scaled relative to Windows DPI. `SetProcessDpiAwareness` must be initialized on start.
4. **Performance**: Only processing OCR when the `occupancy` triggers greatly removes load. The 300ms timer should be staggered across tables if multiple overlays are running.
5. **Cross-contamination Constraints**: Everything is keyed by a `Dictionary<HWND, TableInstance>`. Dispatched events must lock on their unique UI thread since multiple tables means multiple independent overlay loops.
