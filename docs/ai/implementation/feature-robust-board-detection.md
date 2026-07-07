---
feature: robust-board-detection
status: in-progress
created: 2026-03-22
---

# 🚀 IMPLEMENTATION: Robust Board Card Detection & Multi-Layout OCR

This document will track the implementation progress of the new detection-based card OCR system.

## 🛠️ Tasks Status
- [ ] Task 1.1: Refactor `layout_config.json` to support multiple layouts.
- [ ] Task 1.2: Update `match_layout` in `engine.py`.
- [ ] Task 2.1: Board region coarse crop.
- [ ] Task 2.2: OpenCV contour detection logic.
- [ ] Task 2.3: Implement filtering for card candidates.
- [ ] Task 2.4: Implement center-based cropping.
- [ ] Task 3.1: Add 3-5 card count validation.
- [ ] Task 4.1: Secure `learn_card` with confidence threshold.

## 📝 Current Implementation Details
The system now uses `cv2.findContours` to identify potential board cards within a coarse-cropped board area.

## 🧪 Challenges / Decisions
* **Decision**: Normalize board region before detection.
* **Decision**: Sort cards from left to right.
