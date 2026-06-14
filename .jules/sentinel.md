## 2026-06-14 - Mass Assignment in User Settings (Feature Overrides)
**Vulnerability:** The `PATCH /users/settings` endpoint allows users to improperly modify their own `featureOverrides` (mass assignment/IDOR), potentially granting themselves admin-like privileges (e.g., `canDeleteBookings`, `canExportData`).
**Learning:** Storing UI state (dashboard layouts) in the same unstructured JSON object as security permissions creates a high risk of privilege escalation when the endpoint blindly trusts user input.
**Prevention:** Always validate and allowlist specific safe fields when updating unstructured JSON data from user requests. Never mix security permissions and UI state in the same updateable object.
