# Audit log

Amazon DynamoDB stores the brief audit row and the reviewer decision. The table name comes from `AUDIT_TABLE_NAME`. The region comes from `AWS_REGION`. Nothing in the table is a real identity or a location.

## AuditLog

One row per brief or decision. Newest rows for one lead share `lead_id` and differ by `timestamp`.

| Attribute | Type | Role |
| --- | --- | --- |
| `lead_id` | String | Partition key. Synthetic lead id, such as `nl:CASE-SYN-1000>CASE-SYN-1008` |
| `timestamp` | String | Sort key. UTC time the row was written, `YYYY-MM-DDTHH:MM:SS.ffffffZ` |
| `item_type` | String | `audit` for a brief, `decision` for a reviewer choice |
| `data_file` | String | Set on an audit row. Always `06_she_shield_response_synthetic_case_data.csv` |
| `model_id` | String | Set on an audit row. `BEDROCK_MODEL_ID`, or `template-fallback` when the draft is the template |
| `reviewer` | String | Reviewer placeholder. This build stores `R-07` |
| `decision` | String | Set on a decision row. One of `verified`, `dismissed`, `needs_more_info` |
| `same_area_days` | Number | Same-area window used for that run |
| `cross_area_days` | Number | Cross-area window used for that run |

`GET /audit` reads the table and returns both row types, newest timestamp first. The case fields themselves stay in the browser and in the brief response. They are not copied into this table.

The brief is written by Amazon Bedrock through `POST /brief`. `BEDROCK_MODEL_ID` names the model. There is no map, coordinate, alert, or sign-in table.
