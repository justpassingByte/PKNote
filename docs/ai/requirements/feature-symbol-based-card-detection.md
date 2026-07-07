---
feature: symbol-based-card-detection
status: requirements
---

# 🚀 FEATURE SPEC: Symbol-Based Card Detection with Failed Case Sync

## 🎯 Problem Statement
The current full-card template detection system for board and river cards is unstable and relies on an auto-learning flow (full-card learning) that produces incorrect heuristic-based detections. It struggles with variations and specific cases. We need to replace the full-card auto-learning flow with a deterministic symbol-based (rank + suit) template detection system, supplemented by a human-in-the-loop failed case management system to ensure accurate card detection without relying on full-card matching.

## 👥 Target Users
- Developers maintaining and debugging the OCR system.
- End-users requiring 100% accurate card detection.

## 🧱 Goals
- **Stable Symbol-Based Detection**: Detect board and river cards using predefined static templates for ranks and suits.
- **Grouping Logic**: Accurately group detected rank and suit symbols into a single card output based on positional proximity.
- **Failed Case Management System**: Automatically capture failed or incomplete detections and store them for human correction.
- **UI & Server Sync for Corrections**: Provide an endpoint and a UI panel for users to review cropped failed region images and manually label them, which then syncs back to the server.
- **Debug Image Dumping**: Save intermediate crops, thresholds, and bounding boxes to a `debug/` folder during execution to make troubleshooting and tuning computer vision easier.
- **Retain Working Components**: Keep PaddleOCR for names/actions/positions/amounts, and keep the existing contour-based region pipeline intact.

## 🚫 Non-Goals
- Full-card template learning or auto-learning flows entirely.
- Cropping individual cards for detection (symbol-based template matching on the whole region is the new approach).
- Modifying PaddleOCR extraction processes.
- Using labeled failed cases directly for runtime detection without them being static templates.

## 🧱 User Stories
- **As a Developer**, I want the detection to output rank and suit symbols separately so that I can group them accurately based on their coordinates.
- **As the System**, I want to identify when a detection fails (e.g., fewer than 5 board cards or missing suits) so that I can save the cropped region failure to a specific folder.
- **As a User**, I want to view failed crops in a UI panel and manually correct the detected cards (e.g., input "4C") so that the system records the correct label for future debugging/datasets.
- **As a Developer**, I want the human-corrected data synced to the server so that I can use it for auditing or building a future ML dataset.

## 🏗️ System Architecture
- **OCR Service (Backend, Python/FastAPI)**: 
  - Exposes new `POST /failed-cases` endpoint to capture regions.
  - Exposes `GET /failed-cases` allowing the UI to fetch pending tasks.
  - Exposes `POST /failed-cases/label` to update and move the failed regions to `labeled`.
  - Serves cropped thumbnails from `/templates_failed/raw/` statically to the UI.
- **Template Manager in Setting (Frontend, Next.js)**:
  - Fetches and displays failed crops in a dedicated "Failed Case Monitor" panel.
  - Submits human corrections back to the server.

## ⚙️ Tech Stack
- **Backend API**: FastAPI (Python)
- **Computer Vision**: OpenCV (`cv2.matchTemplate` for symbols, contour generation)
- **Frontend**: Next.js, React, Tailwind CSS
- **Persistence**: File-system based storage (no complex DB for fails initially, just moving files to directories).

## ✅ Success Criteria
- Accurately detects "sticky" or closely placed cards on the board without cropping each card.
- Scale-independent detection via robust static symbol templates.
- A clear, functional error-handling system that saves cropped region failures.
- A UI component successfully pushes manual labels back to the `/failed-cases/label` endpoint.

## ⚙️ Constraints / Rules
- **KEEP**: PaddleOCR (for Layout text *only*: names, actions, stack sizes) and existing root contour region splitting.
- **REMOVE**: 
  - Full-card learning flows completely.
  - Hardcoded spatial 5-way splitting of the board (e.g., extracting 5 equidistant card boxes).
  - PaddleOCR usage for detecting card ranks - Rank detection must be strict symbol matching now.
  - The `card_ocr` templates database storage logic in the Node backend `POST /feedback` gateway.
- **STORAGE**: `/templates/ranks/` and `/templates/suits/` for static; `/templates_failed/raw/` and `/templates_failed/labeled/` for failed management.
- **System**: The primary card detection pipeline must remain deterministic; failed cases are strictly "human-in-the-loop" and do not dynamically auto-learn into runtime templates.

## ❓ Open Questions
- Should the frontend poll for new failed cases, or fetch them on demand?
- What is the cleanup policy for the `/templates_failed/` directory?
