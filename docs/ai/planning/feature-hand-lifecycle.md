# Feature Plan: Hand Lifecycle
## Core Models
- [x] Task 1: Update TableInstance.cs and SeatState.cs with hand tracking state and boolean flags (HasVPIP, HasPFR).

## Detection & Update Loop
- [ ] Task 2: Create Separate Start/End Hand logic (potentially inside TableInstance or ActionEngine).
- [ ] Task 3: Create BoardTrackerEngine.cs as a task-based loop using OpenCV for board card detection, including stable frame debouncing.
- [ ] Task 4: Update GdiCaptureService to use _captureLock for thread-safety.
- [ ] Task 5: Update ActionEngine and SeatEngine with lightweight OCR parsing for Preflop Action Detection and Guarded Start conditions. Include clear VPIP/PFR on player swap.

## UI & API Sync
- [ ] Task 6: Update HudRenderer to add expandable states for VPIP/PFR.
- [ ] Task 7: Update SyncService to dispatch batched stats exclusively on EndHand.
