# Raj Karega Khalsa · ਰਾਜ ਕਰੇਗਾ ਖ਼ਾਲਸਾ

A browser-based, turn-based grand strategy game of the Punjab from the formation of
the Dal Khalsa (Vaisakhi 1748) to the annexation of 1849. Lead a Sikh misl through a
century of fire, keep the two swords of **Miri** (temporal power) and **Piri** (the
Panth's trust) in balance, and hear a dhadi sing the vaar of your century.

Everything you see and hear is generated in code: the wasli-paper map, the painted
figures, the drone, drums and sarangi. The only bundled third-party assets are
open-licence fonts installed through `@fontsource`.

## Running

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests (Vitest)
npm run build      # type-check and production build into dist/
npm run simulate -- --games 20 --scenario s1748 --turns 200   # headless AI-vs-AI balance runs
npm run build-map  # regenerate src/data/generated/mapGeometry.json
```

See `PLAN.md` for the architecture and milestone status, `HISTORY.md` for sources and
simplifications, and `AUDIO.md` for the musical choices.

## Design overview

- **The two swords.** Miri (temporal power) is computed from land, revenue, armies and forts. Piri (the
  Panth's trust) only moves through costly choices: langar, sparing cities, keeping rakhi, honouring
  gurmatas, tolerance of every faith. Let Miri run far ahead and your polity grows brittle — commanders
  waver and may betray you in battle.
- **The dhadi.** Every turn is sung as a short vaar passage; the game ends with your own Vaar, generated
  from what actually happened, on an illuminated page you can save as an image.
- **The Painted Punjab.** Unseen land is pencil underdrawing; explored land takes colour washes; your land
  is gilded; the Company's red ink seeps in from the south-east.
- **History by default, bendable.** Scripted events from Ram Rauni (1748) to annexation (1849) fire unless
  their conditions have been changed — the succession tragedies and the treachery of 1845–46 can be averted.
- **Respect.** The Gurus are never depicted; no Gurbani is quoted or invented; no Sikh faction can
  desecrate a sacred site (enforced and tested).

Four scenarios: 1748 *The Age of Ghallugharas*, 1767 *The Misl Raj*, 1799 *The Lion of Lahore*,
1839 *Twilight of the Sarkar*.

## Controls

| Action | Mouse / touch | Keys |
| --- | --- | --- |
| Pan the map | drag open land | W A S D / arrows |
| Zoom | wheel / pinch | + / − |
| Select a region or army | left-click / tap (left-click never gives orders) | Tab cycles your armies |
| March | drag your army onto a region, or select it and right-click a region (right-click an enemy army to attack it), or **Move** then tap | M toggles move mode |
| Divide and send half | Ctrl (or Alt) + drag your army | |
| Army orders: divide, join, halt, stance | right-click your army | |
| Land actions: langar, fort, rakhi, recruit | right-click a region (with no army selected) | |
| Replay the tutorial | **? Counsel** | ? |
| End the turn | **Beat the nagara** | Enter |
| Ledger (bahi-khata) · Sarbat Khalsa · Codex | top bar | L · K · C |
| Close / deselect | | Esc |
