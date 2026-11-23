# Inbox

Claims and tasks land here (from the owner or an agent survey) and are drained into
`discussion/claims/` by `bin/claim` or the filing agent.

## 2026-11-20 — owner: the agents should find the work themselves

The repo is v1 (inventory, card editing, sales & profit, sheet import; eBay drafts pending developer
keys). The first overnight circle should survey the app and produce a claim backlog: what is broken,
what is missing, what is the highest-value next step. No eBay API work until the developer keys are
approved.

## 2026-11-23 — owner: argue the next story (S7), then the price source (S8)

Filed as C009 (S7 auth via Supabase's OAuth server) and C010 (S8 price source). Owner wants these
settled so story agents can build without asking him. Note the new `cards.comp_cents` (Price, last eBay comp).
