# Course audit — Update 32, release r4 (2026-11-25)

Every course below is **Draft content — review pending | Not approved**. This audit checks structure, arithmetic and references. It is not a scientific approval.

## Courses touched

| Code | Change in r4 | Checks | Approval |
|---|---|---|---|
| I-201, I-202, I-204, I-206, A-301, A-302, A-305, A-307 | Registry `lectures` 3 → 4; blurb "Three" → "Four" (r1). No lecture text changed in r4 | Fourth lecture section present in HTML for each | Not approved |
| A-304 | L4 "Heterogeneous groups and targeted vaccination" added (r1); revised after review (r4): threshold assumptions, VE form, R0 definition, next-generation matrix gloss, separate-group caveat | Arithmetic re-asserted with exact fractions (3/4, 1/3, 5/12); lab, key and checkpoint block identical to r1 | Not approved; needs human scientific and Arabic review |
| Other courses | None in r4 | — | Unchanged |

## Arithmetic (A-304 L4)

- Threshold for R0 = 4 under the stated assumptions: 1 − 1/4 = 3/4 = 75%.
- Threshold for R0 = 3/2: 1 − 2/3 = 1/3 ≈ 33.3%.
- Separate-group targeted coverage: 0.2 × 3/4 + 0.8 × 1/3 = 5/12 ≈ 41.7%.
- Vaccine-efficacy form: required coverage (1 − 1/R0)/VE under a simple model; stated as an assumption-bound model, not a general rule.

## References (status after r4)

- Confirmed with evidence and updated in the HTML: Egger 1997 (BMJ 315(7109):629–634), STROBE (Lancet 2007; 370(9596):1453–1457), Mantel–Haenszel 1959 (JNCI 22(4):719–748).
- Confirmed as a bibliographic fact, not inserted: Diekmann et al. 1990 (J Math Biol 28:365–382).
- Not confirmed, kept "do not approve": Morgenstern 1995 (Annu Rev Public Health 16:61–81).
- Suggested by review, not verified and not added: Anderson & May 1991; van den Driessche & Watmough 2002.

## Limits

- The A-304 L4 review was one AI subagent. It is not a qualified human expert review.
- Lecture text for the other courses was not re-read in this release.
- Registry conflicts C-2 to C-6 remain open; their status and the decisions needed are in the change log.
