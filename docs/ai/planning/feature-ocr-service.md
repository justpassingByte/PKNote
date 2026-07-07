---
feature: ocr-service
status: planning
---

# 🚀 PLANNING SPEC: OCR Service (PaddleOCR, Production-Ready)

## 🏗️ Task Breakdown

### Phase 1: Environment & Async Core (1-2 days)
1.  **Project Setup & Redis**: [Task 1]
    *   Docker environment for API, Celery, Redis.
2.  **SHA256 Caching Layer**: [Task 2]
    *   Implement image hashing and Redis result store (TTL setting).
3.  **Celery Micro-batching**: [Task 3]
    *   Setup Celery worker with batch-enabled task consumption (2-8 images).

### Phase 2: Vision Pipeline & Layouts (2-3 days)
4.  **Layout Anchor Database**: [Task 4]
    *   Gather 3-5 poker app UI anchors for Template Matching.
5.  **OpenCV Layout Engine**: [Task 5]
    *   Implement `find_layout(img)` using template matching.
    *   Add automated relative cropping mapping for each anchor.
6.  **PaddleOCR Core**: [Task 6]
    *   Optimized CPU-only initialization.
    *   Execute OCR on crops vs. full-image based on layout result.

### Phase 3: Post-processing & Production (1-2 days)
7.  **Data Normalization Layer**: [Task 7]
    *   Regex parsers for bet sizes and player name cleaning.
8.  **Observability & Monitoring**: [Task 8]
    *   Add Prometheus-style metrics (Prometheus Flask Exporter equivalent for FastAPI).
9.  **Scale Testing**: [Task 9]
    *   Benchmarking 5-10 concurrency levels on local CPU.

### Phase 4: Integration (1 day)
10. **Client Example**: [Task 10]
    *   Python/JS sample script with concurrent upload simulation.

## 🧱 Dependencies
*   Need **Redis** running (can be in Docker).
*   Need **PaddlePaddle** binaries (Docker handles this).

## ⚠️ Potential Risks
*   **Memory Usage**: PaddleOCR models take several hundred MBs. Multiple workers can balloon RAM consumption. Solution: Limit worker concurrency.
*   **Latency**: If 1.5x upscaling is too slow on weak CPUs. Solution: Dynamic scaling based on original image size.
*   **Accuracy**: Varied poker site fonts. Solution: Gather samples and adjust thresholding parameters.

## 🚀 Execution Order
1.  Project Setup [Task 1]
2.  Celery & Redis Worker [Tasks 4, 5]
3.  Vision Pipeline logic [Tasks 6, 7]
4.  API & Dockerization [Tasks 2, 3]
5.  Testing & Cleanup [Tasks 9, 10]
