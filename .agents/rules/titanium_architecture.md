# Titanium Architecture Invariants Rule

## Core Rules for EducationistGuru:
1. Always keep `edit.html` and `edit/index.html` byte-for-byte SHA256 identical.
2. In `edit/js/edit.js`, ensure all section renderers inside `renderAll()` remain wrapped in isolated try-catches.
3. In `js/crm-integration.js`, ensure zero lead loss: append to `eg_lead_vault_ledger`, queue offline drafts, and auto-flush on online/tab visibility/intervals.
4. In `CRM/settings.html`, ensure the External Vault backup download and restore never fail (always maintain server + client localStorage fallback).
5. Maintain 100% route and feature parity between `server.js` and `api.php`.
6. Whenever any schema, route, or section changes, immediately update `ARCHITECTURE_TITANIUM_CHAIN.md` and `AGENTS.md` and rebuild `educationistguru_production_package.zip`.
