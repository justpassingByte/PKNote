---
title: "ONNX Runtime OCR Migration Testing"
status: "Draft"
author: "AI Assistant"
date: "2026-03-28"
---

# Testing: ONNX Runtime OCR Migration

## Test Cases
- Run `test_pipeline.py` identically on local and verify matching of text arrays output.
- Ensure poker layout dimensions continue matching flawlessly across the `MatchTemplate` suite.
- Test endpoint `/ocr/sync` using an HTTP client (ThunderClient/Postman) or through the NextJS Analyzer upload screen.

## Known Limitations / Trade-offs
- RapidOCR CPU logic might drop sub-millisecond precision on bounding boxes (float-rounding depending on library version), monitor test results closely.
