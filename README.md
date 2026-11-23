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

## Controls

| Action | Mouse / touch | Keys |
| --- | --- | --- |
| Pan the map | drag | W A S D / arrows |
| Zoom | wheel / pinch | + / − |
| Select a region or army | click / tap | Tab cycles your armies |
| March the selected army | right-click or shift-click a region, or **Move** then tap | M toggles move mode |
| End the turn | **Beat the nagara** | Enter |
| Ledger (bahi-khata) · Sarbat Khalsa · Codex | top bar | L · K · C |
| Close / deselect | | Esc |
