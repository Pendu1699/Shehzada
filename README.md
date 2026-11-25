# Shehzada · ਸ਼ਹਿਜ਼ਾਦਾ

A browser-based, turn-based grand strategy game of the Punjab from the formation of
the Dal Khalsa (Vaisakhi 1748) to the annexation of 1849. Lead a Sikh misl through a
century of fire, keep the two swords of **Miri** (temporal power) and **Piri** (the
Panth's trust) in balance, and hear a dhadi sing the vaar of your century.

Everything you see and hear is generated in code: the wasli-paper map, the painted
figures, the drone, drums and sarangi. The only bundled third-party assets are
open-licence fonts installed through `@fontsource`.

## ▶ Play now — no download needed

**Click here: [pendu1699.github.io/Shehzada](https://pendu1699.github.io/Shehzada/)**

That's it. The game opens in your web browser (Chrome, Safari, Edge or Firefox) on a laptop
or desktop computer. Nothing to install, nothing to sign up for. Your games are saved in that
browser automatically, so you can close the tab and carry on later.

> It works best on a computer with a mouse. Phones and tablets work, but the map is small.

---

## How to play (for complete beginners)

**You are the leader of a Sikh misl** — a band of horsemen — in the Punjab in the 1700s. Over
a hundred years you try to survive, grow strong, and keep the trust of the Panth, until the
story ends in 1849.

**Starting a game**

1. Click **Begin a new vaar**.
2. Pick a starting year. For your first game choose **1748**.
3. Pick a misl. For your first game choose **Ahluwalia** (it says "Historic path").
4. Click **Ride out**.

**The old man will teach you.** A box at the bottom of the screen — the counsel of Nawab
Kapur Singh — tells you what to do, one small step at a time, and the button or place he's
talking about glows orange. Do what he says, or click **Next →**. You can bring him back any
time with the orange **? Counsel** button at the top of the screen.

**What you do each turn**

1. **Move your army.** Click on your horsemen, then drag them onto a nearby area of the map
   (or right-click the area). A red line shows where they'll ride.
2. **Look after your land.** Right-click one of your areas to open a free kitchen (*langar*),
   strengthen a fort, or raise more men.
3. **End the turn.** Click the big drum (**Beat the nagara**) in the bottom-right corner.
   Everyone moves, battles happen, and a storyteller tells you what happened.
4. Sometimes news arrives with a choice to make. Read it and pick what you think is right.

**The two numbers that matter** are at the top: **Miri** (your power — land, money, soldiers)
and **Piri** (how much the Sikh community trusts you). Try to grow both together. Being
generous, keeping promises and sparing cities raises Piri; cruelty and greed lower it.

**Not sure what something means?** Hover your mouse over it — almost everything explains
itself. The **Codex** button explains the Punjabi words.

**The mouse, in short**

| Do this | And this happens |
| --- | --- |
| Left-click | Select something (it never gives an order by accident) |
| Drag the empty map / scroll the wheel | Move around / zoom in and out |
| Drag your army somewhere | March there |
| Right-click your army | Its orders: split it, join armies, how it fights |
| Right-click land | Langar, fort, recruiting, offering protection |

Settings (the ⚙ button) has bigger text, colour-blind mode, and sound on/off.

---

## Playing on your own computer (optional)

Only needed if the link above doesn't work for you, or you'd like to play offline.

**1. Install Node.js** — a free program the game needs to start. Go to
[nodejs.org](https://nodejs.org), click the big **LTS** download button, and install it like
any other app (keep clicking Next / Continue).

**2. Download the game** — click
[this link to download the game](https://github.com/pendu1699/Shehzada/archive/refs/heads/main.zip),
then double-click the downloaded file to unzip it. You'll get a folder called `Shehzada-main`.

**3. Open Terminal (Mac) or Command Prompt (Windows)**

- *Mac:* press **Cmd + Space**, type **Terminal**, press Enter.
- *Windows:* press the **Windows key**, type **cmd**, press Enter.

**4. Go into the game's folder.** Type `cd` followed by a space, then drag the `Shehzada-main`
folder from your Downloads into the window, and press **Enter**.

**5. Copy and paste these, one at a time, pressing Enter after each:**

```bash
npm install
```

```bash
npm run dev
```

The first one takes a minute or two (only needed once). The second starts the game.

**6. Open your browser and go to http://localhost:5173** — the game is there.

Keep the Terminal window open while you play. When you're done, close it. Next time, repeat
steps 3, 4, and only the second command (`npm run dev`).

**If something goes wrong**

- *"Could not read package.json"* — you're not in the game's folder; do step 4 again.
- *"command not found: npm"* or *"'npm' is not recognized"* — Node.js isn't installed; do step 1,
  then close and reopen Terminal.
- *An error mentioning esbuild* — type `npm rebuild esbuild`, press Enter, then `npm run dev`.
- Warnings about "vulnerabilities" during step 5 are normal and harmless. Ignore them.

## For developers

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
- **The painted subcontinent.** The map runs from Herat to Bengal and from Ladakh and western Tibet to
  Ceylon. The Punjab is drawn in detail (61 regions) and is where the game is fought; the rest of South
  Asia (84 larger regions: Afghanistan, Sindh, Rajputana, Hindustan, Bengal, the Deccan, the South,
  Nepal and Tibet) follows its own history around you — Plassey, Panipat, Srirangapatna, the fall of the
  Marathas, the conquest of Sindh — unless you hold the land.
- **Four ages, one century.** A game started in 1748 runs on through *The Misl Raj* (1765), *The Lion of
  Lahore* (1799) and *Twilight of the Sarkar* (1839). Each age opens with a page saying what has changed and
  what history would bring next; its name follows your story (*The Bhangi Sarkar*, *The Confederate Khalsa*,
  *The Two Empires*...).
- **Alternative history.** Any misl that holds Lahore and Amritsar with the Panth's trust can proclaim the
  Sarkar-i-Khalsa early — or keep the misls a united confederacy. Ranjit Singh may find Lahore already
  yours. Delhi, Kabul, Patna Sahib, Hazur Sahib, Lhasa and Fort William can all be reached.
- **The Sarbat Khalsa** gathers before the Akal Takht, painted as the era had it.
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
