# UI Implementation Plan — Option 1 (Next.js + Tailwind + shadcn/ui)

## 0) Environment Setup
- Create app: `npx create-next-app@latest sousswap-ui --ts --tailwind`
- Initialize shadcn: `npx shadcn@latest init`
- Install deps: `npm i zod react-hook-form @tanstack/react-query`
- Configure API base: `.env.local` with `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000`
- Base layout/theme/fonts with shadcn defaults

## 1) Load Recipe + User Ingredients Screen
**Goal:** Collect recipe text + allowed ingredients + preferences.
- Layout: two-column
  - Left: recipe textarea
  - Right: allowed ingredients as tags input
- Preferences: dietary profile select, allow-out-of-list toggle
- CTA: “Start Substitution Flow”
- API: `POST /v1/sessions`
- Store: `session_id`, `parsed_recipe`, `annotated_recipe`, `stage_order`

## 2) Stage Overview + Ingredient List
**Goal:** Show current stage and list ingredients to review.
- Stepper header (Primary → Secondary → Seasoning)
- Stage card with brief guidance
- Ingredient list with role + importance badges
- CTA: “Generate Suggestions”
- API: `POST /v1/sessions/{id}/substitutions`

## 3) Ingredient Decision Wizard
**Goal:** Choose keep/swap/add per ingredient.
- One ingredient at a time
- Option cards show substitute, reason, diet fit, dish fit
- Actions: Keep, Swap (select), Add (select)
- Progress indicator (e.g., “Ingredient 3 of 7”)
- Accumulate choices in local state
- CTA: “Apply This Stage”

## 4) Apply Swaps + Preview
**Goal:** Apply choices and show updated recipe preview.
- API: `POST /v1/sessions/{id}/swaps` with `action: swap|add`
- UI: side-by-side “Before / After” ingredients + instructions highlight
- CTA: “Continue to Next Stage” or “Finish”

## 5) Final Output
**Goal:** Show final recipe + change log.
- Formatted recipe view
- Optional: copy/download
- CTA: “Start New Recipe”

## 6) Polish + QA
- Loading states + error toasts
- Persist session in URL or localStorage
- Analytics events for stage completion + swaps
- Skeleton loaders for LLM latency
