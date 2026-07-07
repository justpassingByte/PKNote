---
description: Detailed Implementation Steps for AI Poker Notes & Hand Analyzer
---

# Feature Implementation: AI Poker Notes & Hand Analyzer

## 1. Technical Requirements
*   **Language**: Strict TypeScript (ES2023+).
*   **Frameworks**: 
    *   Backend: Node.js (Express) with Prisma.
    *   Frontend: Next.js (App Router).
*   **AI Providers**: OpenAI/Claude (Vision & Text).
*   **Payments**: NOWPayments API (Crypto).
*   **Model Routing**: Gói thấp dùng model rẻ (GPT-4o-mini), gói cao dùng Deep Analysis (GPT-4o/Claude Opus).
*   **RAG (Retrieval-Augmented Generation)**: Khi một Player có hàng trăm Notes, hệ thống sẽ sử dụng **Embeddings** để tìm các note "có liên quan nhất" đến tình huống Hand hiện tại để làm Input cho AI, thay vì gửi toàn bộ lịch sử (Tiết kiệm Token cực lớn).
*   **Incremental Summarization**: Theo định kỳ (ví dụ: mỗi 50 notes), hệ thống tự động tóm tắt thành một Profile tĩnh (Base Stats) để đưa vào context thay vì liệt kê từng Note đơn lẻ.
*   **State**: React Context or Zustand (Avoid unnecessary re-renders).

## 2. Key Code Templates (Implementation Snippets)

### Canonical Hashing (Deduplication)
```typescript
/**
 * Normalizes hand data to ensure identical strategic 
 * actions result in the same hash.
 */
export function generateHandHash(handRaw: string): string {
    const normalized = handRaw
        .toLowerCase()
        .replace(/@\w+/g, '') // Remove player names
        .replace(/at\s+\d{2}:\d{2}/g, '') // Remove timestamps
        .trim();
    return crypto.createHash('sha256').update(normalized).digest('hex');
}
```

### NOWPayments Signature Verification
```typescript
/**
 * Verify HMAC SHA-512 signature from NOWPayments.
 */
export function verifySignature(payload: any, signature: string, secret: string) {
    const sortedPayload = sortObject(payload); // Ensure consistent key order
    const hmac = crypto.createHmac('sha512', secret);
    const calculated = hmac.update(JSON.stringify(sortedPayload)).digest('hex');
    return calculated === signature;
}
```

### Deterministic AI Prompting
*   **Hero/Villain Assessment**: Always request output in a strict JSON format via `response_format: { type: "json_object" }` or equivalent schema in Claude.
*   **System Prompt**: "You are a world-class GTO poker professional and exploitative specialist. Analyze the following hand JSON..."

## 3. Account Enforcement (Device Logic)
*   **Database check**: In `authMiddleware`, if `Session.count({ where: { userId } }) >= 2`, reject login with "Max devices reached" unless user chooses to logout others.
*   **Cookie Session**: Store `deviceId` in a secure, HttpOnly cookie to identify the current device across requests.

## 4. Model Routing Engine
```typescript
export function getModelForTier(tier: string): string {
    switch(tier) {
        case 'ENTERPRISE': return 'claude-3-5-sonnet';
        case 'PRO_PLUS': return 'gpt-4o';
        default: return 'gpt-4o-mini';
    }
}
```

### AI RAG Pipeline (Token Saver)
*   **Vector Database**: Sử dụng pgvector (Prisma hỗ trợ) để lưu Embedding của từng Note.
*   **Retrieval Logic**: Khi phân tích Hand, hệ thống tính toán embedding của "Hand Context" -> Query Top-K (K=20) notes liên quan -> Feed to LLM.
*   **Summarization**: Cronjob tự động gộp (merge) các notes cũ thành một bản tóm tắt profile đơn lẻ sau mỗi tháng để dọn dẹp context window.
1.  Run `npx prisma migrate dev --name init_poker_notes_v2`.
2.  Implement `HandOcrService` to parse poker actions from screenshots.
3.  Build the `AnalyzerWorkspace` in Next.js.
4.  Connect NOWPayments sandbox for testing the upgrade flow.
