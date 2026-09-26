# FORTRESS Live Demo Walkthrough & Script (Phase 1–12)

This document details the step-by-step live demonstration flow for judging presentations.

---

## Step-by-Step Demonstration Flow

### Step 1: System Overview & Landing Page
- **Action**: Open dashboard at `http://127.0.0.1:3000`.
- **Explain**: Introduce FORTRESS as an automated Forecast Reliability Stress-Testing & Self-Audit System for monsoon weather predictions across India.
- **Claim NOT to make**: Do NOT claim FORTRESS is a replacement for weather models or an official weather forecasting authority.

### Step 2: Geographic Region Selection
- **Action**: Select sub-domain from top dropdown (`Northwest India`, `Central India`, or `Eastern UP`).
- **Explain**: FORTRESS evaluates localized atmospheric dynamics across key agricultural and convective regions in India.
- **Claim NOT to make**: Do NOT claim operational India-wide continuous coverage.

### Step 3: Forecast Lead-Day Navigation
- **Action**: Toggle lead days from D1 to D10 using the horizon slider.
- **Explain**: Demonstrate how forecast uncertainty evolves across 10-day lead horizons.

### Step 4: Baseline Forecast Analytics & $P(\text{Bust})$
- **Action**: Inspect grid cell bust risk probability map and metrics panel.
- **Explain**: Show how the AI model calculates failure risk probability $P(\text{Bust})$.

### Step 5: Stress Lab & Forecast Fragility Direction (FFD)
- **Action**: Open Stress Lab drawer for a selected grid cell.
- **Explain**: Show how initial condition perturbations reveal forecast sensitivity and fragility (FFD).
- **Claim NOT to make**: Do NOT claim FFD is an established WMO/meteorological standard; mark it as an experimental research diagnostic.

### Step 6: Failure Intelligence & Corridors
- **Action**: View failure corridors and spatial error propagation maps.
- **Explain**: Demonstrate how spatial error corridors highlight regions of systematic atmospheric predictability loss.

### Step 7: Independent Evidence Streams
- **Action**: Open Evidence panel displaying OOD Novelty, Failure DNA match score, and Ensemble Disagreement.
- **Explain**: Highlight how independent evidence checks provide multi-angle verification.
- **Claim NOT to make**: Do NOT claim OOD novelty or ensemble spread alone guarantees forecast failure.

### Step 8: Self-Audit Status Assignment
- **Action**: View the diagnostic status badge (`SUPPORTED RELIABILITY`, `EXPERT REVIEW`, `CONFLICT`, etc.).
- **Explain**: Show how the decision rule engine automatically synthesizes evidence to categorize forecast reliability.

### Step 9: Trust Horizon Timeline
- **Action**: Inspect the Trust Horizon bar (D1–D10).
- **Explain**: Show how FORTRESS identifies the contiguous safe forecast window before model degradation.

### Step 10: Breaking Point Identification
- **Action**: Highlight the Breaking Point lead day warning indicator.
- **Explain**: Explain that Breaking Point signals the transition day where diagnostics shift to RED status.

### Step 11: Machine-Readable Reliability Passport
- **Action**: Click "Export Reliability Passport" to view JSON modal.
- **Explain**: Show the complete, verifiable diagnostic certificate for operational integration.

### Step 12: Sector Decision-Support View
- **Action**: Switch to Reservoirs / Agriculture / Disaster tab.
- **Explain**: Show how reliability ratings inform domain-specific risk advisories.
- **Claim NOT to make**: Do NOT claim FORTRESS directly controls physical dam spillways, power grids, or evacuation orders.

### Step 13: Multilingual Assistant Interaction
- **Action**: Ask assistant a question in English or Hindi (e.g., "Is the D5 forecast reliable for Central India?").
- **Explain**: Demonstrate interactive natural language Q&A support.

### Step 14: Voice Interaction Integration
- **Action**: Click microphone icon to issue a voice query.
- **Explain**: Show hands-free operational accessibility for field personnel.
