---
feature: symbol-based-card-detection
status: testing
---

# 🧪 TESTING SPEC: Symbol-Based Card Detection with Failed Case Sync

## 🧪 Unit Tests

### Card Pair Grouping (SymbolGrouper)
- **Test:** Given a set of ranks `4` and suits `C` directly proximate (`dx=5, dy=2`), return `4C`.
- **Test:** Given widely spread ranks and suits, return empty pair or partial detection logic.
- **Test:** Test boundary condition (exactly `dx=15`, `dy=10`).

### Failure Detection
- **Test:** Mock a full region that only returns 4 card bounds for a River board state. Verify it triggers the failed case logging.
- **Test:** Provide a board returning exactly 5 correct card symbols. Verify no failure is triggered.

## 🤝 Integration Tests

### Server API
- **Test:** POST a mock failed case to internal trigger system. Perform `GET /failed-cases` to verify visibility.
- **Test:** `POST /failed-cases/label` with mock JSON payload `{"id": "mock_id.png", "labels": ["4S"]}`. Verify file system changes reflecting the file moving to `/templates_failed/labeled/`.

### Processing Pipeline
- **Test:** Inject a test image passing entirely through `ROI -> Symbol Detection -> Grouping -> JSON Output` and compare against strict known results. 
