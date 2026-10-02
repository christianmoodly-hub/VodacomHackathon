import caseCsv from "../../resources/06_she_shield_response_synthetic_case_data.csv?raw";
import { findLeads, normalizeCases, parseCsv } from "./pack.js";

/** The 12 anonymised rows from the SHE-SHIELD Response resource. */
export const SOURCE_CASES = normalizeCases(parseCsv(caseCsv));

export function leadsFor(cases) {
  return findLeads(cases);
}
