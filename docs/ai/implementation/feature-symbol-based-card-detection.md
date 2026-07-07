---
feature: symbol-based-card-detection
status: implementation
---

# 🛠️ IMPLEMENTATION SPEC: Symbol-Based Card Detection with Failed Case Sync

## 📝 Implementation Notes

*This document will be updated during the actual implementation phase.*

### 1. Removing Old Modules
Files targeted for deletion or refactoring include:
- `card_extractor.py` or equivalent legacy code containing `auto_learn` parameters.
- Removing `cv2.findContours` calls attempting to aggressively extract full 52-card borders.

### 2. Symbol Detection
```python
# Pseudo-code logic to implement for symbol pairing
def group_symbols(ranks, suits, max_dx=15, max_dy=10):
    cards = []
    for r in ranks:
        for s in suits:
            if abs(r['x'] - s['x']) < max_dx and abs(r['y'] - s['y']) < max_dy:
                cards.append({"card": r['value'] + s['value'], "x": r['x'], "y": r['y']})
    return cards
```

### 3. Server Endpoints (Python Backend)
- Implement using FastAPI (or Flask equivalent) within OCR Backend.
- Uses `shutil.move` logic for moving files around once labeled.

### 4. Backend TS API Gateway Cleanup
- In `backend/src/routes/ocrRoutes.ts`, delete the `prisma.template.upsert` logic handling `category: 'card_ocr'` in `POST /feedback`. This was part of the deprecated auto-training mechanism.
- In `GET /api/ocr/templates/:type/:filename` and `DELETE`, eliminate the hardcoded `normalizedType = type === 'card' ? 'cards' : type === 'anchor' ? 'anchors' : type;`. Transition to cleanly proxying the exact folders `ranks`, `suits`, `anchors`, and `failed_cases`.

### 4. UI Layer
- Needs a React component querying the new API paths. Render `<img>` using blob or direct URL access depending on API static hosting.
- **Cleanup `TemplateManagerModal.tsx`**:
  - The current UI hardcodes `t.type === 'card' ? 'cards' : 'anchors'`.
  - Update `fetchOcrTemplates` or the mapped results to exclude the legacy full-card templates.
  - Decide if `ranks` and `suits` will be managed in this Modal. If they are, update the types to `'rank' | 'suit' | 'anchor'`.
  - The new Failed Case UI could either extend this modal (a new Tab "Failed Cases") or act as a separate panel.
