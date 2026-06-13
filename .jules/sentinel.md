## 2025-02-14 - Remove hardcoded JWT Secret Fallback
**Vulnerability:** A hardcoded `super-secret-key` string was used as a fallback for the `JWT_SECRET` in `AuthModule` and `JwtStrategy`. This could allow attackers to forge authentication tokens if the application was inadvertently deployed without the environment variable configured.
**Learning:** Hardcoded fallbacks for cryptographic secrets are highly dangerous because they silently suppress configuration errors and leave systems open to zero-effort exploitation.
**Prevention:** Use a fail-fast approach by explicitly throwing an initialization error if a required cryptographic environment variable is missing, preventing the application from starting in an insecure state.
