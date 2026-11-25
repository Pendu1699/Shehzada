# Shehzada — Development Plan

This is the working plan for the game described in the design brief. It covers the architecture, the data model and the milestones. It is updated as milestones land, and the **Status** column at the bottom is the source of truth for what is done.

---

## 1. Architecture

```
src/
  engine/      Pure TypeScript game logic. No React, no Pixi, no DOM.
               state.ts      GameState types + newGame()
               rng.ts        mulberry32 seeded RNG (state stored inside GameState)
               calendar.ts   turn <-> (year, Vaisakhi/Diwali, Rabi/Kharif, monsoon)
               actions.ts    Action union + applyAction() reducer
               turn.ts       endTurn(): AI orders -> resolution -> events -> new turn
               economy.ts    revenue, rakhi, jagirs, langar, upkeep (with breakdowns)
               miripiri.ts   Miri index, Piri changes, brittleness effects
               movement.ts   pathing over the region graph, river/monsoon costs
               combat.ts     stances, battle rounds, sieges, loyalty/treachery
               ai.ts         faction personalities and order generation
               sarbat.ts     Sarbat Khalsa + gurmatas
               diplomacy.ts  treaties, rakhi offers, marriage, Company foothold
               events.ts     data-driven event engine
               court.ts      Darbar factions + succession (Sarkar era)
               josh.ts       sacred-site desecration -> Josh, the Vow, rebuilding
               chronicle.ts  structured record of everything that happened (feeds the Vaar)
               save.ts       serialise/deserialise + version migration
  data/        Static data: regions, rivers, fords, misls, powers, leaders,
               units, events, scenarios, glossary. generated/mapGeometry.json
  map/         PixiJS v8 renderer of "the Painted Punjab"
  ui/          React screens and panels
  audio/       Web Audio procedural drone, drums, sarangi voice, UI sounds
  narrative/   Dhadi ballad generator (templates + chronicle -> prose)
  art/         Procedural textures (wasli grain, phulkari patterns, banners, figures)
  store.ts     Zustand store: holds GameState, dispatches to engine
tests/         Vitest engine tests
scripts/       build-map.ts (geometry generator), simulate.ts (headless AI-vs-AI)
```

**Rules of the road**

- The engine is deterministic: `applyAction(state, action)` and `endTurn(state)` are pure in effect (they work on a `structuredClone` of the state). All randomness comes from `state.rng`, a single `uint32` that the mulberry32 generator advances. The same seed plus the same action list always gives the same game, so a save is also a replay.
- React and Pixi only read state and dispatch actions through the store.
- Every number the player sees that is computed (revenue, Piri change, combat odds) comes from a function that returns a `Breakdown` (`{ total, parts: [{label, value}] }`), so tooltips can show where it came from.
- Everything visual and audible is generated in code. The only bundled third-party assets are the open-licence fonts installed via `@fontsource/*`.

## 2. The map

**Coordinate system.** World units are a simple equirectangular projection centred on the Punjab:

```
x = (lon - 69.6) * 0.848 * 180      // 0.848 ≈ cos(32°) corrects east-west stretch
y = (35.0 - lat) * 180
```

The world is about 1282 × 1188 units, from 69.6°E to 78.0°E and from 35.0°N down to 28.4°N.

**How the regions are made.** Hand-drawing 60 non-overlapping polygons that share edges exactly is fragile, so the polygons are *generated from hand-authored data* by `scripts/build-map.ts`:

1. `src/data/regions.ts` lists each region's seat (the lat/lon of its main town) and its attributes.
2. `src/data/rivers.ts` lists the six rivers of the Punjab (plus the Kabul and the Yamuna as edge rivers) as lat/lon polylines.
3. The script rasterises the rivers onto a 5-unit grid and runs a multi-source Dijkstra flood from every seat. Entering a river cell is expensive, so region borders snap to the rivers and the doabs come out naturally. Cells too far from any seat stay unpainted, which gives the map an organic edge where the high Himalaya and the Thar fade into blank wasli.
4. Each region's cell set is traced into an outline, smoothed (Chaikin) and simplified. Adjacency, and which river (if any) separates two neighbours, is read straight off the grid. Named fords in `src/data/rivers.ts` are attached to the river crossing nearest to them.
5. The result is written to `src/data/generated/mapGeometry.json` and committed, so the game itself has no geometry maths at runtime.

## 3. Data model (abridged)

```ts
GameState {
  version, seed, rng, turn, scenarioId, playerFaction, phase,
  regions:  Record<RegionId, RegionState>     // owner, control, fort, stability, langar, rakhi, siege, desecrated
  factions: Record<FactionId, FactionState>   // treasury, piri, legend, attitudes, wars, treaties, foothold, flags
  armies:   Record<ArmyId, Army>              // owner, region, units[], leader, orders, morale, supply
  leaders:  Record<LeaderId, Leader>          // traits, loyalty, born/dies, faction, alive
  explored: Record<RegionId, 0|1|2>           // 0 pencil, 1 seen, 2 visited (player's fog of war)
  gurmatas, josh, court, events (fired/pending), chronicle[], reports (last turn)
}
```

Static data (regions, unit types, leader templates, events) lives in `src/data` and is referenced by id, so saves stay small.

## 4. Milestones

| # | Milestone | Playable result |
|---|-----------|-----------------|
| 1 | Foundation | Vite/TS/React/Pixi app, seeded RNG, region data + generated geometry, painted map with pan/zoom/select, turn cycle, save/load/export |
| 2 | Economy and control | Revenue with breakdowns, rakhi, jagirs, langar, Miri/Piri meters, recruitment, movement with river/monsoon costs |
| 3 | Combat | Six stances, round-by-round resolution, sieges, the painted battle vignette, supply/attrition, commander loyalty |
| 4 | Factions and AI | All twelve misls, Durrani winter invasions, Mughal governors, Marathas, hill states, Dogras, Company; `scripts/simulate.ts` |
| 5 | Sarbat Khalsa and diplomacy | Gurmata proposals and votes, Dal Khalsa union, treaties, rakhi offers, marriage, Company foothold |
| 6 | Events and narrative | Event engine, scripted history 1748–1849, 50+ generic events, Josh/desecration/rebuilding, dhadi narration, `HISTORY.md` |
| 7 | Court and succession | Sarkar-i-Khalsa, Darbar factions, heir education, the 1839–49 chain, endings and the Vaar |
| 8 | Art and audio polish | Every screen to final quality, ambient animation, procedural music |
| 9 | Balance, tutorial, accessibility | Nawab Kapur Singh's counsel tutorial, tooltips, colour-blind mode, keyboard shortcuts, UI scale |
| 10 | Final QA | Tests green, no console errors, full 1748–1849 run, 60fps map |

## 5. Respect rules (enforced in code review)

- No depiction of the Gurus anywhere (no portraits, units or characters).
- No Gurbani: no quotations, paraphrases or invented verses. Dhadi text is original prose.
- Sikh factions never receive a "desecrate" option (enforced in `josh.ts` and tested).
- The Khanda appears only on Nishan Sahib banners.
- Martyrdom events open with muted art and a slow drone and give no loot.

## 6. Status

| Milestone | Status | Notes |
|-----------|--------|-------|
| 1 Foundation | done | Engine, RNG, generated map, painted renderer, turns, save/load/export |
| 2 Economy and control | done | Revenue breakdowns, rakhi, jagirs, langar, Miri/Piri, recruitment, river/monsoon movement |
| 3 Combat | done | Six stances, rounds, sieges and storming, battle vignette, supply, commander treachery |
| 4 Factions and AI | done, needs tuning | All misls and powers; Durrani invasions; Company encroachment; `scripts/simulate.ts` |
| 5 Sarbat Khalsa and diplomacy | done | Gurmatas with weighted votes; alliances, marriages, tribute, passage; Company treaties |
| 6 Events and narrative | done | ~40 scripted historical events, 55 generic events, Josh/Vow/rebuilding, dhadi text, HISTORY.md |
| 7 Court and succession | done | Darbar factions, heir, army, averted-or-not 1839–46 chain, both wars, endings, the Vaar + PNG |
| 8 Art and audio polish | mostly done | All screens styled; ink-bleed, river shimmer, banners, diyas, clouds; procedural music |
| 9 Balance, tutorial, accessibility | partly done | Tutorial (Nawab Kapur Singh), tooltips, colour-blind mode, keys, UI scale, reduced motion. Balance: see below |
| 10 Final QA | partly done | 56 tests green; no console errors in scripted browser runs; full 1748→1849 runs complete headless |

### Expansion (after 1.0)

| Step | Status | Notes |
|------|--------|-------|
| Map of the subcontinent | done | 145 regions, coastline, sea, 14 new rivers; tiled static painting for performance |
| Powers beyond the Punjab | done | 12 new factions; `engine/history.ts` timeline 1751–1844 |
| Akal Takht Sarbat Khalsa | done | era-dependent painting |
| Ages and alternative history | done | `engine/eras.ts`, `data/events/alt.ts`, `data/events/world.ts` |
| More figures and lore | done | ~30 leaders, codex entries, HISTORY.md sections |

### Known gaps / next steps

- **Balance.** AI-vs-AI runs (`npm run simulate`) give historical-ish but uncertain outcomes from 1767 and 1799
  (roughly half annexation, half survival) and mostly annexation from 1839. Unification from 1748/1767 is
  rare unless the Bhangis hold Lahore; the autoplayed player keeps Piri high because its event choices
  favour virtue. More tuning runs are needed.
- **Performance.** Headless Chromium uses software WebGL (~12 fps); on a GPU the cached static painting
  should hold 60 fps, but this has not been measured on real hardware yet.
- **Dal Khalsa combined army.** United gurmatas ally the misls and raise morale, but the player does not
  yet command the joint army directly.
- **Gurmukhi** needs a native reader's review (`GURMUKHI_REVIEW.md`).
