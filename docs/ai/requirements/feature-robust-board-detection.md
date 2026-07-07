---
feature: robust-board-detection
status: in-progress
created: 2026-03-22
---

# 🚀 FEATURE SPEC: Robust Board Card Detection & Multi-Layout OCR (Desktop + Mobile)

## 🎯 Objective

Upgrade the OCR pipeline to:
* **Reliably detect all board cards** (detect → split → infer gaps).
* **Eliminate fixed-position errors** with dynamic object-based extraction.
* **Support multi-layout** (Desktop + Mobile) with multi-signal scoring.
* **Implement hybrid validation** (CV + Rules + LLM + User Feedback) for **Safe Self-Learning**.
* **Enable Downstream Profiling**: Supply high-accuracy hand data (Board + Showdown cards) to the **Player Profiling** engine.

## 🧱 Problem Statement

### Current Issues
1. ❌ **Incorrect Card Cropping**
   * Current system uses **fixed bounding boxes (%)**.
   * Result: Cards shift slightly depending on UI scale.
   * Root cause: Position-based cropping instead of object detection.

2. ❌ **No Mobile Layout Support**
   * Each poker site (e.g., GG Poker) has Desktop and Mobile layouts.
   * Current system assumes 1 layout = 1 anchor.
   * Result: OCR fails completely on mobile screenshots.

## 🏁 Goals & Non-Goals

### Goals
* ✅ Detect board cards dynamically using contour detection.
* ✅ Support multiple layouts (Desktop / Mobile) with **multi-signal scoring**.
* ✅ Handle **merged cards** (touching) and **gap inference** (inference only triggers fallback, NOT raw output).
* ✅ Implement **LLM-guided validation** and **user feedback loop** for grounding.
* ✅ Implement **Confidence Composition** with `confidence_breakdown` (CV + LLM + Rules).
* ✅ Implement **Template Ranking** (usage count, success rate, last used).
* ✅ Ensure **No Duplicate Cards** validation.
* ✅ Implement **LLM Trigger Condition** (only if `cv < 0.9` or `validation fails`).
* ✅ Secure the self-learning pipeline with **multi-frame consistency** and **learning cooldown**.
* ✅ Implement **Bad Sample Tracking** (`failed_cases`) for rejected detections and forensic debugging.
* ✅ **Showdown Card Detection**: Correctly identify hole cards at showdown to feed player tendencies.
* ✅ **Action Sequence Mapping**: Detect UI changes (button states) to generate "Raw Contextual Notes" (e.g., SRP, 3BET, Shove).
* ✅ Intelligent validation using **game state prediction** (Flop/Turn/River).

### Non-Goals
* ❌ Hole card detection (handled separately).
* ❌ Full table reconstruction.
* ❌ LLM-based parsing.

## 👥 User Stories
* As an automated tracking system, I want to accurately recognize the board cards regardless of the screen resolution or layout.
* As a user, I want the system to automatically detect if I'm playing on mobile or desktop and adjust its detection strategy.

## 🎯 Success Criteria
* Detect **100% of board cards (3–5)** in test set.
* Mobile layout supported with >90% accuracy.
* No dependency on fixed card positions.
* Processing time < 1.5s per screenshot.

## ⚙️ Constraints
* Must be CPU-only compatible.
* Memory usage < 1GB per worker.
* Must handle variations in "white" levels and "dark" backgrounds.
