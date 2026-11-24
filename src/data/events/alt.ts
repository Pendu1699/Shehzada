// Alternative history. History runs roughly as it happened unless the player
// changes it; these events are the forks. Every one checks the state of the
// player's own game, not a date alone:
//
//  * A Khalsa Raj proclaimed early, by whichever misl holds Lahore and Amritsar
//    with the Panth's trust — or the misls kept as a united confederacy instead.
//  * Ranjit Singh finding Lahore already held: rival, ally, or general.
//  * Great cities taken that history never gave the Khalsa: Delhi kept,
//    Kabul, Kandahar, Herat, Agra, Patna Sahib and Hazur Sahib, Lhasa, Calcutta.
//  * Zorawar Singh's march into Tibet, 1841, and whether the Darbar stands by it.

import { chronicle } from '../../engine/chronicle';
import { regionsOf, polityName, isSikh } from '../../engine/query';
import { chance } from '../../engine/rng';
import type { GameState } from '../../engine/state';
import { fx, leaderAlive, owns, P, regionCount, sikhFactions } from './fx';
import type { EventDef } from './types';

const sarkarOf = (s: GameState) => Object.values(s.factions).find((f) => f.sarkar && f.alive)?.id;
const mislName = (s: GameState, f: string) => polityName(s, f).replace(/^the /, '');

/** A city the Khalsa took that history did not give it: legend, and a line of the Vaar. */
function capture(id: string, region: string, title: string, text: string, opts: { piri?: number; legend?: number; from?: number } = {}): EventDef {
  return {
    id,
    title,
    kind: 'historical',
    from: opts.from ? { year: opts.from } : undefined,
    weight: 8,
    mood: 'heroic',
    when: (s) => owns(s, P(s), region) && isSikh(P(s)),
    text: (s) => text.replace('{polity}', polityName(s, P(s))),
    effect: (s) => {
      fx.legend(s, P(s), opts.legend ?? 6);
      if (opts.piri) fx.piri(s, P(s), opts.piri, title);
    },
  };
}

export const ALT: EventDef[] = [
  // ── An early Khalsa Raj ────────────────────────────────────────────────────
  {
    id: 'khalsa_raj_early',
    title: 'Raj karega Khalsa',
    gurmukhi: 'ਰਾਜ ਕਰੇਗਾ ਖ਼ਾਲਸਾ',
    kind: 'historical',
    from: { year: 1761 },
    to: { year: 1800, festival: 'diwali' },
    weight: 10,
    mood: 'festive',
    ctx: (s) => {
      if (sarkarOf(s)) return null;
      const p = P(s);
      if (!isSikh(p) || !owns(s, p, 'lahore') || !owns(s, p, 'amritsar')) return null;
      if (regionCount(s, p) < 12 || s.factions[p].piri < 55) return null;
      return { faction: p };
    },
    text: (s) =>
      `Lahore and Amritsar both fly the banner of ${polityName(s, P(s))}, and the Panth trusts it. At Vaisakhi the sardars gather at the Akal Takht and an old question is asked aloud: should the Khalsa now rule as one state, with coin struck in the name of the Gurus — or stay the brotherhood of free misls it has always been?`,
    playerOnly: () => true,
    choices: [
      {
        label: 'Proclaim the Sarkar-i-Khalsa now',
        detail: 'Decades before Ranjit Singh: your misl becomes the Sarkar, with a darbar and a state. Other misls must bend or resist.',
        effect: (s) => {
          const p = P(s);
          s.factions[p].sarkar = true;
          s.factions[p].flags.early_sarkar = true;
          s.firedEvents.sarkar_turn = s.turn;
          fx.legend(s, p, 12);
          fx.piri(s, p, 2, 'Proclaimed the Sarkar-i-Khalsa');
          for (const g of sikhFactions(s)) if (g !== p) fx.attitude(s, g, p, -10);
          return `Coin was struck at Lahore in the name of the Gurus. The Sarkar-i-Khalsa of the ${mislName(s, p)} was born, a generation before its time.`;
        },
      },
      {
        label: 'Keep the misls a free confederacy, united',
        detail: 'No king: a permanent union of the misls under the Sarbat Khalsa. Every misl becomes your ally; Piri rises.',
        effect: (s) => {
          const p = P(s);
          s.factions[p].flags.confederacy = true;
          fx.piri(s, p, 8, 'Kept the Khalsa a brotherhood of equals');
          fx.legend(s, p, 6);
          for (const g of sikhFactions(s)) {
            if (g === p || g === 'phulkian') continue;
            fx.relation(s, p, g, 'alliance');
            fx.attitude(s, g, p, 25);
          }
          return 'The sardars swore a lasting union before the Akal Takht. The Khalsa would rule — but as a brotherhood, not a throne.';
        },
      },
      {
        label: 'Not yet',
        detail: 'The Punjab is not ready. The question may come again.',
        effect: () => 'The sardars went home. The question waited.',
      },
    ],
    aiChoice: 2,
  },
  // A computer-run misl that unites the Punjab early proclaims itself too.
  {
    id: 'khalsa_raj_early_ai',
    title: 'A Sarkar before its time',
    kind: 'historical',
    from: { year: 1765 },
    to: { year: 1800, festival: 'diwali' },
    weight: 8,
    mood: 'neutral',
    chance: 0.15,
    ctx: (s) => {
      if (sarkarOf(s)) return null;
      // Rare: the Bhangis held both cities for thirty years and never made a
      // state. It takes real dominance — most of the Punjab, and twice the
      // strength of any other misl.
      const misls = sikhFactions(s);
      const cand = misls.find((f) => f !== P(s) && f !== 'sukerchakia' && owns(s, f, 'lahore') && owns(s, f, 'amritsar') && regionCount(s, f) >= 20);
      if (!cand) return null;
      const rival = Math.max(0, ...misls.filter((f) => f !== cand).map((f) => s.factions[f].miri));
      return s.factions[cand].miri >= rival * 2 ? { faction: cand } : null;
    },
    text: (s, ctx) => `The ${mislName(s, String(ctx.faction))} hold Lahore and Amritsar and half the Punjab besides. At Lahore their chief is proclaimed: the Sarkar-i-Khalsa has come, and not from the house anyone expected.`,
    effect: (s, ctx) => {
      const f = String(ctx.faction);
      s.factions[f].sarkar = true;
      s.factions[f].flags.early_sarkar = true;
      fx.legend(s, f, 10);
      if (isSikh(P(s))) fx.attitude(s, f, P(s), -5);
    },
  },

  // ── Ranjit Singh finds Lahore already held ─────────────────────────────────
  {
    id: 'ranjit_finds_lahore_held',
    title: 'The young Sukerchakia',
    gurmukhi: 'ਸ਼ੇਰ',
    kind: 'historical',
    from: { year: 1799 },
    to: { year: 1802, festival: 'diwali' },
    weight: 9,
    mood: 'neutral',
    when: (s) => P(s) !== 'sukerchakia' && owns(s, P(s), 'lahore') && !!s.factions.sukerchakia?.alive && leaderAlive(s, 'ranjit_singh') && s.leaders.ranjit_singh.faction === 'sukerchakia',
    text: (s) =>
      `Ranjit Singh of the Sukerchakias is nineteen, one-eyed from the smallpox, and already the most dangerous man in the Punjab. He looked to Lahore — and found ${polityName(s, P(s))} holding it. His vakil waits in your darbar.`,
    playerOnly: () => true,
    choices: [
      {
        label: 'Take him into your service',
        detail: 'Needs strength and the Panth’s trust (Miri ≥ his ×1.5, Piri ≥ 55). The Sukerchakia lands and armies join you; Ranjit becomes your general.',
        available: (s) => s.factions[P(s)].miri >= s.factions.sukerchakia.miri * 1.5 && s.factions[P(s)].piri >= 55,
        effect: (s) => {
          const p = P(s);
          for (const r of regionsOf(s, 'sukerchakia')) fx.give(s, r, p, 70);
          for (const a of Object.values(s.armies)) if (a.owner === 'sukerchakia') a.owner = p;
          for (const l of Object.values(s.leaders)) if (l.faction === 'sukerchakia' && l.alive) l.faction = p;
          s.factions.sukerchakia.alive = false;
          fx.loyalty(s, 'ranjit_singh', 20);
          fx.legend(s, p, 10);
          return 'Ranjit Singh bowed in your darbar. The Lion of the Punjab would hunt for you — while his loyalty lasted.';
        },
      },
      {
        label: 'Make him an ally, sealed by marriage',
        detail: 'Alliance with the Sukerchakias; no war over Lahore for now.',
        effect: (s) => {
          fx.relation(s, P(s), 'sukerchakia', 'alliance');
          fx.attitude(s, 'sukerchakia', P(s), 30);
          return 'A marriage was arranged. The two houses rode together — for now.';
        },
      },
      {
        label: 'Turn him away',
        detail: 'He will come for Lahore himself.',
        effect: (s) => {
          fx.relation(s, P(s), 'sukerchakia', 'war');
          fx.attitude(s, 'sukerchakia', P(s), -40);
          return 'The vakil left without a word. By the next season the Sukerchakia horse was on the road to Lahore.';
        },
      },
    ],
    aiChoice: 2,
  },

  // ── Cities history never gave the Khalsa ───────────────────────────────────
  capture('alt_delhi', 'delhi', 'The Khalsa holds Delhi', 'In 1783 Baghel Singh rode into Delhi, raised gurdwaras at the places of the Gurus’ memory, and went home with a share of the city’s taxes. This time {polity} has stayed. The emperor in the Red Fort looks out on a Nishan Sahib.', { legend: 10, piri: 2 }),
  capture('alt_agra', 'agra', 'The road to Agra', '{polity} holds Agra, where Guru Tegh Bahadur Ji was arrested in 1675. The great tomb on the Yamuna is guarded, not looted; the Panth remembers what Agra once took from it.', { piri: 3 }),
  capture('alt_patna', 'bihar', 'Patna Sahib', 'The banner of {polity} flies over Patna, where Guru Gobind Singh Ji was born. Pilgrims who walked a thousand miles from the Punjab now walk on Khalsa land.', { piri: 6, legend: 8 }),
  capture('alt_hazur', 'nanded', 'Hazur Sahib', 'Nanded on the Godavari — where Guru Gobind Singh Ji gave the Guruship to the Granth — is held by {polity}. The Takht that history left in the Nizam’s country is the Khalsa’s own.', { piri: 6, legend: 8 }),
  capture('alt_kabul', 'kabul', 'The Khalsa at Kabul', 'For seventy years the Afghan kings came down the passes to the Punjab. Now {polity} has gone up them. The Bala Hisar of Kabul flies a Nishan Sahib; the dharamsal of Guru Nanak Dev Ji in the bazaar is open and full.', { legend: 14 }),
  capture('alt_kandahar', 'kandahar', 'Kandahar', '{polity} holds Kandahar, where Ahmad Shah lies buried. The tomb is left untouched: the Khalsa does not war on the dead.', { legend: 10, piri: 2 }),
  capture('alt_herat', 'herat', 'The gates of Herat', 'Herat, the pearl of Khurasan, opens its gates to {polity}. No Punjabi army has stood here since the Ghaznavids marched the other way.', { legend: 10 }),
  capture('alt_lhasa', 'lhasa', 'Beneath the Potala', 'Where Zorawar Singh died in the snows, {polity} has marched on. The Potala is not touched; the monks are left to their prayers, and the Khalsa asks only the road and the trade in shawl-wool.', { legend: 12, piri: 2 }),
  capture('alt_calcutta', 'calcutta', 'Fort William', 'The Company’s own fortress on the Hooghly has fallen to {polity}. In London, the directors read the despatch twice.', { legend: 16 }),
  capture('alt_sindh', 'thatta', 'To the sea', '{polity} has followed the Indus to its mouth. Ships from Muscat and Basra now pay their dues to the Khalsa.', { legend: 8 }),

  // ── Zorawar Singh's Tibet campaign, 1841 ───────────────────────────────────
  {
    id: 'zorawar_tibet',
    title: 'Zorawar Singh in Tibet',
    kind: 'historical',
    from: { year: 1841 },
    to: { year: 1842, festival: 'vaisakhi' },
    weight: 7,
    mood: 'ominous',
    when: (s) => !!s.factions.jammu?.alive && owns(s, 'jammu', 'ladakh') && !owns(s, P(s), 'ngari'),
    text: () =>
      'In May, Zorawar Singh, Gulab Singh’s general and the conqueror of Ladakh and Baltistan, marches up the Indus into Ngari with some five thousand men, takes Taklakot and looks toward Lhasa. Winter is coming on the plateau.',
    playerOnly: (s) => sarkarOf(s) === P(s),
    choices: [
      {
        label: 'Send winter stores and fresh men (₹30k)',
        detail: 'A chance to hold Ngari for the Darbar through the winter.',
        available: (s) => s.factions[P(s)].treasury >= 30,
        effect: (s) => {
          fx.money(s, P(s), -30);
          if (chance(s, 0.55)) {
            fx.give(s, 'ngari', P(s), 40);
            fx.legend(s, P(s), 8);
            return 'Warm clothing and grain reached the army before the snows. Zorawar Singh held Taklakot through the winter, and Ngari stayed with the Darbar.';
          }
          chronicle(s, 'death', 'Zorawar Singh fell at To-yo in December 1841, his army frozen and outnumbered.', { weight: 7, region: 'ngari' });
          return 'The stores came too late. At To-yo, in the December snow, Zorawar Singh fell with most of his men.';
        },
      },
      {
        label: 'Leave it to the Dogras',
        detail: 'As history went: the campaign ends in the snow at To-yo.',
        effect: (s) => {
          chronicle(s, 'death', 'Zorawar Singh fell at To-yo in December 1841, his army frozen and outnumbered.', { weight: 7, region: 'ngari' });
          return 'At To-yo, in the December snow, Zorawar Singh fell with most of his men. The Treaty of Chushul in 1842 restored the old frontier.';
        },
      },
    ],
    aiChoice: 1,
  },
];
