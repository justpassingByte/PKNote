---
title: "ONNX Runtime OCR Migration Design"
status: "Draft"
author: "AI Assistant"
date: "2026-03-28"
---

# Design: ONNX Runtime OCR Migration

## Architecture Changes
1. **Library Replacement**: Remove `paddleocr` entirely. Add `rapidocr_onnxruntime` to dependencies. This acts as a drop-in replacement wrapping the PP-OCR models but using `onnxruntime` under the hood.
2. **Docker Cleanup**: Revert/Remove overly specific `paddlepaddle` flags (`PADDLE_NUM_THREADS`, `FLAGS_use_mkldnn`) to simplify the `Dockerfile`.
3. **Execution Provider**: We will run purely on the `CPUExecutionProvider` (the default) inside the Celery container logic for stability.

## Data Models
- Input: Unchanged `numpy array (cv2 image)`
- Logic Output: Needs to adapt slightly to the `rapidocr` return shape.
  - Native Paddle return: `[ [ [box_coords], (text, confidence) ], ... ]`
  - RapidOCR return `(result_list, elaborate_time)` where `result_list = [[box_coords], text, score]`. We will maintain compatibility backwards in `tasks.py` by re-mapping `RapidOCR` outputs to match native Paddle expectations, so downstream parsing components (`engine.py`, `action_parser.py`) are oblivious.

## API/Interfaces
- `/ocr/sync` and `/ocr` endpoints remain identical.
- Celery Task Signature remains identical.

## Components
- `tasks.py` -> Remove `from paddleocr import PaddleOCR`, initialize `from rapidocr_onnxruntime import RapidOCR` -> `ocr = RapidOCR()`. We will also have to write an adapter function so that `ocr(img)` correctly returns shapes matching original Paddle OCR outputs.

## Design Decisions
- Decided to use **RapidOCR (onnxruntime-based)** instead of manually exporting `.pdmodel` to `.onnx` and writing our own ONNX wrapper logic, because RapidOCR already maintains 100% feature parity with PP-OCRv4 and supports exactly the text-angle detection and language recognition combinations we depend on, with far less code bloat for us.

## Security & Performance Considerations
- ONNX Runtime is smaller and does not have the sprawling ML ops surface of PaddlePaddle, improving supply chain security.
- Performance: OMP_NUM_THREADS should likely remain set to 1 for the ONNX Runtime provider in a highly concurrent celery environment to avoid thread collisions.
