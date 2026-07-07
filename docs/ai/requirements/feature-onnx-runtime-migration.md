---
title: "ONNX Runtime OCR Migration"
status: "Draft"
author: "AI Assistant"
date: "2026-03-28"
---

# Feature: ONNX Runtime OCR Migration

## Problem Statement
The current OCR Engine utilizes the official `paddlepaddle` framework, which is heavy on CPU initialization and consumes a significant amount of RAM (~500MB+ per Celery worker). This limits the concurrency potential on cost-effective, CPU-only VPS environments and causes out-of-memory risks under sustained high load.

## Goal/Non-Goals
**Goals**
- Replace the monolithic `paddlepaddle` library with `onnxruntime` using the `rapidocr_onnxruntime` package.
- Reduce Docker image size by 1GB+.
- Reduce RAM footprint of the `ocr_worker` container to <200MB per worker.
- Decrease OCR inference latency by 20-30% via robust CPU execution providers.

**Non-Goals**
- Do not migrate or rewrite the template-matching layout detection logic.
- Do not change or retrain the OCR model weights themselves (still using PP-OCRv4, just in `.onnx` format).

## User Stories
- As a DevOps engineer, I want the OCR Docker image to build and deploy quickly without fetching ~1.5GB of dependencies, so CI/CD is faster.
- As a Server Admin, I want the Celery OCR workers to run efficiently on 1-2 CPUs with minimal RAM spikes, keeping the server stable.
- As an End User, I want Poker Hands to process and return instantly (< 1s latency).

## Success Criteria
- [ ] Requirements `requirements.txt` removes `paddleocr` and adds `rapidocr_onnxruntime`.
- [ ] Image size is drastically reduced.
- [ ] Memory profiled on VPS under load stays well below 500MB.
- [ ] `test_pipeline.py` maintains the exact same prediction accuracy for poker hands.

## Constraints
- Python 3.10 is used, must ensure `rapidocr_onnxruntime` is compatible.
- The OCR text output string array logic must remain intact down the pipeline.

## Open Questions
- None currently.
