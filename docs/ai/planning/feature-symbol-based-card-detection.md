---
feature: symbol-based-card-detection
status: planning
---

# 📅 PLANNING SPEC: Symbol-Based Card Detection with Failed Case Sync

## 📋 Task Breakdown

### Phase 1: Core System Refactoring
- [x] 1. **Clean Legacy Python Code (OCR Service)**: Identify and strip out all components related to full-card auto-learning, full-card template extraction, and individual card cropping.
- [x] 2. **Clean Legacy TS Code (Backend Gateway)**:
   - Refactor `backend/src/routes/ocrRoutes.ts`. Complete removal of the `card_ocr` database insertion logic in the `/feedback` route.
   - Remove or adapt the legacy `card -> cards` hardcoded normalizer in `DELETE` and `GET` template proxies.
- [x] 3. **Establish Directory Structure**: Create static symbol directories `/templates/ranks/` and `/templates/suits/`, failed case directories `/templates_failed/raw/` and `/templates_failed/labeled/`, and an optional `/debug_crops/` directory.
- [x] 4. **Implement Symbol Template Detector**: Create OpenCV-based logic to perform multi-template matching for rank/suit symbols directly on Board/River contours. Include a `save_debug_image` flag to write intermediate steps (thresholds, individual symbol bounding boxes) to disk.
- [x] 5. **Implement Grouping Logic**: Write logical rules (`dx < 15`, `dy < 10`) to pair detected symbols into actual card strings like `4C`, `AH`.
- [x] 6. **Implement Sorting Logic**: Board elements sort by X coordinate, River elements sort by Y coordinate. Structure JSON output.

### Phase 2: Failed Case System
- [x] 7. **Implement Failed-Case Triggering**: Add heuristic triggers detecting fewer than expected cards or unpaired ranks/suits.
- [x] 8. **Failed Region Cropping & Logging**: Crop the failed ROI, serialize partial detections, and store image into `/templates_failed/raw/`.
- [x] 9. **Failed-Case API Endpoints**: Implement standard CRUD or custom route handlers (`GET /failed-cases`, `POST /failed-cases/label`) in the Python OCR Server.

### Phase 3: UI Implementation & Cleanup
- [x] 10. **Clean Legacy Code in TemplateManagerModal**: 
   - Remove references to full `card` templates in the UI (`TemplateManagerModal.tsx`).
   - Change rendering logic to support new `ranks` and `suits` folders instead of `cards`, if managing static templates directly from the UI is still desired.
- [x] 11. **UI Panel Design & Build (Failed Case Monitor)**: Construct the Failed Case Management Panel.
   - Display a gallery list of raw failed images fetched from `/failed-cases`.
   - Add input fields for text (e.g., `4C`).
- [x] 12. **State Management Sync**: Wrap the submit action to perform API calls to `POST /failed-cases/label`, handle success states, and automatically refresh the queue.

## 🔗 Dependencies
- Phase 1 must precede Phase 2.
- Phase 2 backend APIs must precede Phase 3 UI work.
- Existing ROI contour logic is assumed stable.

## ⏱️ Effort Estimates
- Core System Refactoring: 3 Days
- Failed Case System (Backend): 1.5 Days
- UI Implementation (Frontend): 1.5 Days

## ⚠️ Risks
- **Matching Accuracy**: Ranks and suits may closely match each other across different fonts without accurate template calibration.
- **Performance**: High resolution region processing might add latency compared to down-sampled methods. Caching strategies might be needed.
