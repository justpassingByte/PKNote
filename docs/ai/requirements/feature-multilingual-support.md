---
title: Multilingual Support Requirements
status: draft
feature: multilingual-support
---

# Feature: Multilingual Support - Requirements

## Problem Statement
Hiện tại hệ thống đang English-first, trong khi user target (đặc biệt VN) cần trải nghiệm native hơn. UI chỉ có tiếng Anh làm giảm UX với user không quen English. AI output (strategy / exploit) luôn bằng English, không phù hợp với một số user. Cần có cách chuyển đổi ngôn ngữ để tăng cường personalization.

## Goals
* Hỗ trợ 2 ngôn ngữ: English (default) + Vietnamese.
* User có thể chọn ngôn ngữ trong Settings.
* Toàn bộ hệ thống phản hồi theo ngôn ngữ đã chọn: UI text và AI output (strategy, exploit, notes).
* Hybrid mode: Khi dịch sang tiếng Việt (VI), bắt buộc phải giữ lại các thuật ngữ tiếng Anh (EN) đặc thù của Poker.

## Non-Goals
* Support for additional languages beyond English and Vietnamese (planned for Future Extension).
* Per-response language override (planned for Future Extension).

## User Stories
* **US1 — Change language:** User vào Settings chọn English hoặc Vietnamese và lưu lại preference.
* **US2 — Persist language:** Khi reload / login lại, hệ thống giữ ngôn ngữ đã chọn (lưu vào database profile cho user đã đăng nhập, và `localStorage` cho guest).
* **US3 — UI translation:** Toàn bộ UI text (button, label, error message) hiển thị theo language.
* **US4 — AI response language:** Khi user chọn Vietnamese, AI output = Vietnamese. Khi English, AI output = English.
* **US5 — Mixed fallback:** Nếu thiếu translation, hệ thống fallback về tiếng Anh.

## Success Criteria
* User có thể chuyển ngôn ngữ < 1 click.
* UI thay đổi ngay lập tức.
* AI output đúng ngôn ngữ 100%.
* Không ảnh hưởng performance.

## Constraints & Edge Cases
* **State Persistence:** User chưa login dùng `localStorage`. User đã login lưu preference (e.g., `locale` enum) trong bảng `users` database.
* **Backend Errors:** Backend API trả về standard error codes (không trả text đã dịch). Frontend chịu trách nhiệm map các error codes sang UI text tương ứng với ngôn ngữ được chọn.
* **Missing translation:** Tự động fallback về tiếng Anh.
* **AI Output Variables:** Middleware / Service gọi LLM phải inject instruction yêu cầu ngôn ngữ đích, đồng thời ép strict rules giữ nguyên thuật ngữ Poker đặc thù (AQo, BTN, XR…) bằng tiếng Anh.

## Open Questions
* Are there any specific localization (i18n) frameworks we should prefer for the frontend? (e.g., `react-i18next`, `next-intl`). *-> Resolved: We will just use simple JSON files and a lightweight custom context to avoid adding heavy external dependencies.*
