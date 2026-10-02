# SHE-SHIELD Response

Browser-only review of synthetic, anonymised case records. Named links and area or timing leads are listed separately. Each one is a possible investigative lead, not a conclusion.

```bash
npm install
npm run dev
```

The page reads `resources/06_she_shield_response_synthetic_case_data.csv`.

Set `VITE_API_BASE_URL` to the API Gateway base URL when `POST /brief`, `POST /decision`, and `GET /audit` are deployed. If that address is missing or unreachable, the page shows Offline mode and writes the coordination brief from the local template.

```bash
npm run build
```
