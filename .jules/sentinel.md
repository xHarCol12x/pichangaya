
## 2024-05-24 - [CRITICAL] Prevent Timing Attacks on Token Verification
**Vulnerability:** Found simple string equality checks (`===` and `!==`) used to verify sensitive authentication tokens (`x-ai-token` and `x-internal-token`) in `ai-tools.controller.ts` and `notifications.controller.ts`.
**Learning:** Standard string comparison operators return early when characters don't match. An attacker can use the timing differences to guess the token character by character (Timing Attack).
**Prevention:** Always use a constant-time comparison function, like `crypto.timingSafeEqual(Buffer.from(input), Buffer.from(expected))`, when comparing sensitive secrets, passwords, or tokens to prevent leaking information through execution time. Both buffers must also be of equal length.
