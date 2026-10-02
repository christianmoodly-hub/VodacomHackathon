# SHE-SHIELD DynamoDB Schema

Amazon DynamoDB stores case records and geographic risk hotspots. Table names and the AWS region come from environment variables so the same code can run in any account.

| Table | Environment variable |
| --- | --- |
| Cases | `CASES_TABLE_NAME` |
| Hotspots | `HOTSPOTS_TABLE_NAME` |

Region: `AWS_REGION`

## Cases

Fast case management and logging. Each write is a new timestamped item under the same `case_id`, so the history of a case stays in one partition.

| Attribute | Type | Role |
| --- | --- | --- |
| `case_id` | String | Partition key |
| `timestamp` | Number | Sort key (Unix epoch milliseconds) |
| `status` | String | Case state, for example `open`, `investigating`, `resolved` |
| `description` | String | Missing-person report text |
| `severity` | String | Urgency, for example `low`, `medium`, `high`, `critical` |
| `coordinates` | Map | Location of the report |
| `coordinates.latitude` | Number | Latitude |
| `coordinates.longitude` | Number | Longitude |

Access pattern: query by `case_id`, newest first (`ScanIndexForward = false`).

## Hotspots

Areas used for tracking and risk monitoring. One item per hotspot.

| Attribute | Type | Role |
| --- | --- | --- |
| `hotspot_id` | String | Partition key |
| `radius` | Number | Hotspot radius in meters |
| `risk_level` | String | `MODERATE` or `HIGH` |
| `active_case_count` | Number | Count of open cases currently linked to the hotspot |
| `latitude` | Number | Center latitude of the cluster |
| `longitude` | Number | Center longitude of the cluster |

Access pattern: get one hotspot by `hotspot_id`.
