---
feature: adaptive-poker-hud-v2
status: Complete
last_run: 2026-03-28
results: 113 passed / 0 failed
---

# Testing: Adaptive Poker HUD (V2)

## Test Project
- **Location**: `desktop.Tests/`
- **Framework**: xUnit 2.5 + Moq 4.20 + Coverlet 6.0
- **Target**: `net8.0-windows` (WPF dependency)
- **Run**: `dotnet test desktop.Tests/ --logger "console;verbosity=detailed"`

## Unit Tests (8 test files, 113 test cases)

### NormalizedBBoxTests (8 tests)
- Multi-resolution projection (1080p, 1440p, 4K)
- Zero-size and full-window edge cases
- Corner coordinates (origin, bottom-right)
- System.Drawing.Rectangle conversion

### StateStoreTests (15 tests)
- 8-table cap enforcement (MaxTables = 8)
- Duplicate HWND rejection
- Table add/remove lifecycle
- Seat auto-creation via UpdateSeat
- OCR field tracking (confidence, raw text, retry count)
- **Concurrent safety**: `Task.WhenAll` with 8-table parallel add, 6-seat × 100 iteration concurrent updates

### NameNormalizerTests (14 tests)
- Whitespace, special character, and control character stripping
- Unicode preservation (Vietnamese chars)
- Levenshtein distance (classic kitten→sitting, null inputs)
- Fuzzy matching: exact match, OCR error (l→1), case-insensitive, max distance rejection

### OcrResultTests (15 tests)
- `ShouldAccept` threshold (≥ 0.6)
- `ShouldRetry` threshold (0.4 ≤ c < 0.6)
- `ShouldFail` threshold (< 0.4 or empty text)
- Empty/whitespace/null text handling

### ActionEngineTests (7 tests)
- EventNormalizer source tagging: `manual` vs `vision`
- Optimistic stat updates: +CBet → AF increment, +Call → VPIP increment
- `OnActionApplied` event firing
- Null stats safety

### SeatEventTests (6 tests)
- Join detection: Empty→Occupied, Unknown→Occupied
- Leave detection: Occupied→Empty
- No-change cases: same status
- Timestamp default

### ConfigProfileTests (5 tests)
- Model default values
- Enum coverage: ActionType (9 values), Occupancy (3 values), TableType
- SeatConfig/SeatState defaults

### ProfileRepositoryTests (8 tests)
- Save/load JSON roundtrip (preserves all fields)
- `UpdatedAt` timestamp
- Delete existing/nonexistent profiles
- Filename sanitization (special chars)
- **Schema migration**: v0→v1 auto-fills HudAnchor defaults

## Integration Tests (7 tests in IntegrationTests.cs)
- **Seat join → OCR → stats**: full state update pipeline
- **Seat leave**: clears player name, preserves LastValidName
- **OCR fail → seat locking**: falls back to LastValidName
- **Manual override**: clears OcrFailed, sets ManualOverride
- **Multi-table isolation**: table 1 state doesn't leak to table 2
- **Action pipeline**: EventNormalizer → ActionEngine → StateStore
- **OCR preprocessor**: small bitmap processing doesn't crash
- **StubOcrService**: returns valid 0.75 confidence result

## Coverage Strategy
```bash
# Run with coverage
dotnet test desktop.Tests/ --collect:"XPlat Code Coverage"

# Generate HTML report
reportgenerator -reports:"desktop.Tests/TestResults/*/coverage.cobertura.xml" -targetdir:"coverage-report"
```

### Coverage Status
| Module | Estimated Coverage | Notes |
|---|---|---|
| Models (SeatState, OcrResult, ActionEvent, NormalizedBBox) | ~95% | All properties and enums covered |
| StateStore | ~90% | Thread-safe CRUD, 8-cap enforcement |
| NameNormalizer | ~85% | Normalize, Levenshtein, FuzzyMatch |
| ProfileRepository | ~80% | Save/load/delete, schema migration |
| ActionEngine | ~75% | ProcessAction, optimistic updates |
| SeatEngine | ~30% | Requires bitmap mocks (Win32 dependent) |
| OverlayManager | ~10% | WPF integration (UI thread required) |
| HudRenderer | ~10% | WPF visual rendering (UI thread) |

### Files Still Needing Coverage
- `SeatEngine.cs` — needs GDI bitmap mocking for pixel-diff logic
- `OverlayManager.cs` — WPF integration, needs UI thread dispatcher
- `HudRenderer.cs` — canvas rendering, UI-dependent
- `ConfigController.cs` — mouse interaction, WPF-dependent

## Performance Benchmarks (Reference)
- **CPU Target**: < 3% utilization across 4 simultaneous tables
- **Loop Polling Target**: 300ms cycle finishes processing within < 25ms
- **Memory Footprint**: Keep OCR handles properly disposed. Total app RAM < 200MB

## End-to-End Testing (Manual)
- **Scenario A (Config Setup)**: Enter config mode, size up a 6-max seat. Move to Table 2, verify template locks perfectly.
- **Scenario B (Player Join)**: Wait for player to sit down. Ensure OCR reads name and HUD fades in with valid mocked backend stats < 2.0s.
- **Scenario C (Action Logging)**: Click +CB quickly. Ensure API registers 200 OK and compact HUD updates from [20 / 15 / 1] to [20 / 15 / 2] instantly.
- **Scenario D (Multi-table)**: Two tables open simultaneously. Leaving Table 1 empties HUD on Table 1, but keeps Table 2 HUD active.
