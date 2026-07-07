---
feature: robust-board-detection
status: in-progress
created: 2026-03-22
---

# 🧠 DESIGN: Robust Board Card Detection & Multi-Layout OCR

## 🏗️ Architecture Overview

The OCR pipeline will be transformed from a position-based system to a detection-based system.

### Updated OCR Pipeline:
1. **Layout Detection (Multi-Signal)**:
   * Calculate `layout_score = anchor_score + OCR_keyword_score + region_consistency_score`.
   * Pick layout with `max(layout_score)`.
2. **Region Extraction & Alignment**:
   * Perform a coarse-level crop.
   * **Normalize perspective/alignment** of the board region.
3. **Card Detection (Advanced Contour)**:
   * **Multi-scale passes** (1.0x, 1.25x, 1.5x).
   * **Split merged contours** via vertical projection.
   * **Inference**: Detect gaps between cards to infer missing slots.
4. **Card Recognition & Hybrid Validation**:
   * Initial recognition (Template/OCR).
   * **LLM Review (Conditional)**: Trigger only if `CV < 0.9` or rules fail.
   * **Confidence Composition**:
     * `final_score = cv_conf * 0.6 + llm_adj * 0.4`
     * Field: `confidence_breakdown` (cv, llm, validation).
   * **Decision Matrix**:
     * Confidence ≥ 0.9 → **Auto-accept**.
     * 0.7 - 0.9 → **UI Confirmation**.
     * < 0.7 → **Force User Correction**.
5. **Validation (Strict Efficiency)**:
   * **Duplicate Card Check**: Reject if same card appears twice.
   * **Inference Guard**: `detect_gap` only triggers **fallback**, never final output.
   * Match count to game state (Flop=3, Turn=4, River=5).
6. **User Feedback & Self-Learning**:
   * **Confirm**: Reinforce templates (~usage_count++).
   * **Edit**: Correction serves as ground truth.
   * **Reject**: Store in `failed_cases/`.
7. **Profiling Data Generation**:
   * **Showdown Extraction**: Detect hole cards (e.g., "88") when showdown UI appears.
   * **Action Mapping**: Map button states (Check/Raise/Fold) to standard "Raw Contextual Notes" (e.g., "xraise turn").

## 💾 Data Model Changes

### `layout_config.json`
Update to support multiple layouts per site:
```json
{
  "ggpoker": {
    "layouts": {
      "desktop": { "anchor": "gg_pot_icon_desktop.png", "regions": { ... } },
      "mobile": { "anchor": "gg_pot_icon_mobile.png", "regions": { ... } }
    }
  }
}
```

## 🤖 LLM Role & Interfaces

The LLM is a **Reviewer**, not a **Generator**.

* **Input**: structured OCR output + game phase.
* **MANDATORY**: MUST NOT generate cards or override OCR values directly.
* **Output**:
```json
{
  "is_valid": true,
  "issues": [],
  "confidence_adjustment": -0.1
}
```

## 👤 User Feedback Logic

### Confirm
* OCR results reinforced (~usage_count++).

### Edit/Correction
* Mandatory for Low Confidence. Correction = Gold standard.

### Reject
* MUST mark as `invalid_sample` and store in `failed_cases/` for debugging.

## 🛡️ Learning Safety & Quality
* **Template Ranking**: Store `usage_count`, `success_rate`, and `last_used`. Prefer high-ranking templates.
* **Learning Cooldown**: Path-based cooldown to prevent bias/spam.
* **DO LEARN**: Confidence ≥ 0.9 OR User Grounded.
* **NEVER LEARN**: LLM invalid OR Duplicate cards OR Low confidence (unguided).
