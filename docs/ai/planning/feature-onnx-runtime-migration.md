---
title: "ONNX Runtime OCR Migration Planning"
status: "Draft"
author: "AI Assistant"
date: "2026-03-28"
---

# Planning: ONNX Runtime OCR Migration

## Task Breakdown
1. **Requirements Update**
   - Subtasks:
     - Remove `paddleocr==2.7.3` from `backend/ocr-service/requirements.txt`
     - Add `rapidocr_onnxruntime` to `requirements.txt`
2. **Dockerfile Refactor**
   - Subtasks:
     - Remove overly aggressive Paddle env flags (e.g. `PADDLE_NUM_THREADS`, `FLAGS_use_mkldnn`).
     - Remove initialization directory `/root/.paddleocr` layer.
3. **Core Tasks Migration (`tasks.py`)**
   - Subtasks:
     - Replace `from paddleocr import PaddleOCR` with `from rapidocr_onnxruntime import RapidOCR`.
     - Update Singleton initialization.
     - Implement parser function inside `_warmup()` and `process_hand_bytes()` to normalize output signatures from RapidOCR back to legacy `paddleocr` tuple format for identical behavior.
4. **Test & Validation (`test_pipeline.py`)**
   - Subtasks:
     - Execute `test_pipeline.py ocr2.png` and verify accuracy parity and latency metrics vs current 1256ms baseline.
     - Verify Docker image build size and memory footprint using `htop`.

## Dependencies
- Must verify that `action_parser.py` bounding-box processing logic doesn't break from subtle array differences in RapidOCR coordinates compared to PaddleOCR.

## Effort Estimates
- Migration Coding: 1 hour
- Output format normalization & debugging: 0.5 hours
- Validation / Load Testing on VPS: 1 hour

## Implementation Order
1. Update `requirements.txt` and `Dockerfile`.
2. Apply changes locally inside `tasks.py` to decouple PaddleOCR logic.
3. Add RapidOCR logic and normalizer snippet.
4. Call `test_pipeline.py`.

## Risks
- RapidOCR outputs might flip coordinates (e.g., return list of ints instead of list of floats), so bounding box overlap matching logic in `engine.py` might error out.
  - *Mitigation*: Ensure the adapter function wraps all coordinate types in strict float formats.
