---
feature: robust-board-detection
status: in-progress
created: 2026-03-22
---

# 📅 PLANNING: Robust Board Card Detection & Multi-Layout OCR

## 🏗️ Task Breakdown

### Phase 1: Multi-Layout Detection (Priority 2)
- [x] Task 1.1: Refactor `layout_config.json` to support nested site configs and multiple anchors.
- [x] Task 1.2: Implement **multi-signal layout scoring** in `LayoutEngine.match_layout` (Anchor + OCR Keyword + Aspect Ratio).
- [ ] Task 1.3: Benchmarking layout detection across desktop/mobile test datasets. _(requires test data)_

### Phase 2: Advanced Board Card Detection (CRITICAL Priority 1)
- [x] Task 2.1: Board region coarse crop and **perspective/alignment normalization**.
- [x] Task 2.2: Implement OpenCV contour-based detection with **multi-scale passes** (1.0x, 1.25x, 1.5x).
- [x] Task 2.3: Implement **merged contour splitting** (vertical projection/sliding window for touching cards).
- [x] Task 2.4: Implement **gap detection** (strictly for triggering fallback, NOT output).
- [x] Task 2.5: Center-based cropping and card normalization for recognition.
- [x] Task 2.6: Implement **Duplicate Card Check** pre-validation.

### Phase 3: Hybrid Validation & Scoring
- [x] Task 3.1: Implement `ConfidenceScorer` with **formula** (`CV*0.6 + LLM*0.4`) and **breakdown**.
- [x] Task 3.2: Implement **LLM Trigger Logic** (`CV < 0.9` or `Rules Fail`).
- [x] Task 3.3: Implement strict variance validation (size/spacing).
- [x] Task 3.4: Implement multi-pass fallback strategy (Adaptive -> Region -> Scale).

### Phase 4: User Feedback UI & Secure Learning
- [x] Task 4.1: Frontend **Confirmation Modal** — Backend `/feedback` endpoint live (`POST /api/ocr/feedback`).
- [x] Task 4.2: Frontend **Manual Correction UI** — Backend supports `edit` action with `correctedName`.
- [x] Task 4.3: Secure `learn_card` with **Learning Cooldown** and **Template Ranking**.
- [x] Task 4.4: Implement **Failed Case Logging** (`failed_cases/` on rejected detections).

### Phase 6: 10/10 Reliability Polish (CRITICAL)
- [x] Task 6.1: Correct **Confidence Formula** (`CV*0.7 + LLM*0.3 - penalty`) to avoid double-counting.
- [x] Task 6.2: Implement **Confidence Floor** (hard cap at 0.6 if validation fails).
- [x] Task 6.3: Implement **Template Decay Scoring** (`last_used` 30-day half-life).
- [x] Task 6.4: Implement **Pipeline Stage Latency** tracking (Layout/Detection/Rec/Val).
- [x] Task 6.5: Surface **Decision Reason** list in API response for frontend explainability.
- [x] Task 6.6: Hard rule for **Gap Detection** (signals fallback only, zero ghost cards).

## 🔗 Dependencies
- `opencv-python`
- `numpy`
- `PaddleOCR` (for keyword anchors)

## 🚀 Effort Estimate
* Phase 1: 1 day
* Phase 2: 3 days
* Phase 3: 2 days
* Phase 4: 4 days (Frontend + Feedback logic)
Total: 10 days

## 🧪 Implementation Order
1. **Board Card Detection & Splitting (Phase 2)**.
2. **Hybrid Validation & LLM (Phase 3)**.
3. **Frontend Feedback Loop (Phase 4)**.
4. **Secure Self-Learning (Phase 4)**.
