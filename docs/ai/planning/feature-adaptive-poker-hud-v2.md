---
feature: adaptive-poker-hud-v2
status: Done
---

# Planning: Adaptive Poker HUD (V2)

## Task Breakdown
### Phase 1: Core Systems & Windows Overlay (Priority: Config Bounding Box System)
- [x] Scaffold C# .NET 8 WPF application layout and build `WindowService`.
- [x] Create `OverlayManager` to spawn transparent WPF overlays atop tracked windows.
- [x] Implement `LayoutManager` to consume normalized coordinates (`0-1`) and project them to absolute pixel rects dynamically on `SizeChanged` events.
- [x] Build `ConfigController` and UI mode (Alt+C) for drawing, dragging, resizing, and saving bounds into JSON config profiles. Support 6-max and 8-max templates.

### Phase 2: Capture, Edge Detection, OCR (Priority: Seat Detection)
- [x] Hook screen capture API (GDI BitBlt via `ICaptureService`) to grab partial frames of `seat_bbox` and `name_bbox`.
- [x] Build `SeatEngine` holding the 300ms core polling loop with 500ms debounce.
- [x] Implement `pixel diff`/`brightness variance` inside `SeatEngine` to infer `EMPTY`, `OCCUPIED`, `UNKNOWN` states.
- [x] Implement `OCRService` wrapper (interface + stub + preprocessing pipeline: scale x1.5, grayscale, contrast boost).
- [x] Wire OCR to be conditionally triggered only when a `SeatEngine` state transitions to `OCCUPIED`. Setup retry logic with confidence scoring (0.6/0.4 thresholds).

### Phase 3: Event Engine, API, & Reactivity (Priority: Quick Actions)
- [x] Create `ApiClient` for batched HTTP/REST integration with 100ms collection window and 5-min cache.
- [x] Create `ActionEngine` logic layer with optimistic local updates and async API dispatch.
- [x] Create `EventNormalizer` to unify manual clicks and future vision input.
- [x] Construct `HudRenderer` component, displaying `[VPIP/PFR/AF]` + quick action buttons + OCR error badge.
- [x] Build `InputController` toggle (Alt+H) to toggle `WS_EX_TRANSPARENT` for click capture.
- [x] Construct Quick Action Buttons (`+CB`, `+F3B`, `+3B`, `+C`) wired through EventNormalizer → ActionEngine.

### Phase 4: Note System & Multi-Table Hardening (Priority: Overlay Stability)
- [x] Create Note UI: Quick inline textbox (on overlay) + full-edit popup panel.
- [x] Configure ConcurrentDictionary-based tracking `Dictionary<HWND, TableInstance>` for multi-table support.
- [x] Wire full event pipeline: SeatEngine → OCR → ApiClient → StateStore → HudRenderer.
- [x] Build verified — 0 errors, 0 warnings.

## Dependencies
- Backend API (`POST /players/search`, `POST /event`) needs to exist or be mockable during Phase 3. ✅ Stub ready
- Screen capture wrapper for .NET 8. ✅ GDI BitBlt via ICaptureService
- Pluggable OCR library. ✅ IOcrService interface + StubOcrService

## Effort Estimates
- Phase 1: ~3-5 days → ✅ Done (session 1)
- Phase 2: ~4-6 days → ✅ Done (session 1)
- Phase 3: ~3 days → ✅ Done (session 1)
- Phase 4: ~2-3 days → ✅ Done (session 1)

## Risks
- **Window Capture Permissions**: Mitigated with GDI BitBlt fallback (ICaptureService interface allows swapping to WGC).
- **OCR Accuracy Loss**: Mitigated with preprocessing pipeline + confidence scoring + seat locking + manual override.
- **Click-Through Toggling**: Mitigated with InputController managing WS_EX_TRANSPARENT state via lock.
