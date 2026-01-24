# Project Context — SousSwap (working name)

## System Overview
This project implements an interactive ingredient-editing platform for existing recipes.
Users provide:
1) A recipe document (free text)
2) A list of allowed or preferred ingredients

The system parses the recipe and then guides the user through a serialized, ingredient-level
editing workflow where ingredients can be swapped with context-appropriate substitutes.
The final output is a rewritten recipe reflecting the user’s choices.

The system is NOT a recipe generator.
It is an interactive decision-support editor.

---

## Core Interaction Model
- Ingredient-level decisions (not recipe-level)
- Serialized workflow to reduce cognitive load:
  - Primary ingredients first
  - Secondary ingredients next
  - Spices/optional ingredients last
- For each ingredient:
  - System proposes 3–5 substitutes
  - User chooses, keeps original, or enters custom replacement
- Final recipe is rewritten after all user decisions

This follows a mixed-initiative model:
- AI proposes
- User decides
- AI adapts downstream effects

---

## Theoretical Grounding (Canonical)
1. Payne, Bettman & Johnson (1993) — *The Adaptive Decision Maker*
   - Justifies serialized, staged decision-making to avoid choice paralysis

2. Horvitz (1999) — *Principles of Mixed-Initiative User Interfaces*
   - Justifies AI suggestions with retained user control

3. Teng, Lin & Adamic (2012) — *Recipe Recommendation Using Ingredient Networks*
   - Justifies data-driven ingredient substitution reasoning

---

## Intelligence Design Philosophy
- All complex reasoning is outsourced to an LLM
- The LLM acts as:
  - Parser
  - Ingredient role classifier
  - Context-aware substitution generator
  - Recipe rewriter
- Application code enforces:
  - Strict JSON schemas
  - Bounded choice (max 5 substitutes)
  - Role constraints (no cross-role swaps)
  - Caching and orchestration

No custom ML models are trained.

---

## Ingredient Roles (Fixed Vocabulary)
Allowed roles:
- base_starch
- protein
- vegetable
- sauce_liquid
- fat
- aromatic
- spice_herb
- sweetener
- acid
- binder_thickener
- dairy
- garnish
- other

Stages:
- primary
- secondary
- seasoning_optional

---

## Design Constraints
- Must be demoable in days, not weeks
- Must prioritize structure over creativity
- Must avoid LLM hallucination via schema validation
- Must show explainability at the point of decision

---

## Non-Goals
- No full recipe generation from scratch
- No collaborative multi-user editing
- No nutritional optimization engine
- No learned personalization model (yet)
