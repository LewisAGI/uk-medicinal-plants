# uk-medicinal-plants content pack (v1, built 2026-10-22 23:12 ICT)

Hand-curated in `tools/build.py` (every statement was read on the cited page/abstract). Rebuild: `python3 tools/build.py && python3 tools/validate.py . && python3 tools/check_urls.py .`

**Safety framing:** information only, no dosing or preparation instructions anywhere; each plant carries `safety_banner` telling users to consult a pharmacist or doctor. `general_safety[]` carries NHS/MHRA advice (THR mark, interactions, Yellow Card, poisoning).

## Counts
75 plants, 90 medicinal-use entries. Grades: clinical_supported 8 · clinical_mixed 6 · traditional_only 30 · monograph_area_only 13 · not_endorsed 3 · no_known_benefit 30. 37 plants with toxicity, 14 with lookalikes. 89 sources (49 EMA HMPC pages, 10 Cochrane reviews, 19 Woodland Trust, RHS, Plantlife, NHS x5, MHRA x4).

## Schema (content.json)
- `grades{}`: definitions of each evidence_grade.
- `plants[]`: id, common_name, botanical_name, medicinal_uses[] {use, evidence_grade, basis, evidence_label, sources[]}, toxicity {level, summary, sources[]}, lookalikes[] {lookalike, risk, distinguishing_features, evidence_label, sources[]}, cautions[] {text, sources[]}, traditional_notes[], safety_banner.
- Labels: `evidence_label` = evidence (stated by the cited source) / inference (our reasoning, e.g. "no monograph located") / uncertainty. Objects without a label are evidence.

## Grading rules
- clinical_supported: Cochrane positive conclusion and/or EMA "well-established use".
- clinical_mixed: Cochrane judged evidence weak/inconsistent, OR EMA and Cochrane disagree (ginkgo, echinacea shown as mixed, not supported).
- traditional_only: EMA public summary says "traditional use".
- monograph_area_only: EMA page shows an adopted monograph and therapeutic area but no public summary; we did not read the monograph PDF, so no WEU/traditional claim is made.
- no_known_benefit: no EMA monograph and no Cochrane review located (an absence-of-evidence inference, not proof of no effect). Toxic plants whose compounds became drugs (foxglove/digoxin, yew/taxanes, deadly nightshade) are graded no_known_benefit for the plant itself.

## Gaps
- 13 monograph_area_only entries need the EMA monograph PDFs read (St John's wort, nettle, sage, garlic, plantain, meadowsweet, dandelion, oak, lime, goldenrod, bogbean, lavender flower).
- Cochrane web pages block automated fetch (403/302); DOIs verified on Crossref and conclusions read from PubMed abstracts instead.
- No NHS pages exist for most individual herbs; NHS used for general herbal safety, depression (St John's wort), insomnia, digoxin.
- Lookalike detail only where a source states it; no source fetched yet for giant hogweed vs hogweed vs cow parsley features, hemlock water-dropwort vs wild celery/parsnip, or autumn crocus vs wild garlic. Woodland Trust 404s for hemlock, comfrey, lords-and-ladies, hogweed (Plantlife/RHS used instead).
- No images; species photos should come from a licensed source (e.g. BSBI, Wikimedia with licence check) and be expert-checked, since misidentification is the main harm.
- "No known benefit" list is our selection of common plants; needs a botanist/pharmacist review before publish.

## Verification log
- 2026-10-22 23:12 ICT: 49 EMA herbal pages fetched (HTTP 200) and HMPC summary sentences extracted (oral/topical scope, age limits). taraxaci-folium-et-radix and oenotherae-biennis-oleum slugs 404 (dropped; evening primrose not included).
- Cochrane: 10 DOIs resolved on Crossref; Authors' conclusions read on PubMed (PMIDs 18843608, 24554461, 25386977, 25892430, 18254076, 19160216, 17943794, 17054208, 23152216, 25536022). Wrong guesses caught: CD008002/CD003618/CD003045/CD003046/CD001895 were unrelated reviews and not used; CD003230.pub5 does not exist (pub4 used).
- MHRA St John's wort Drug Safety Update URLs found via GOV.UK search API. validate.py 0 errors; check_urls.py: all non-Cochrane URLs 200 (tools/url_check.json).
