# SHE-SHIELD Response

A review screen for synthetic, anonymised case records. It helps a person see where a named link and an area or timing rule agree, and where they do not. It does not decide that two records are the same case.

## Problem

The resource file stores twelve placeholder records. Five of them already name another ID. Area and date can suggest a different set of pairs. Someone reviewing the file needs both views, the exact fields behind each one, and a written reminder that a person must check the lead before anyone acts.

## Approach

The page loads `resources/06_she_shield_response_synthetic_case_data.csv` in the browser. It keeps two groups:

- Named in the data, from `possible_linked_case_ref`.
- Area or timing. The default windows are 21 days in the same area code, and 7 days across different area codes. Those windows are reviewer assumptions, shown on the page and in the brief. They are not columns in the file.

`record_type` and `risk_indicator` are shown beside the other fields. They are not used as a score. A lead can be opened, compared field by field, and turned into a coordination brief. Verify, Dismiss, and Needs more info stay in the browser session and only update the audit line.

## What the records show

At the default windows, none of the five named links is supported by area or timing. They sit in different areas and 68 to 114 days apart: 1000 to 1008, 1002 to 1004, 1003 to 1002, 1009 to 1010, and 1010 to 1011.

The area or timing rules connect a different set. CASE-SYN-1004, CASE-SYN-1005, CASE-SYN-1011, and CASE-SYN-1003 fall between 10 and 18 August 2026. The closest pair is 1005 and 1011, one day apart, in different areas. 1004 and 1003 are eight days apart in different areas, so they are not a pair on their own. They are connected through the others.

There is a second area or timing pair: CASE-SYN-1001 and CASE-SYN-1006, both Area-3, eight days apart. It is a real rule hit. It is separate from the August set.

## Guardrails

The footer stays on screen: synthetic data, authorised human review only, no action from this output. Every lead is labelled a possible investigative lead, not a conclusion. The coordination brief repeats that a person must verify it before any action, and records the data file, the run time, and a reviewer placeholder.

## API

`template.yaml` defines three Python Lambdas on Amazon API Gateway, one AuditLog table in Amazon DynamoDB, and an Amazon Bedrock brief. `POST /brief` drafts one lead. `POST /decision` stores verified, dismissed, or needs more info. `GET /audit` returns both, newest first. Table name and region come from `AUDIT_TABLE_NAME` and `AWS_REGION`. The model id comes from `BEDROCK_MODEL_ID`. The page uses `VITE_API_BASE_URL`. If that API cannot be reached, the page stays in offline mode and writes the brief from the local template. There are no maps, coordinates, or alerts.

## Run the review tool

```bash
cd frontend
npm install
npm run dev
```

Open the local address Vite prints. A recording outline is in `docs/demo-script.md`.

## Submission zip

Leave `.git` in the working copy. When you zip the project for submission, exclude `.git`, `node_modules`, and `dist`.
