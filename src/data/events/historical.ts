// Scripted history, 1748–1849. Each event has a short sourced note in HISTORY.md.
// History happens by default ("the current of history"), but conditions let it be
// bent: an event whose preconditions no longer hold simply does not fire, and
// several events give the player a real choice.

import { REGION_BY_ID } from '../regions';
import { desecrate, triggerJosh } from '../../engine/josh';
import { armiesIn, armiesOf, armyMen, isSikh, polityName, regionsOf } from '../../engine/query';
import { chance } from '../../engine/rng';
import type { GameState } from '../../engine/state';
import { alive, fx, leaderAlive, owns, P, regionCount, sikhFactions, sikhOwner, strength, strongestSikh } from './fx';
import type { EventDef } from './types';

const isPlayerSikh = (s: GameState) => isSikh(P(s));
const playerNear = (s: GameState, regions: string[]) => armiesOf(s, P(s)).some((a) => regions.includes(a.region)) || regions.some((r) => owns(s, P(s), r));

export const HISTORICAL: EventDef[] = [
  // ── 1748–1753: Mir Mannu ───────────────────────────────────────────────
  {
    id: 'ram_rauni',
    title: 'The siege of Ram Rauni',
    kind: 'historical',
    from: { year: 1748, festival: 'diwali' },
    to: { year: 1749, festival: 'vaisakhi' },
    mood: 'heroic',
    when: (s) => alive(s, 'mughal') && !isSikh(s.regions.lahore.owner),
    text: () =>
      'Mir Mannu, new to Lahore, sends Adina Beg’s horse against the little mud fort of Ram Rauni at Amritsar, where five hundred Singhs have taken shelter. Four months they hold it, eating what the villages smuggle in at night.',
    playerOnly: (s) => isPlayerSikh(s),
    choices: [
      {
        label: 'Send riders to break the siege',
        detail: 'Costs men and money; Piri and Legend rise. The Ramgarhia name is born here.',
        effect: (s) => {
          fx.losses(s, P(s), 0.08);
          fx.money(s, P(s), -6);
          fx.piri(s, P(s), 3, 'Relieving Ram Rauni');
          fx.legend(s, P(s), 3);
          if (alive(s, 'ramgarhia')) fx.legend(s, 'ramgarhia', 3);
          return 'The siege was broken when Kaura Mal, the Diwan, counselled terms; the Singhs rode out with their arms.';
        },
      },
      {
        label: 'Keep your jatha in the jungle',
        detail: 'No losses, but others carry the honour.',
        effect: (s) => {
          if (alive(s, 'ramgarhia')) fx.legend(s, 'ramgarhia', 4);
          fx.piri(s, P(s), -1, 'Standing aside at Ram Rauni');
          return 'Others held Ram Rauni without you.';
        },
      },
    ],
    aiChoice: 0,
  },
  {
    id: 'mannu_persecution',
    title: 'Mir Mannu’s persecution',
    kind: 'historical',
    from: { year: 1749, festival: 'diwali' },
    to: { year: 1750, festival: 'diwali' },
    mood: 'solemn',
    when: (s) => leaderAlive(s, 'mir_mannu') && alive(s, 'mughal'),
    text: () =>
      'Hear it, and do not forget. The subahdar puts a price on every Sikh head. Moving columns hunt the villages; the wells are watched. Mothers grind the millstones in the Lahore prisons and do not give up their faith.',
    effect: (s) => {
      for (const f of sikhFactions(s)) {
        for (const r of regionsOf(s, f)) if (['bari', 'rachna'].includes(REGION_BY_ID[r].doab)) fx.control(s, r, -15);
        fx.piri(s, f, 1, 'Enduring the persecution');
      }
      fx.flag(s, 'mughal', 'persecution', s.turn + 4);
    },
  },
  {
    id: 'mannu_submits',
    title: 'Lahore under the Durrani',
    kind: 'historical',
    from: { year: 1752, festival: 'vaisakhi' },
    to: { year: 1752, festival: 'diwali' },
    when: (s) => s.regions.lahore.owner === 'mughal' && alive(s, 'durrani'),
    text: () => 'After the third invasion Mir Mannu submits: he will govern Lahore and Multan in the name of Ahmad Shah. The Punjab now pays its revenue to Kandahar.',
    effect: (s) => {
      for (const r of ['lahore', 'multan', 'sialkot', 'gujrat', 'wazirabad', 'sheikhupura', 'ramnagar', 'bhera', 'jhang', 'kamalia', 'pakpattan', 'dipalpur'])
        if (owns(s, 'mughal', r)) fx.give(s, r, 'durrani', 60);
      for (const a of armiesOf(s, 'mughal')) if (['lahore', 'multan', 'sialkot'].includes(a.region)) a.owner = 'durrani';
      if (s.leaders.mir_mannu) s.leaders.mir_mannu.faction = 'durrani';
    },
  },
  {
    id: 'mannu_dies',
    title: 'The death of Mir Mannu',
    kind: 'historical',
    from: { year: 1753, festival: 'diwali' },
    to: { year: 1754, festival: 'vaisakhi' },
    text: () => 'Mir Mannu is thrown by his horse and dies. In the confusion that follows, the jathas come out of the jungles, and village after village asks the Khalsa for rakhi.',
    effect: (s) => {
      if (leaderAlive(s, 'mir_mannu')) fx.kill(s, 'mir_mannu', 'was killed by a fall from his horse');
      for (const f of sikhFactions(s)) fx.flag(s, f, 'rakhi_boom', s.turn + 6);
      return 'Rakhi will be easier to win for a time.';
    },
  },

  // ── 1757: the desecration and Baba Deep Singh ────────────────────────────
  {
    id: 'desecration_1757',
    title: 'The desecration of Amritsar',
    gurmukhi: 'ਬੇਅਦਬੀ',
    kind: 'historical',
    from: { year: 1757, festival: 'vaisakhi' },
    to: { year: 1757, festival: 'vaisakhi' },
    mood: 'solemn',
    weight: 9,
    when: (s) => alive(s, 'durrani') && strength(s, 'durrani') > 8000 && !s.regions.amritsar.desecrated.length && s.regions.amritsar.owner !== s.playerFaction,
    text: (s) =>
      sikhOwner(s, 'amritsar')
        ? 'Prince Timur and Jahan Khan, governing for the Durrani king, send their horse to Amritsar. The Singhs who keep it are too few.'
        : 'Jahan Khan, governor for the Durrani prince at Lahore, rides into Amritsar.',
    effect: (s) => {
      if (s.regions.amritsar.owner !== 'durrani') fx.give(s, 'amritsar', 'durrani', 40);
      desecrate(s, 'amritsar', 'durrani');
      if (leaderAlive(s, 'jahan_khan')) s.josh.vengeanceLeader = 'jahan_khan';
      return 'The Harmandir has been defiled. The Panth will answer.';
    },
  },
  {
    id: 'baba_deep_singh',
    title: 'Baba Deep Singh rides for Amritsar',
    gurmukhi: 'ਬਾਬਾ ਦੀਪ ਸਿੰਘ',
    kind: 'historical',
    from: { year: 1757, festival: 'diwali' },
    to: { year: 1757, festival: 'diwali' },
    mood: 'solemn',
    weight: 10,
    when: (s) => leaderAlive(s, 'baba_deep_singh') && s.regions.amritsar.desecrated.length > 0,
    text: () =>
      'Hush. The dhadd beats slowly now. At Damdama Sahib an old man, past seventy-five, a scholar who copied the sacred volumes with his own hand, hears what has been done at Amritsar. He takes up his sword. He draws a line on the ground and asks who will cross it with him. The whole village crosses.',
    playerOnly: (s) => P(s) === 'shaheedan',
    choices: [
      {
        label: 'Ride with him to Amritsar',
        detail: 'The march of the martyrs. This cannot be bargained with: it is how the history went.',
        effect: (s) => martyrdomOfBabaDeepSingh(s),
      },
    ],
    aiChoice: 0,
    chronicleText: () => 'Baba Deep Singh rode from Damdama Sahib to free Amritsar, and fell fighting at its threshold',
  },

  // ── 1758–1761: the Marathas and Panipat ──────────────────────────────────
  {
    id: 'marathas_lahore',
    title: 'The Marathas at Lahore',
    kind: 'historical',
    from: { year: 1758, festival: 'vaisakhi' },
    to: { year: 1758, festival: 'diwali' },
    mood: 'ominous',
    when: (s) => !s.factions.maratha.alive && s.regions.lahore.owner !== s.playerFaction,
    text: () =>
      'Invited by Adina Beg, the Maratha horse under Raghunath Rao sweep up from Delhi. Sirhind falls; Lahore falls; Maratha outposts reach Attock. The Afghans flee across the Indus, and for a season the Sikh jathas ride beside the Marathas.',
    effect: (s) => {
      fx.spawn(s, 'maratha', 'panipat', [['maratha_cav', 25000], ['piyada', 8000], ['top', 300]], { leader: leaderAlive(s, 'raghunath_rao') ? 'raghunath_rao' : undefined, name: 'Maratha army', withdrawTurn: s.turn + 2, home: 'delhi' });
      for (const r of ['delhi', 'panipat', 'saharanpur', 'hansi']) if (!sikhOwner(s, r)) fx.give(s, r, 'maratha', 55);
      for (const r of ['sirhind', 'lahore']) if (!sikhOwner(s, r) && s.regions[r].owner !== s.playerFaction) fx.give(s, r, 'maratha', 40);
      fx.relation(s, 'maratha', 'durrani', 'war');
      for (const f of sikhFactions(s)) fx.relation(s, 'maratha', f, 'peace');
    },
  },
  {
    id: 'panipat',
    title: 'Panipat',
    kind: 'historical',
    from: { year: 1760, festival: 'diwali' },
    to: { year: 1760, festival: 'diwali' },
    mood: 'ominous',
    weight: 7,
    when: (s) => alive(s, 'maratha') && alive(s, 'durrani'),
    text: () =>
      'At Panipat, in the cold of January, Ahmad Shah meets the whole power of the Marathas. By nightfall it is over: tens of thousands lie on the field, and the Maratha dream of the north is broken.',
    effect: (s) => {
      for (const a of armiesOf(s, 'maratha')) delete s.armies[a.id];
      for (const r of regionsOf(s, 'maratha')) fx.give(s, r, ['delhi', 'saharanpur', 'panipat', 'hansi'].includes(r) ? 'mughal' : 'durrani', 40);
      s.factions.maratha.alive = false;
      // The victor’s army comes home laden with captives.
      const d = armiesOf(s, 'durrani').sort((a, b) => armyMen(b) - armyMen(a))[0];
      if (d) {
        d.baggage = { plunder: (d.baggage?.plunder ?? 0) + 120, captives: (d.baggage?.captives ?? 0) + 2200 };
        d.region = 'panipat';
        d.withdrawTurn = s.turn + 1;
        d.home = 'peshawar';
      }
    },
  },
  {
    id: 'panipat_captives',
    title: 'The captives of Panipat',
    kind: 'historical',
    from: { year: 1761, festival: 'vaisakhi' },
    to: { year: 1761, festival: 'vaisakhi' },
    mood: 'heroic',
    weight: 7,
    when: (s) => Object.values(s.armies).some((a) => a.owner === 'durrani' && (a.baggage?.captives ?? 0) > 500),
    text: () =>
      'Up the Grand Trunk Road comes the Afghan army, slow with plunder, and in its baggage train walk two thousand women taken at Panipat and Delhi. At the river crossings the Sikh jathas wait in the reeds.',
    playerOnly: (s) => isPlayerSikh(s) && armiesOf(s, P(s)).some((a) => armyMen(a) >= 800),
    choices: [
      {
        label: 'Strike the baggage train by night',
        detail: 'Risk your horsemen to free the captives and return them home. A great gain in Piri if it succeeds.',
        effect: (s) => {
          const mine = armiesOf(s, P(s)).sort((a, b) => armyMen(b) - armyMen(a))[0];
          const ok = chance(s, Math.min(0.85, 0.35 + armyMen(mine) / 8000));
          fx.losses(s, P(s), ok ? 0.06 : 0.15, new Set([mine.region]));
          const d = Object.values(s.armies).find((a) => a.owner === 'durrani' && (a.baggage?.captives ?? 0) > 0);
          if (ok) {
            const freed = Math.round((d?.baggage?.captives ?? 2200) * 0.85);
            if (d?.baggage) d.baggage.captives -= freed;
            fx.piri(s, P(s), 7, 'Freeing the captives of Panipat');
            fx.legend(s, P(s), 6);
            return `By night the jathas fell on the camp and freed ${freed.toLocaleString()} captives, who were escorted to their homes.`;
          }
          fx.piri(s, P(s), 1, 'Daring to free the captives');
          return 'The camp was ready for you. Few were freed, and many good riders fell.';
        },
      },
      {
        label: 'Let the army pass',
        detail: 'Keep your strength. Others will try.',
        effect: (s) => {
          fx.piri(s, P(s), -1, 'Letting the captives pass');
          return 'Other jathas struck the baggage train; the dhadis do not name you among them.';
        },
      },
    ],
    aiChoice: 0,
  },

  // ── 1762: the Vadda Ghallughara ──────────────────────────────────────────
  {
    id: 'vadda_ghallughara',
    title: 'The Vadda Ghallughara',
    gurmukhi: 'ਵੱਡਾ ਘੱਲੂਘਾਰਾ',
    kind: 'historical',
    from: { year: 1761, festival: 'diwali' },
    to: { year: 1761, festival: 'diwali' },
    mood: 'solemn',
    weight: 10,
    when: (s) => alive(s, 'durrani') && sikhFactions(s).length > 0,
    text: () =>
      'Hush, and let the dhadd be still. In the cold of February the Afghan king marches day and night from Lahore and falls upon the Khalsa near Kup, by Malerkotla. The jathas are moving their families south to safety — old men, women, children, the baggage of a whole people. There is no time to scatter.',
    playerOnly: (s) => isPlayerSikh(s),
    choices: [
      {
        label: 'Form the vahir: ring the families and fight on the march to Barnala',
        detail: 'The way the Khalsa chose. Very heavy losses to your army; your people are shielded. Piri and Legend endure.',
        effect: (s) => ghallugharaOutcome(s, 'vahir'),
      },
      {
        label: 'Scatter the jathas into the countryside',
        detail: 'Your horsemen survive better; the families pay for it. A heavy Piri cost.',
        effect: (s) => ghallugharaOutcome(s, 'scatter'),
      },
      {
        label: 'Turn and give battle at Kup',
        detail: 'Against the whole Afghan army in the open. Ruinous unless you are very strong.',
        effect: (s) => ghallugharaOutcome(s, 'stand'),
      },
    ],
    aiChoice: 0,
    chronicleText: () => 'In the Vadda Ghallughara near Kup, February 1762, the Khalsa and its families were caught by Ahmad Shah',
  },
  {
    id: 'harmandir_destroyed_1762',
    title: 'The Harmandir blown up',
    kind: 'historical',
    from: { year: 1762, festival: 'vaisakhi' },
    to: { year: 1762, festival: 'vaisakhi' },
    mood: 'solemn',
    weight: 9,
    when: (s) => alive(s, 'durrani') && s.regions.amritsar.owner !== s.playerFaction && !s.regions.amritsar.desecrated.length,
    text: () => 'At Vaisakhi the Afghan king comes to Amritsar. The Harmandir is blown up with gunpowder and the sacred pool filled with rubble. It is said a flying brick struck the king and the wound never healed.',
    effect: (s) => {
      if (s.regions.amritsar.owner !== 'durrani') fx.give(s, 'amritsar', 'durrani', 40);
      desecrate(s, 'amritsar', 'durrani');
      if (leaderAlive(s, 'ahmad_shah')) s.josh.vengeanceLeader = 'ahmad_shah';
    },
  },
  {
    id: 'diwali_1762',
    title: 'Diwali at Amritsar, 1762',
    kind: 'historical',
    from: { year: 1762, festival: 'diwali' },
    to: { year: 1762, festival: 'diwali' },
    mood: 'heroic',
    weight: 7,
    when: (s) => sikhFactions(s).length > 0 && alive(s, 'durrani'),
    text: () =>
      'Eight months after the Ghallughara, at Diwali, sixty thousand Sikhs gather at ruined Amritsar. Ahmad Shah, who thought them finished, comes out to meet them. All day they fight; at nightfall the Afghan army slips away to Lahore. The dhadis sing: the Khalsa is not dead.',
    effect: (s) => {
      for (const f of sikhFactions(s)) {
        fx.legend(s, f, 2);
        fx.piri(s, f, 2, 'The Khalsa stands again at Amritsar');
      }
      triggerJosh(s, 'durrani');
      for (const a of armiesOf(s, 'durrani')) a.morale = Math.max(20, a.morale - 25);
      if (s.regions.amritsar.owner === 'durrani') {
        const taker = sikhFactions(s).includes(P(s)) && playerNear(s, ['amritsar', 'batala', 'kapurthala', 'lahore']) ? P(s) : strongestSikh(s);
        if (taker) fx.give(s, 'amritsar', taker, 40);
      }
    },
  },

  // ── 1764–1767: Sirhind, Lahore, the coin, the last invasions ─────────────
  {
    id: 'sirhind_1764',
    title: 'The fall of Sirhind',
    kind: 'historical',
    from: { year: 1763, festival: 'diwali' },
    to: { year: 1764, festival: 'vaisakhi' },
    weight: 7,
    mood: 'heroic',
    when: (s) => !sikhOwner(s, 'sirhind') && sikhFactions(s).length >= 3,
    text: () =>
      'In January the Dal Khalsa falls upon Sirhind, the city where the young Sahibzadas were bricked up alive sixty years before. Its faujdar Zain Khan dies on the field. The city is taken, and the Panth decides who shall hold it.',
    playerOnly: (s) => isPlayerSikh(s) && P(s) !== 'phulkian' && playerNear(s, ['sirhind', 'ludhiana', 'patiala', 'ambala', 'malerkotla', 'nabha', 'anandpur']),
    choices: [
      {
        label: 'Leave Sirhind to Ala Singh, as the Panth decides',
        detail: 'Sirhind goes to the Phulkian house. You share the spoils of the campaign and gain Piri.',
        effect: (s) => {
          fx.give(s, 'sirhind', alive(s, 'phulkian') ? 'phulkian' : strongestSikh(s), 45);
          fx.money(s, P(s), 25);
          fx.piri(s, P(s), 2, 'Honouring the Panth’s division of Sirhind');
          return 'Sirhind went to Baba Ala Singh. Fatehgarh Sahib was honoured.';
        },
      },
      {
        label: 'Claim Sirhind for yourself',
        detail: 'Rich land, but the Phulkians and the Panth will remember.',
        effect: (s) => {
          fx.give(s, 'sirhind', P(s), 35);
          fx.piri(s, P(s), -3, 'Claiming Sirhind against the Panth’s will');
          fx.attitude(s, 'phulkian', P(s), -40);
          return 'You took Sirhind. The Phulkians did not forget.';
        },
      },
    ],
    aiChoice: 0,
    effect: (s) => {
      if (leaderAlive(s, 'zain_khan')) fx.kill(s, 'zain_khan', 'fell at Sirhind');
    },
  },
  {
    id: 'gurbakhsh_singh_1764',
    title: 'The thirty at the Harmandir',
    kind: 'historical',
    from: { year: 1764, festival: 'diwali' },
    to: { year: 1764, festival: 'diwali' },
    mood: 'solemn',
    weight: 8,
    when: (s) => leaderAlive(s, 'gurbakhsh_singh_nihang') && alive(s, 'durrani'),
    text: () =>
      'When the Afghan army comes again to Amritsar, Gurbakhsh Singh Nihang and thirty companions are there to meet it. They do not ask how many are coming. They fall at the threshold, and the Afghan chronicler who rode with the king wrote of their courage.',
    effect: (s) => {
      fx.kill(s, 'gurbakhsh_singh_nihang', 'fell with thirty companions defending the Harmandir');
      for (const f of sikhFactions(s)) fx.piri(s, f, 1, 'The thirty at the Harmandir');
      if (alive(s, 'shaheedan')) fx.legend(s, 'shaheedan', 4);
    },
  },
  {
    id: 'lahore_1765',
    title: 'Lahore taken; the Khalsa coin',
    kind: 'historical',
    from: { year: 1765, festival: 'vaisakhi' },
    to: { year: 1765, festival: 'diwali' },
    weight: 7,
    mood: 'festive',
    when: (s) => !sikhOwner(s, 'lahore') && alive(s, 'bhangi') && s.regions.lahore.owner !== s.playerFaction,
    text: () =>
      'Lahore opens to three sardars — Gujjar Singh and Lehna Singh of the Bhangis, and Sobha Singh of the Kanhaiyas. They forbid plunder, and coins are struck in the name of the Gurus. The city has Sikh masters.',
    effect: (s) => {
      fx.give(s, 'lahore', 'bhangi', 55);
      fx.legend(s, 'bhangi', 5);
      fx.flag(s, 'bhangi', 'khalsa_coin', true);
      for (const a of armiesIn(s, 'lahore')) if (!isSikh(a.owner)) a.region = 'sheikhupura';
    },
  },
  {
    id: 'coin_player',
    title: 'Strike the Khalsa coin',
    kind: 'historical',
    from: { year: 1765, festival: 'vaisakhi' },
    to: { year: 1800, festival: 'diwali' },
    when: (s) => owns(s, P(s), 'lahore') && isPlayerSikh(s) && !s.factions[P(s)].flags.khalsa_coin,
    text: () => 'The mint at Lahore is yours. The sardars ask: in whose name shall the coin be struck?',
    choices: [
      {
        label: 'In the name of the Gurus, for the Khalsa',
        detail: 'As the misls did in 1765. Piri and Legend.',
        effect: (s) => {
          fx.flag(s, P(s), 'khalsa_coin', true);
          fx.piri(s, P(s), 3, 'Coins struck in the name of the Gurus');
          fx.legend(s, P(s), 4);
          return 'The new rupees went out to every bazaar.';
        },
      },
      {
        label: 'In your own name',
        detail: 'Prestige for your house; the Panth frowns.',
        effect: (s) => {
          fx.flag(s, P(s), 'khalsa_coin', 'own');
          fx.legend(s, P(s), 3);
          fx.piri(s, P(s), -4, 'Striking coins in a sardar’s own name');
          return 'Your name rang in the bazaars; the Akal Takht was silent.';
        },
      },
    ],
  },
  {
    id: 'afghan_tide_recedes',
    title: 'The Afghan tide recedes',
    kind: 'historical',
    from: { year: 1768, festival: 'vaisakhi' },
    to: { year: 1768, festival: 'vaisakhi' },
    when: (s) => alive(s, 'durrani'),
    text: () => 'Ahmad Shah is ailing, and his last expedition turned back at the Jhelum. Between the rivers the Afghan garrisons pack their baggage and go; the misls ride in behind them.',
    effect: (s) => {
      for (const r of regionsOf(s, 'durrani')) {
        if (['peshawar', 'derajat', 'kashmir', 'multan'].includes(REGION_BY_ID[r].doab) || r === 'attock') continue;
        // Give the land to the nearest strong Sikh neighbour, or to local chiefs.
        const neigh = sikhFactions(s).filter((f) => regionsOf(s, f).some((x) => REGION_BY_ID[x].doab === REGION_BY_ID[r].doab));
        const taker = neigh.sort((a, b) => s.factions[b].miri - s.factions[a].miri)[0] ?? null;
        fx.give(s, r, taker, 35);
      }
    },
  },
  {
    id: 'ahmad_shah_dies',
    title: 'The death of Ahmad Shah',
    kind: 'historical',
    from: { year: 1772, festival: 'vaisakhi' },
    to: { year: 1772, festival: 'diwali' },
    text: () => 'In the hills of Toba Maruf, Ahmad Shah Durrani dies of the wound that had eaten his face for years. His son Timur Shah moves the capital to Kabul.',
    effect: (s) => {
      if (leaderAlive(s, 'ahmad_shah')) fx.kill(s, 'ahmad_shah', 'died of a long illness');
    },
  },

  // ── 1770s–1790s: the misl wars ─────────────────────────────────────────
  {
    id: 'bhangi_multan',
    title: 'The Bhangis take Multan',
    kind: 'historical',
    from: { year: 1772, festival: 'vaisakhi' },
    to: { year: 1773, festival: 'diwali' },
    when: (s) => alive(s, 'bhangi') && !sikhOwner(s, 'multan') && P(s) !== 'bhangi' && strength(s, 'bhangi') > 5000,
    text: () => 'Jhanda Singh Bhangi rides south and takes Multan from its Afghan governor. The Bhangi banner flies from the Indus to the Ravi.',
    effect: (s) => fx.give(s, 'multan', 'bhangi', 40),
  },
  {
    id: 'timur_multan',
    title: 'Timur Shah retakes Multan',
    kind: 'historical',
    from: { year: 1780, festival: 'vaisakhi' },
    to: { year: 1780, festival: 'diwali' },
    when: (s) => alive(s, 'durrani') && owns(s, 'bhangi', 'multan'),
    text: () => 'Timur Shah comes down from Kabul and takes Multan back from the Bhangis, leaving it to an Afghan nawab.',
    effect: (s) => {
      s.factions.multan.alive = true;
      fx.give(s, 'multan', 'multan', 60);
      fx.spawn(s, 'multan', 'multan', [['mughal_cav', 2000], ['jezailchi', 2500]], { leader: leaderAlive(s, 'muzaffar_khan') ? 'muzaffar_khan' : undefined });
    },
  },
  {
    id: 'ramgarhia_exile',
    title: 'The exile of the Ramgarhias',
    kind: 'historical',
    from: { year: 1776, festival: 'vaisakhi' },
    to: { year: 1776, festival: 'diwali' },
    weight: 6,
    when: (s) => alive(s, 'ramgarhia') && alive(s, 'kanhaiya') && alive(s, 'ahluwalia'),
    text: () => 'Old quarrels boil over. The Ahluwalia, Kanhaiya and Sukerchakia chiefs combine against Jassa Singh Ramgarhia and drive him out of his lands, across the Sutlej to Hansi and Hisar.',
    playerOnly: (s) => P(s) === 'ramgarhia',
    choices: [
      {
        label: 'Go into exile across the Sutlej, and wait',
        detail: 'Lose your lands for now; keep your army; take Hansi. History says you will return.',
        effect: (s) => {
          for (const r of regionsOf(s, 'ramgarhia')) fx.give(s, r, 'kanhaiya', 40);
          fx.give(s, 'hansi', 'ramgarhia', 40);
          for (const a of armiesOf(s, 'ramgarhia')) a.region = 'hansi';
          fx.flag(s, 'ramgarhia', 'exiled', true);
          return 'The Ramgarhia jathas rode south to Hansi.';
        },
      },
      {
        label: 'Stand and fight the three misls',
        detail: 'War with the Kanhaiyas and Ahluwalias. Piri falls; your walls may hold.',
        effect: (s) => {
          for (const f of ['kanhaiya', 'ahluwalia', 'sukerchakia']) if (alive(s, f)) fx.relation(s, 'ramgarhia', f, 'war');
          fx.piri(s, 'ramgarhia', -3, 'War among the misls');
          return 'The misls marched on Ramgarhia lands.';
        },
      },
    ],
    aiChoice: 0,
  },
  {
    id: 'ramgarhia_return',
    title: 'Jassa Singh Ramgarhia returns',
    kind: 'historical',
    from: { year: 1783, festival: 'vaisakhi' },
    to: { year: 1784, festival: 'vaisakhi' },
    when: (s) => !!s.factions.ramgarhia.flags.exiled && alive(s, 'ramgarhia'),
    text: () => 'With help from the Sukerchakias, the old fort-builder comes home from exile and takes back his lands in the Doaba.',
    effect: (s) => {
      fx.flag(s, 'ramgarhia', 'exiled', false);
      if (!sikhOwner(s, 'hoshiarpur') || owns(s, 'kanhaiya', 'hoshiarpur')) fx.give(s, 'hoshiarpur', 'ramgarhia', 45);
    },
  },
  {
    id: 'baghel_singh_delhi',
    title: 'Baghel Singh in Delhi',
    kind: 'historical',
    from: { year: 1783, festival: 'vaisakhi' },
    to: { year: 1783, festival: 'diwali' },
    weight: 8,
    mood: 'heroic',
    when: (s) => alive(s, 'karorasinghia') && leaderAlive(s, 'baghel_singh') && !owns(s, 'company', 'delhi'),
    text: () =>
      'In March, Baghel Singh camps at Delhi with thirty thousand horse at the place still called Tis Hazari. The Emperor Shah Alam sends to treat. The sardar asks for no throne — only the sites where the Gurus’ history was made in the city.',
    playerOnly: (s) => P(s) === 'karorasinghia',
    choices: [
      {
        label: 'Ask for the gurdwara sites and a share of the octroi',
        detail: 'As history went: gurdwaras rise at Sis Ganj, Rakab Ganj and Bangla Sahib. Great Piri and Legend.',
        effect: (s) => {
          fx.money(s, P(s), 60);
          fx.piri(s, P(s), 8, 'Gurdwaras raised at the Delhi sites');
          fx.legend(s, P(s), 8);
          s.regions.delhi.buildings.push('gurdwara');
          return 'Gurdwaras rose where the martyrdom of Guru Tegh Bahadur Ji and the Sikhs’ history in Delhi were remembered.';
        },
      },
      {
        label: 'Plunder the capital',
        detail: 'A vast treasure. The Panth will not sing of it.',
        effect: (s) => {
          fx.money(s, P(s), 160);
          fx.piri(s, P(s), -8, 'Plundering Delhi');
          fx.devastate(s, 'delhi', 0.3);
          return 'Delhi was stripped.';
        },
      },
    ],
    aiChoice: 0,
    effect: (s) => {
      if (P(s) !== 'karorasinghia') {
        fx.legend(s, 'karorasinghia', 8);
        s.regions.delhi.buildings.push('gurdwara');
      }
    },
  },
  {
    id: 'battle_achal',
    title: 'The battle of Achal',
    kind: 'historical',
    from: { year: 1785, festival: 'vaisakhi' },
    to: { year: 1785, festival: 'diwali' },
    when: (s) => alive(s, 'kanhaiya') && alive(s, 'sukerchakia') && leaderAlive(s, 'gurbakhsh_kanhaiya'),
    text: () => 'Near Batala the Kanhaiyas meet Maha Singh Sukerchakia and the returned Ramgarhias. Gurbakhsh Singh, heir of the Kanhaiyas, falls in the fighting. His widow, Sada Kaur, does not weep in public.',
    effect: (s) => {
      fx.kill(s, 'gurbakhsh_kanhaiya', 'fell in battle near Batala');
      if (s.leaders.sada_kaur) s.leaders.sada_kaur.active = true;
      fx.relation(s, 'kanhaiya', 'sukerchakia', 'war');
    },
  },
  {
    id: 'sada_kaur_alliance',
    title: 'Sada Kaur’s alliance',
    gurmukhi: 'ਸਦਾ ਕੌਰ',
    kind: 'historical',
    from: { year: 1786, festival: 'vaisakhi' },
    to: { year: 1787, festival: 'diwali' },
    weight: 6,
    when: (s) => alive(s, 'kanhaiya') && alive(s, 'sukerchakia') && leaderAlive(s, 'sada_kaur') && leaderAlive(s, 'ranjit_singh'),
    text: () => 'Sada Kaur, who lost her husband to the Sukerchakias, proposes the unthinkable: her daughter Mehtab Kaur shall marry Maha Singh’s young son Ranjit. Enemies become kin.',
    playerOnly: (s) => P(s) === 'kanhaiya' || P(s) === 'sukerchakia',
    choices: [
      {
        label: 'Seal the marriage alliance',
        detail: 'Peace and alliance between the Kanhaiyas and Sukerchakias. The Kanhaiya marriage bonus applies.',
        effect: (s) => {
          fx.relation(s, 'kanhaiya', 'sukerchakia', 'alliance');
          fx.attitude(s, 'kanhaiya', 'sukerchakia', 60);
          fx.attitude(s, 'sukerchakia', 'kanhaiya', 60);
          fx.flag(s, 'kanhaiya', 'marriage_sukerchakia', true);
          fx.flag(s, 'sukerchakia', 'marriage_kanhaiya', true);
          return 'The betrothal was made; the two houses rode as one.';
        },
      },
      {
        label: 'Refuse',
        detail: 'The feud goes on.',
        effect: (s) => {
          fx.attitude(s, 'kanhaiya', 'sukerchakia', -20);
          return 'The feud went on.';
        },
      },
    ],
    aiChoice: 0,
  },
  {
    id: 'ranjit_lahore',
    title: 'Ranjit Singh takes Lahore',
    kind: 'historical',
    from: { year: 1799, festival: 'vaisakhi' },
    to: { year: 1799, festival: 'diwali' },
    weight: 8,
    mood: 'heroic',
    when: (s) => alive(s, 'sukerchakia') && leaderAlive(s, 'ranjit_singh') && !owns(s, 'sukerchakia', 'lahore') && s.regions.lahore.owner !== s.playerFaction && strength(s, 'sukerchakia') > 4000,
    text: () =>
      'The citizens of Lahore — Muslim, Hindu and Sikh alike — have had enough of their quarrelling sardars. They send to the young Sukerchakia chief. In July, with Sada Kaur at his side, Ranjit Singh rides in through the Lohari Gate, and forbids his men to plunder.',
    playerOnly: (s) => P(s) === 'sukerchakia',
    choices: [
      {
        label: 'Ride in through the gate the citizens open',
        detail: 'Take Lahore without a sack. Piri rises; the city is yours.',
        effect: (s) => {
          fx.give(s, 'lahore', 'sukerchakia', 60);
          fx.piri(s, 'sukerchakia', 3, 'Taking Lahore without plunder');
          fx.legend(s, 'sukerchakia', 6);
          return 'Lahore welcomed its new master.';
        },
      },
      {
        label: 'Not yet',
        detail: 'Wait for a better moment. The invitation may not come again.',
        effect: () => 'The gates stayed shut.',
      },
    ],
    aiChoice: 0,
  },
  {
    id: 'maharaja_proclaimed',
    title: 'A Maharaja of the Punjab',
    gurmukhi: 'ਮਹਾਰਾਜਾ',
    kind: 'historical',
    from: { year: 1801, festival: 'vaisakhi' },
    to: { year: 1830, festival: 'diwali' },
    weight: 9,
    mood: 'festive',
    ctx: (s) => {
      if (Object.values(s.factions).some((f) => f.sarkar)) return null;
      const cand = strongestSikh(s);
      if (!cand || regionCount(s, cand) < 9 || !owns(s, cand, 'lahore')) return null;
      return { faction: cand };
    },
    text: (s, ctx) => `At Vaisakhi the sardars and the people of Lahore gather. The chief of ${polityName(s, String(ctx.faction))} is proclaimed Maharaja. The coin is struck in the name of the Gurus, and the government is called not by any man’s name but the Sarkar-i-Khalsa.`,
    playerOnly: (s, ctx) => ctx.faction === P(s),
    choices: [
      {
        label: 'Accept, as the servant of the Khalsa',
        detail: 'Become the Sarkar-i-Khalsa: regular armies, a darbar, an empire. You will be asked whether to keep calling the Sarbat Khalsa.',
        effect: (s, ctx) => {
          const f = String(ctx.faction);
          s.factions[f].sarkar = true;
          fx.legend(s, f, 10);
          fx.piri(s, f, 2, 'Proclaimed Maharaja in the name of the Khalsa');
          s.firedEvents.sarkar_turn = s.turn;
          return 'The Sarkar-i-Khalsa was born.';
        },
      },
    ],
    aiChoice: 0,
    effect: (s, ctx) => {
      const f = String(ctx.faction);
      if (f !== P(s)) {
        s.factions[f].sarkar = true;
        fx.legend(s, f, 10);
      }
      // Misls not of the Sarkar drift into its orbit or its wars.
      for (const g of sikhFactions(s)) if (g !== f && g !== P(s) && g !== 'phulkian') fx.attitude(s, g, f, 10);
    },
  },

  // ── 1803–1839: the Company and the Sarkar ────────────────────────────────
  {
    id: 'company_delhi',
    title: 'The Company takes Delhi',
    kind: 'historical',
    from: { year: 1803, festival: 'diwali' },
    to: { year: 1804, festival: 'vaisakhi' },
    mood: 'ominous',
    weight: 6,
    when: (s) => !owns(s, 'company', 'delhi'),
    text: () =>
      'Far to the south-east the East India Company breaks the Maratha armies at Delhi and Laswari. The Mughal emperor, old and blind, passes under its protection. A red line of ink touches the edge of the painting.',
    effect: (s) => {
      s.factions.company.alive = true;
      for (const r of ['delhi', 'panipat', 'saharanpur', 'hansi']) if (!owns(s, P(s), r)) fx.give(s, r, 'company', 60);
      if (s.factions.maratha.alive) {
        for (const a of armiesOf(s, 'maratha')) delete s.armies[a.id];
        s.factions.maratha.alive = false;
      }
      fx.spawn(s, 'company', 'delhi', [['sepoy', 12000], ['british_regular', 2000], ['company_cav', 3000], ['horse_artillery', 600]], { leader: leaderAlive(s, 'ochterlony') ? 'ochterlony' : undefined, name: 'Army of the Company' });
      s.factions.company.treasury += 1500;
    },
  },
  {
    id: 'kangra_gurkhas',
    title: 'The Gorkhas at Kangra',
    kind: 'historical',
    from: { year: 1806, festival: 'vaisakhi' },
    to: { year: 1806, festival: 'diwali' },
    when: (s) => s.regions.kangra.owner === 'kangra',
    text: () => 'Amar Singh Thapa leads the Gorkha army west along the hills and lays siege to the great fort of Kangra. Raja Sansar Chand is trapped inside.',
    effect: (s) => {
      s.factions.gurkha.alive = true;
      fx.relation(s, 'gurkha', 'kangra', 'war');
      if (!sikhOwner(s, 'sirmur')) fx.give(s, 'sirmur', 'gurkha', 50);
      fx.spawn(s, 'gurkha', 'kangra', [['gurkha', 12000], ['hill_levy', 4000]], { leader: leaderAlive(s, 'amar_singh_thapa') ? 'amar_singh_thapa' : undefined, stance: 'siege' });
      s.factions.gurkha.treasury += 150;
    },
  },
  {
    id: 'kangra_relief',
    title: 'Sansar Chand asks for help',
    kind: 'historical',
    from: { year: 1809, festival: 'vaisakhi' },
    to: { year: 1809, festival: 'diwali' },
    when: (s) => s.regions.kangra.owner === 'kangra' && alive(s, 'gurkha') && !!strongestSikh(s),
    text: (s) => `Starving in his fort, Raja Sansar Chand offers Kangra itself to ${polityName(s, strongestSikh(s))} in return for driving off the Gorkhas.`,
    playerOnly: (s) => strongestSikh(s) === P(s),
    choices: [
      {
        label: 'Relieve Kangra and take the fort',
        detail: 'The Gorkhas withdraw east; Kangra becomes yours.',
        effect: (s) => {
          const f = strongestSikh(s)!;
          fx.give(s, 'kangra', f, 45);
          for (const a of armiesOf(s, 'gurkha')) a.region = 'sirmur';
          fx.relation(s, f, 'gurkha', 'peace');
          fx.legend(s, f, 4);
          return 'The great fort of Kangra opened its gates.';
        },
      },
      { label: 'Stay out of the hills', effect: () => 'Kangra was left to its fate.' },
    ],
    aiChoice: 0,
  },
  {
    id: 'treaty_amritsar',
    title: 'The Treaty of Amritsar',
    kind: 'historical',
    from: { year: 1808, festival: 'diwali' },
    to: { year: 1809, festival: 'vaisakhi' },
    weight: 8,
    mood: 'ominous',
    ctx: (s) => {
      const f = strongestSikh(s);
      return f && alive(s, 'company') ? { faction: f } : null;
    },
    text: () =>
      'A young envoy of the Company, Charles Metcalfe, comes to Amritsar. His escort of sepoys clashes with Nihangs at Muharram; the Company’s troops gather on the Sutlej. His message is simple: the Sutlej shall be the line, and the Sikh chiefs south of it are under the Company’s protection.',
    playerOnly: (s, ctx) => ctx.faction === P(s),
    choices: [
      {
        label: 'Sign: the Sutlej is the line',
        detail: 'Peace and trade with the Company, which gains a foothold. The Cis-Sutlej chiefs pass under its protection.',
        effect: (s, ctx) => {
          const f = String(ctx.faction);
          signAmritsar(s, f);
          return 'The treaty was signed. The Sutlej became a frontier.';
        },
      },
      {
        label: 'Refuse, and ride south of the Sutlej',
        detail: 'The Company prepares for war. The Cis-Sutlej chiefs look to Delhi.',
        effect: (s, ctx) => {
          const f = String(ctx.faction);
          fx.flag(s, 'company', 'war_prep', s.turn);
          fx.attitude(s, 'company', f, -50);
          s.factions[f].flags.refused_company = Number(s.factions[f].flags.refused_company ?? 0) + 1;
          fx.spawn(s, 'company', 'ludhiana', [['sepoy', 6000], ['british_regular', 1000], ['horse_artillery', 300]], { leader: leaderAlive(s, 'ochterlony') ? 'ochterlony' : undefined, name: 'Ochterlony’s force' });
          if (!sikhOwner(s, 'ludhiana') || !owns(s, f, 'ludhiana')) fx.give(s, 'ludhiana', 'company', 50);
          return 'The Company’s columns moved up to Ludhiana.';
        },
      },
    ],
    aiChoice: 0,
  },
  {
    id: 'phulkian_protection',
    title: 'The Company offers protection',
    kind: 'historical',
    from: { year: 1809, festival: 'vaisakhi' },
    to: { year: 1809, festival: 'diwali' },
    when: (s) => P(s) === 'phulkian' && alive(s, 'company') && !s.factions.phulkian.flags.company_protection,
    text: () => 'The Company’s agent at Ludhiana offers the Phulkian houses its protection against Lahore. The price is foothold, and in time, obedience.',
    choices: [
      {
        label: 'Accept protection',
        detail: 'Safety from the Sarkar; the protected-state path. The Company gains foothold over you.',
        effect: (s) => {
          fx.flag(s, 'phulkian', 'company_protection', true);
          fx.relation(s, 'phulkian', 'company', 'alliance');
          s.factions.phulkian.foothold += 15;
          return 'Patiala, Nabha and Jind passed under the Company’s protection.';
        },
      },
      {
        label: 'Stand with the Panth',
        detail: 'Refuse the Company. Piri rises; the Sarkar is now your only shield.',
        effect: (s) => {
          fx.piri(s, 'phulkian', 4, 'Refusing foreign protection');
          return 'The Phulkian chiefs refused.';
        },
      },
    ],
  },
  {
    id: 'koh_i_noor',
    title: 'The Koh-i-Noor',
    gurmukhi: 'ਕੋਹਿਨੂਰ',
    kind: 'historical',
    from: { year: 1813, festival: 'vaisakhi' },
    to: { year: 1813, festival: 'diwali' },
    weight: 7,
    ctx: (s) => {
      const f = Object.values(s.factions).find((x) => x.sarkar)?.id ?? (owns(s, strongestSikh(s) ?? '', 'lahore') ? strongestSikh(s) : null);
      return f ? { faction: f } : null;
    },
    text: () => 'The exiled king Shah Shuja and his household are at Lahore, guests and something less than guests. The court whispers that his wife Wafa Begum still has the great diamond, the Mountain of Light.',
    playerOnly: (s, ctx) => ctx.faction === P(s),
    choices: [
      {
        label: 'Take the Koh-i-Noor into the Toshakhana',
        detail: 'A jewel beyond price for your treasury of prestige. Shah Shuja will not forgive it.',
        effect: (s, ctx) => {
          const f = String(ctx.faction);
          fx.flag(s, f, 'koh_i_noor', true);
          fx.legend(s, f, 6);
          fx.piri(s, f, -1, 'Pressing Shah Shuja for the diamond');
          return 'The Koh-i-Noor passed into the Toshakhana of Lahore.';
        },
      },
      {
        label: 'Leave the exiles their jewel',
        detail: 'A gentler hospitality. Piri rises.',
        effect: (s, ctx) => {
          fx.piri(s, String(ctx.faction), 2, 'Honouring the exiled king’s household');
          return 'Shah Shuja kept his diamond, and left for Ludhiana.';
        },
      },
    ],
    aiChoice: 0,
  },
  {
    id: 'attock_1813',
    title: 'The battle of Attock',
    kind: 'historical',
    from: { year: 1813, festival: 'diwali' },
    to: { year: 1814, festival: 'vaisakhi' },
    when: (s) => !!sarkarOf(s) && !owns(s, sarkarOf(s)!, 'attock') && strength(s, sarkarOf(s)!) > 15000,
    text: () => 'At Haidaru near Attock, Diwan Mokham Chand meets the Afghan army of Fateh Khan Barakzai in the July heat and breaks it. The fort that guards the Indus crossing passes to Lahore.',
    effect: (s) => {
      const f = sarkarOf(s)!;
      fx.give(s, 'attock', f, 50);
      fx.legend(s, f, 4);
      fx.relation(s, f, 'durrani', 'war');
    },
  },
  {
    id: 'multan_1818',
    title: 'The siege of Multan',
    kind: 'historical',
    from: { year: 1818, festival: 'vaisakhi' },
    to: { year: 1818, festival: 'diwali' },
    weight: 6,
    when: (s) => !!sarkarOf(s) && !owns(s, sarkarOf(s)!, 'multan') && strength(s, sarkarOf(s)!) > 20000,
    text: () => 'Misr Diwan Chand drags the great gun Zamzama to the walls of Multan. Nawab Muzaffar Khan, white-bearded, comes out with his sons to fight at the breach, and falls there.',
    effect: (s) => {
      const f = sarkarOf(s)!;
      fx.give(s, 'multan', f, 40);
      if (leaderAlive(s, 'muzaffar_khan')) fx.kill(s, 'muzaffar_khan', 'fell with his sons at the breach of Multan');
      fx.legend(s, f, 5);
      if (s.factions.multan.alive && !regionsOf(s, 'multan').length) s.factions.multan.alive = false;
    },
  },
  {
    id: 'kashmir_1819',
    title: 'Kashmir',
    kind: 'historical',
    from: { year: 1819, festival: 'vaisakhi' },
    to: { year: 1819, festival: 'diwali' },
    when: (s) => !!sarkarOf(s) && !owns(s, sarkarOf(s)!, 'srinagar') && strength(s, sarkarOf(s)!) > 20000,
    text: () => 'Over the Pir Panjal, Misr Diwan Chand and the young Kharak Singh lead the Sarkar’s army into the Vale of Kashmir. The Afghan governor flees; the shawl looms pass to Lahore.',
    effect: (s) => {
      const f = sarkarOf(s)!;
      for (const r of ['srinagar', 'muzaffarabad']) fx.give(s, r, f, 40);
      fx.legend(s, f, 5);
    },
  },
  {
    id: 'european_officers',
    title: 'Two Frenchmen at Lahore',
    kind: 'historical',
    from: { year: 1822, festival: 'vaisakhi' },
    to: { year: 1824, festival: 'diwali' },
    when: (s) => !!sarkarOf(s),
    text: () => 'Two veterans of Napoleon’s wars, Allard and Ventura, arrive at Lahore by way of Persia and Kabul, asking for service. They offer to drill a brigade in the European manner.',
    playerOnly: (s) => sarkarOf(s) === P(s),
    choices: [
      {
        label: 'Take them into service: raise the Fauj-i-Khas',
        detail: 'Unlocks the Fauj-i-Khas. European officers join the darbar.',
        effect: (s) => {
          const f = sarkarOf(s)!;
          fx.flag(s, f, 'european_officers', true);
          for (const id of ['ventura', 'allard']) if (s.leaders[id]) ((s.leaders[id].faction = f), (s.leaders[id].active = true));
          return 'The Fauj-i-Khas was raised under its own tricolour standards.';
        },
      },
      { label: 'Send them on their way', effect: () => 'The Frenchmen rode on.' },
    ],
    aiChoice: 0,
  },
  {
    id: 'nowshera_1823',
    title: 'Nowshera',
    kind: 'historical',
    from: { year: 1823, festival: 'vaisakhi' },
    to: { year: 1823, festival: 'diwali' },
    mood: 'solemn',
    weight: 8,
    when: (s) => !!sarkarOf(s) && leaderAlive(s, 'phula_singh'),
    text: () =>
      'On the Landai river at Nowshera the Sarkar meets the Afghan tribal levies. Akali Phula Singh, the old jathedar of the Akal Takht, will not wait for the guns to come up. He leads the Nihangs across the river on foot, and is shot in the saddle of his elephant. The field is won; the Akali is gone.',
    effect: (s) => {
      const f = sarkarOf(s)!;
      fx.kill(s, 'phula_singh', 'fell leading the Nihangs at Nowshera');
      fx.legend(s, f, 5);
      fx.attitude(s, 'durrani', f, -20);
    },
  },
  {
    id: 'peshawar_1834',
    title: 'Peshawar',
    kind: 'historical',
    from: { year: 1834, festival: 'vaisakhi' },
    to: { year: 1834, festival: 'diwali' },
    when: (s) => !!sarkarOf(s) && !owns(s, sarkarOf(s)!, 'peshawar') && strength(s, sarkarOf(s)!) > 25000,
    text: () => 'Hari Singh Nalwa rides into Peshawar. The city, long a tributary, is annexed to the Sarkar; the frontier is pushed to the mouth of the Khyber.',
    effect: (s) => {
      const f = sarkarOf(s)!;
      fx.give(s, 'peshawar', f, 40);
      fx.legend(s, f, 4);
    },
  },
  {
    id: 'jamrud_1837',
    title: 'Jamrud',
    kind: 'historical',
    from: { year: 1837, festival: 'vaisakhi' },
    to: { year: 1837, festival: 'diwali' },
    mood: 'solemn',
    weight: 8,
    when: (s) => leaderAlive(s, 'hari_singh_nalwa'),
    text: () =>
      'At Jamrud, at the very mouth of the Khyber, the Afghan army of Dost Mohammad’s son comes down on the new fort. Hari Singh Nalwa, ill in Peshawar, rises and rides to its relief. The fort holds. Its defender does not come home. They say the Afghans withdrew when they heard he had fallen, for fear of what he had been.',
    effect: (s) => {
      const f = s.leaders.hari_singh_nalwa?.faction;
      fx.kill(s, 'hari_singh_nalwa', 'fell defending Jamrud at the mouth of the Khyber');
      if (f) {
        fx.legend(s, f, 6);
        if (!owns(s, f, 'jamrud')) fx.give(s, 'jamrud', f, 40);
      }
    },
  },
];

function sarkarOf(s: GameState): string | undefined {
  return Object.values(s.factions).find((f) => f.sarkar && f.alive)?.id;
}

function signAmritsar(s: GameState, f: string) {
  fx.relation(s, f, 'company', 'peace');
  s.factions[f].foothold += 12;
  fx.flag(s, f, 'treaty_amritsar', true);
  for (const g of ['phulkian', 'malerkotla', 'nishanwalia', 'karorasinghia']) {
    if (g === f || !alive(s, g)) continue;
    if (!regionsOf(s, g).every((r) => ['malwa'].includes(REGION_BY_ID[r].doab))) continue;
    fx.relation(s, g, 'company', 'alliance');
    fx.flag(s, g, 'company_protection', true);
  }
  if (!owns(s, f, 'ludhiana')) fx.give(s, 'ludhiana', 'company', 50);
  fx.spawn(s, 'company', 'ludhiana', [['sepoy', 4000], ['british_regular', 600], ['horse_artillery', 200]], { name: 'Ludhiana cantonment' });
}

function martyrdomOfBabaDeepSingh(s: GameState): string {
  const shaheedan = 'shaheedan';
  // He gathers the jathas: a great host marches on Amritsar under maximum Josh.
  const army = Object.values(s.armies).find((a) => a.leader === 'baba_deep_singh');
  if (army) {
    army.region = 'amritsar';
    army.josh = 6;
  }
  for (const a of Object.values(s.armies)) if (isSikh(a.owner)) a.josh = Math.max(a.josh ?? 0, 6);
  s.josh.active = true;
  s.josh.turnsLeft = Math.max(s.josh.turnsLeft, 5);
  fx.kill(s, 'baba_deep_singh', 'fell at the threshold of Amritsar, his sword still in his hand');
  if (alive(s, shaheedan)) {
    fx.legend(s, shaheedan, 12);
    fx.piri(s, shaheedan, 6, 'The martyrdom of Baba Deep Singh');
    fx.flag(s, shaheedan, 'shaheed_jathas', true);
    fx.recruit(s, shaheedan, regionsOf(s, shaheedan)[0] ?? 'damdama', 'nihang', 1500);
  }
  for (const f of sikhFactions(s)) if (f !== shaheedan) fx.piri(s, f, 2, 'The example of Baba Deep Singh');
  // His jathas fall on the Afghan garrison; the city is freed if it is weakly held.
  const garrison = armiesIn(s, 'amritsar').filter((a) => !isSikh(a.owner)).reduce((t, a) => t + armyMen(a), 0);
  if (garrison < 6000 && s.regions.amritsar.owner && !isSikh(s.regions.amritsar.owner)) {
    for (const a of armiesIn(s, 'amritsar')) if (!isSikh(a.owner)) delete s.armies[a.id];
    fx.give(s, 'amritsar', alive(s, shaheedan) ? shaheedan : strongestSikh(s), 35);
    return 'The jathas broke into Amritsar behind him, and the sacred pool was cleared. The Panth will rebuild.';
  }
  return 'He fell at the threshold. The Afghan garrison held the city, but the whole Panth was on the march.';
}

function ghallugharaOutcome(s: GameState, choice: 'vahir' | 'scatter' | 'stand'): string {
  const p = P(s);
  // Preparation lessens the blow: armies away from Malwa, langar and rakhi in the Malwa villages, high Piri.
  const malwa = new Set(Object.keys(s.regions).filter((r) => REGION_BY_ID[r].doab === 'malwa'));
  const exposed = armiesOf(s, p).filter((a) => malwa.has(a.region)).reduce((t, a) => t + armyMen(a), 0);
  const total = Math.max(1, armiesOf(s, p).reduce((t, a) => t + armyMen(a), 0));
  const prepared = (s.factions[p].piri > 60 ? 0.1 : 0) + (Object.values(s.regions).some((r) => malwa.has(r.id) && (r.langar || r.rakhi === p) && r.owner === p) ? 0.05 : 0);
  const exposure = 0.45 + 0.55 * (exposed / total);
  let frac: number;
  let text: string;
  if (choice === 'vahir') {
    frac = Math.max(0.12, 0.38 * exposure - prepared);
    fx.piri(s, p, 3, 'Shielding the families in the vahir');
    fx.legend(s, p, 5);
    text = 'All day the moving ring fought on, the families at its heart, until the Afghans turned back near Barnala. Count the fallen; there are many. But the people lived.';
  } else if (choice === 'scatter') {
    frac = Math.max(0.06, 0.18 * exposure - prepared);
    fx.piri(s, p, -8, 'Leaving the families to the Afghan horse');
    text = 'The jathas scattered and lived. The families did not all live. The dhadis sing of the others.';
  } else {
    const strong = total > 40000;
    frac = strong ? 0.25 : Math.max(0.3, 0.6 * exposure - prepared);
    fx.legend(s, p, strong ? 8 : 3);
    fx.piri(s, p, 1, 'Turning to face the Afghan army at Kup');
    text = strong ? 'Your host was great enough to turn and fight; the Afghan king withdrew to Lahore. Still, the field was red.' : 'You turned to fight the whole Afghan army in the open. It was very brave. Few came back.';
  }
  const lost = fx.losses(s, p, frac);
  // Every other Sikh polity suffers by the same current of history.
  for (const f of sikhFactions(s)) if (f !== p) fx.losses(s, f, 0.25);
  if (leaderAlive(s, 'jassa_ahluwalia')) fx.loyalty(s, 'jassa_ahluwalia', 0); // wounded many times, survived
  for (const r of ['malerkotla', 'nabha', 'ludhiana', 'patiala']) fx.devastate(s, r, 0.3);
  return `${text} (${lost.toLocaleString()} of your riders fell.)`;
}

