## 2024-06-12 - Prevent Hardcoded JWT & Resend Credentials
**Vulnerability:** The application had hardcoded fallback default secrets for `JWT_SECRET` and `RESEND_API_KEY` which could allow authentication bypass if default parameters were used in production deployments.
**Learning:** Hardcoded fallbacks in configuration functions or services undermine environment variable security and create insecure default behaviors.
**Prevention:** Do not provide default hardcoded secrets for authentication or critical external services. Assert required environment variables on startup.
