import caseCsv from "../../resources/06_she_shield_response_synthetic_case_data.csv?raw";
import { parseCsv } from "./leads.js";

/** The 12 anonymised rows from the SHE-SHIELD Response resource. */
export const SOURCE_RECORDS = parseCsv(caseCsv);
