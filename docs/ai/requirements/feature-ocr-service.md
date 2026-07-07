---
feature: ocr-service
status: requirements
---

# 🚀 FEATURE SPEC: OCR Service (PaddleOCR, Production-Ready)

## 🎯 Objective

Build a dedicated, high-performance OCR microservice responsible for:
*   Processing UI screenshots from poker clients and other apps.
*   Scaling to handle concurrent users via an asynchronous task queue.
*   Optimizing for CPU usage (targeting deployment on generic VPS instances).
*   Returning structured JSON data (text, confidence, bounding boxes).

## 🧱 Problem Statement

Current manual hand entry is slow. Existing OCR pipelines (like raw Tesseract) are often too slow or inaccurate for specialized poker fonts and busy UI backgrounds. We need a production-grade vision pipeline that can handle pot detection, dealer positions, and player stats in <2 seconds.

## 👥 Target Users

*   Professional poker players using VillainVault.
*   High-volume grinders who need near real-time note automation.

## 🧱 User Stories

*   **As a user**, I want to upload a screenshot of my table and have the pot size correctly identified.
*   **As a user**, I want player names and stack sizes extracted automatically to avoid typing.
*   **As a developer**, I want to submit an image via API and receive a JSON response with high confidence scores.
*   **As a developer**, I want the system to handle concurrent requests without blocking the main event loop.

## 🧱 System Architecture

*   **User/Client** → Submits image via **FastAPI**
*   **FastAPI** → Pushes job ID to **Redis Queue**
*   **OCR Worker (Celery)** → Consumes job, runs **PaddleOCR**, returns result to Redis/DB.
*   **Client** → Polls/Gets final result.

## ⚙️ Tech Stack

*   **API**: FastAPI
*   **Queue**: Redis
*   **Worker**: Celery
*   **OCR Engine**: PaddleOCR (CPU-only mode)
*   **Processing**: OpenCV, Pillow, NumPy
*   **Containerization**: Docker

## 🧠 Core Design Rules (Constraints)

1.  **Layout Detection First**: Implement a template matching layer to identify UI layouts (e.g., GG Poker, PokerStars) before cropping. Fallback to full-image OCR if detection fails.
2.  **Model Lifecycle**: PaddleOCR MUST be initialized once per worker; NEVER reload per request.
3.  **Batch Processing**: Workers MUST support micro-batching (2–8 images per call) when the queue is busy to maximize CPU efficiency.
4.  **Idempotency & Caching**: Generate an image hash (SHA256) on upload. Cache results in Redis with a TTL to avoid redundant CPU usage for duplicate screenshots.
5.  **Input Constraints**: Max image width 1280px (auto-resize), Max file size 5MB.
6.  **Post-processing Pipeline**: All raw OCR text must pass through a normalization layer (regex for BB/pot, name cleaning) before being returned.
7.  **Timeout**: 5–10 seconds per job maximum latency for the worker.

## ✅ Success Criteria

*   **Latency**: <2s per image (end-to-end processing).
*   **Throughput**: 10–20 req/sec per worker instance (leveraging batching).
*   **Accuracy**: 
    *   **Raw OCR**: >85% correctly identified characters.
    *   **Post-processed Structure**: >95% correctly parsed pot values and player names.
*   **Memory**: <1.2GB per worker (accounting for batching overhead).

## ⚠️ Failure Handling & Observability

*   **Circuit Breaker**: Reject new requests (HTTP 429) if queue latency exceeds 15s.
*   **Rate Limiting**: Implementation of per-IP/User request limits.
*   **Metrics**: Track OCR latency, queue length, and worker CPU usage.
*   **Retries**: Max 2 retries per failed job.
*   **Logging**: Log raw OCR output alongside structured results for pipeline tuning.
