---
feature: robust-board-detection
status: in-progress
created: 2026-03-22
---

# 🧪 TESTING: Robust Board Card Detection & Multi-Layout OCR

This document will track the test results for the detection-based OCR system.

## 🏁 Test Objectives
- [ ] 100% detection of board cards (3-5 cards) in test set.
- [ ] Support for mobile layout screenshots (accuracy > 90%).
- [ ] Validate 3-pass fallback strategy effectiveness.
- [ ] Ensure self-learning doesn't save poor card templates.

## 📊 Test Case Table
| Test Case ID | Scenario | Input Type | Expected Result | Result |
| --- | --- | --- | --- | --- |
| TC-01 | Standard Desktop | 1920x1080 Screenshot | 5 board cards correctly identified | TBD |
| TC-02 | GG Poker Mobile | 1080x1920 Screenshot | 3-5 board cards correctly identified | TBD |
| TC-03 | Partially Occluded Cards | Screenshot | 3-pass fallback should trigger | TBD |
| TC-04 | Unknown Card (Learning) | Screenshot | Correctly saves and uses new template | TBD |
| TC-05 | Invalid Detection (> 5 cards) | Non-poker Image | Reject with low confidence | TBD |

## 🧪 Validation Script
Run `python ocr-service/client_test.py` to verify accuracy.
