// The Sarkar and its twilight, 1830–1849: the Company's treaties, the death of
// Ranjit Singh, the succession tragedies, the two Anglo-Sikh wars and annexation.
// Every link in the chain checks how well the polity was prepared, so the player
// can bend or avert it.

import { chronicle } from '../../engine/chronicle';
import { collapseRisk, courtStability, newCourt } from '../../engine/court';
import { armiesOf, armyMen, atWar, polityName, regionsOf } from '../../engine/query';
import { chance } from '../../engine/rng';
import type { GameState } from '../../engine/state';
import { alive, fx, leaderAlive, owns, P } from './fx';
import type { EventDef } from './types';

const sarkar = (s: GameState) => Object.values(s.factions).find((f) => f.sarkar && f.alive)?.id;
const playerIsSarkar = (s: GameState) => sarkar(s) === P(s);
const CORE = ['lahore', 'amritsar', 'kasur', 'jalandhar', 'kapurthala', 'hoshiarpur', 'gujranwala', 'sialkot'];

function crisisOn(s: GameState, f: string) {
  fx.flag(s, f, 'court_crisis', true);
  if (f === P(s) && s.court) s.court.crisis = true;
}

function warScore(s: GameState, f: string, since: number): number {
  let score = 0;
  for (const b of s.battles) {
    if (b.turn < since) continue;
    const involves = (b.attacker === f && b.defender === 'company') || (b.defender === f && b.attacker === 'company');
    if (!involves) continue;
    const won = (b.winner === 'attacker' && b.attacker === f) || (b.winner === 'defender' && b.defender === f);
    const lost = (b.winner === 'attacker' && b.attacker === 'company') || (b.winner === 'defender' && b.defender === 'company');
    score += won ? 1 : lost ? -1 : 0;
  }
  score -= CORE.filter((r) => owns(s, 'company', r)).length * 2;
  if (!owns(s, f, 'lahore')) score -= 3;
  return score;
}

function spawnCompanyArmy(s: GameState, size: number) {
  const base = ['ferozepur', 'ludhiana', 'ambala', 'delhi'].find((r) => owns(s, 'company', r)) ?? 'delhi';
  fx.spawn(s, 'company', base, [['sepoy', Math.round(size * 0.6)], ['british_regular', Math.round(size * 0.18)], ['company_cav', Math.round(size * 0.15)], ['horse_artillery', Math.round(size * 0.05)]], { leader: leaderAlive(s, 'gough') ? 'gough' : undefined, name: 'Army of the Sutlej', policy: 'nazrana' });
  s.factions.company.treasury += 2500;
}

export const LATE: EventDef[] = [
  {
    id: 'sarbat_after_sarkar',
    title: 'Shall the Sarbat Khalsa still be called?',
    kind: 'historical',
    from: { year: 1801, festival: 'vaisakhi' },
    to: { year: 1849, festival: 'vaisakhi' },
    weight: 6,
    when: (s) => playerIsSarkar(s) && s.factions[P(s)].flags.sarbat_decided === undefined,
    text: () =>
      'You rule now as the Sarkar-i-Khalsa. In the old days the misl chiefs met as equals before the Akal Takht twice a year. Some of your ministers say the assembly is a relic; the Nihangs say it is the Khalsa itself.',
    choices: [
      {
        label: 'Keep calling the Sarbat Khalsa',
        detail: 'Its gurmatas will bind even you. Piri rises now and every turn; the army’s panches stay loyal to the Panth rather than to themselves.',
        effect: (s) => {
          s.factions[P(s)].convenesSarbat = true;
          fx.flag(s, P(s), 'sarbat_decided', 'keep');
          fx.piri(s, P(s), 5, 'Keeping the Sarbat Khalsa');
          return 'Twice a year the Maharaja sat on the ground among the sardars.';
        },
      },
      {
        label: 'Let the assembly lapse; govern from the darbar',
        detail: 'A free hand and a stronger hold on Miri. Piri falls; the army may one day find its own voice.',
        effect: (s) => {
          s.factions[P(s)].convenesSarbat = false;
          fx.flag(s, P(s), 'sarbat_decided', 'lapse');
          fx.piri(s, P(s), -4, 'Letting the Sarbat Khalsa lapse');
          if (s.court) s.court.factions.panches.loyalty -= 10;
          return 'The great assembly was not called again.';
        },
      },
    ],
  },
  {
    id: 'indus_treaty',
    title: 'The Company asks to navigate the Indus',
    kind: 'historical',
    from: { year: 1832, festival: 'vaisakhi' },
    to: { year: 1833, festival: 'diwali' },
    when: (s) => !!sarkar(s) && alive(s, 'company'),
    text: () => 'Envoys of the Governor-General arrive with presents and a request: Company steamers would like to trade up the Indus and the Sutlej. Trade, they say, is all they want.',
    playerOnly: (s) => playerIsSarkar(s),
    choices: [
      { label: 'Sign the trade treaty', detail: 'Revenue from tolls; the Company gains a foothold.', effect: (s) => { const f = sarkar(s)!; fx.money(s, f, 80); s.factions[f].foothold += 10; return 'The steamers came, and with them surveyors.'; } },
      { label: 'Refuse politely', detail: 'The Company notes the refusal.', effect: (s) => { const f = sarkar(s)!; s.factions[f].flags.refused_company = Number(s.factions[f].flags.refused_company ?? 0) + 1; fx.attitude(s, 'company', f, -15); return 'The envoys went home with their presents.'; } },
    ],
    aiChoice: 0,
  },
  {
    id: 'tripartite',
    title: 'The Tripartite Treaty',
    kind: 'historical',
    from: { year: 1838, festival: 'vaisakhi' },
    to: { year: 1838, festival: 'diwali' },
    when: (s) => !!sarkar(s) && alive(s, 'company'),
    text: () => 'The Company means to put Shah Shuja back on the throne of Kabul, and wants the Sarkar’s blessing, its roads and its troops. In return: Peshawar confirmed, and a share of the glory.',
    playerOnly: (s) => playerIsSarkar(s),
    choices: [
      { label: 'Join the treaty', detail: 'Peshawar secure; Company armies march through your land. Foothold grows.', effect: (s) => { const f = sarkar(s)!; s.factions[f].foothold += 15; fx.attitude(s, 'company', f, 20); fx.relation(s, f, 'durrani', 'war'); return 'Company columns marched to Kabul by way of the Bolan.'; } },
      { label: 'Stay out of Kabul’s affairs', detail: 'The Company remembers. Peshawar is not guaranteed.', effect: (s) => { const f = sarkar(s)!; s.factions[f].flags.refused_company = Number(s.factions[f].flags.refused_company ?? 0) + 1; fx.attitude(s, 'company', f, -20); return 'The Sarkar kept its army at home.'; } },
    ],
    aiChoice: 0,
  },
  {
    id: 'lion_sleeps',
    title: 'The Lion sleeps',
    gurmukhi: 'ਸ਼ੇਰ-ਏ-ਪੰਜਾਬ',
    kind: 'historical',
    from: { year: 1839, festival: 'diwali' },
    to: { year: 1840, festival: 'vaisakhi' },
    mood: 'solemn',
    weight: 9,
    when: (s) => !!sarkar(s) && s.scenarioId !== 's1839' && !leaderAlive(s, 'ranjit_singh'),
    text: () =>
      'Hush. In June, at Lahore, Maharaja Ranjit Singh has died. The man who took a city at nineteen and built an empire in forty years is carried to the pyre in the garden by the fort. Ministers weep and watch one another. Across the Sutlej, the Company counts its regiments.',
    effect: (s) => {
      const f = sarkar(s)!;
      fx.piri(s, f, -2, 'The death of the Maharaja');
      fx.legend(s, f, 5);
      if (f === P(s) && !s.court) s.court = newCourt(s, f);
      if (collapseRisk(s, f) > 0.4) crisisOn(s, f);
    },
  },
  {
    id: 'archway_1840',
    title: 'The archway',
    kind: 'historical',
    from: { year: 1840, festival: 'diwali' },
    to: { year: 1840, festival: 'diwali' },
    mood: 'solemn',
    weight: 8,
    when: (s) => leaderAlive(s, 'nau_nihal_singh') && !!sarkar(s),
    text: () =>
      'Maharaja Kharak Singh is dead after a long illness. Returning from the cremation, his son Nau Nihal Singh — gifted, ambitious, the hope of the court — walks beneath an old gateway of the fort.',
    effect: (s) => {
      const f = sarkar(s)!;
      const risk = collapseRisk(s, f);
      if (chance(s, risk)) {
        fx.kill(s, 'nau_nihal_singh', 'was killed when an archway fell on the day of his father’s cremation');
        crisisOn(s, f);
        return 'The archway fell. Whether by chance or design, no one has ever proved.';
      }
      chronicle(s, 'succession', 'Nau Nihal Singh stepped aside as old masonry fell from the gateway. The prince lived to rule.', { faction: f, weight: 7 });
      if (s.factions[f].chief !== 'nau_nihal_singh' && leaderAlive(s, 'nau_nihal_singh')) s.factions[f].chief = 'nau_nihal_singh';
      return 'Stones fell from the gateway — but the prince had been warned, and lived.';
    },
  },
  {
    id: 'sandhawalia_1843',
    title: 'The Sandhawalia conspiracy',
    kind: 'historical',
    from: { year: 1843, festival: 'diwali' },
    to: { year: 1843, festival: 'diwali' },
    mood: 'solemn',
    weight: 8,
    when: (s) => !!sarkar(s) && leaderAlive(s, 'sher_singh') && s.factions[sarkar(s)!].chief === 'sher_singh',
    text: () => 'The Sandhawalia sardars, kinsmen of the throne, come to the Maharaja Sher Singh to show him a new carbine.',
    effect: (s) => {
      const f = sarkar(s)!;
      let risk = collapseRisk(s, f);
      if (s.court) risk = Math.max(0, risk + (40 - s.court.factions.sandhawalia.loyalty) / 100);
      if (chance(s, risk)) {
        fx.kill(s, 'sher_singh', 'was shot by the Sandhawalia sardars');
        if (leaderAlive(s, 'dhian_singh')) fx.kill(s, 'dhian_singh', 'was murdered the same day');
        if (leaderAlive(s, 'duleep_singh')) {
          s.factions[f].chief = 'duleep_singh';
          if (s.court) {
            s.court.regency = 10;
            s.court.factions.panches.influence += 25;
          }
        }
        crisisOn(s, f);
        return 'Sher Singh and his wazir Dhian Singh are murdered. The child Duleep Singh is proclaimed, with his mother Jind Kaur as regent; the army’s panches are now the real power.';
      }
      if (s.court) s.court.factions.sandhawalia.influence -= 15;
      return 'The plot was discovered in time; the Sandhawalias fled to British territory.';
    },
  },
  {
    id: 'panches_1844',
    title: 'The army chooses its masters',
    kind: 'historical',
    from: { year: 1844, festival: 'vaisakhi' },
    to: { year: 1845, festival: 'vaisakhi' },
    weight: 6,
    mood: 'ominous',
    when: (s) => !!sarkar(s) && !!s.factions[sarkar(s)!].flags.court_crisis,
    text: () => 'The regiments’ panches sit in judgment on ministers. The regent needs commanders the army will accept — and the Dogra and Company parties at court have their own candidates: Raja Lal Singh as wazir, and Tej Singh as commander-in-chief.',
    playerOnly: (s) => playerIsSarkar(s),
    choices: [
      {
        label: 'Accept Lal Singh and Tej Singh',
        detail: 'The court party is satisfied. Their loyalty to the Khalsa is doubtful.',
        effect: (s) => {
          appointLalTej(s, sarkar(s)!);
          return 'Lal Singh became wazir and Tej Singh commander of the army.';
        },
      },
      {
        label: 'Appoint Sham Singh Attariwala and men the army trusts',
        detail: 'Costs 80 and angers the Dogras and the court party. The army will be led by men loyal to it.',
        available: (s) => s.factions[P(s)].treasury >= 80,
        effect: (s) => {
          const f = P(s);
          fx.money(s, f, -80);
          if (s.court) {
            s.court.factions.dogra.loyalty -= 25;
            s.court.factions.panches.loyalty += 20;
            s.court.armyBound += 15;
          }
          for (const id of ['lal_singh', 'tej_singh']) if (s.leaders[id]) ((s.leaders[id].armyId = undefined), (s.leaders[id].active = false));
          for (const a of armiesOf(s, f)) if (a.leader === 'lal_singh' || a.leader === 'tej_singh') a.leader = undefined;
          fx.flag(s, f, 'court_crisis', false);
          return 'The veterans of Multan and Kashmir took command.';
        },
      },
    ],
    aiChoice: 0,
  },
  {
    id: 'first_war',
    title: 'Across the Sutlej',
    kind: 'historical',
    from: { year: 1845, festival: 'diwali' },
    to: { year: 1845, festival: 'diwali' },
    weight: 9,
    mood: 'ominous',
    when: (s) => {
      const f = sarkar(s);
      if (!f || !alive(s, 'company')) return false;
      const fs = s.factions[f];
      return !!fs.flags.court_crisis || fs.foothold >= 30 || Number(fs.flags.refused_company ?? 0) >= 2 || chance(s, 0.4);
    },
    text: () =>
      'In December the Khalsa army crosses the Sutlej. Some say the court sent it hoping it would be destroyed; some say the Company had massed its regiments at Ferozepur for exactly this. Mudki, Ferozeshah: the names of the coming fields are already waiting.',
    playerOnly: (s) => playerIsSarkar(s),
    choices: [
      {
        label: 'War: the Khalsa crosses the Sutlej',
        detail: 'Fight the First Anglo-Sikh War. Commanders of doubtful loyalty may betray you in the field.',
        effect: (s) => {
          startWar(s, sarkar(s)!);
          return 'The guns were ferried across at Harike.';
        },
      },
      {
        label: 'Hold the line and send envoys',
        detail: 'Possible only if the court is steady and the Company’s foothold small; otherwise the Company comes anyway.',
        effect: (s) => {
          const f = sarkar(s)!;
          const steady = s.court ? courtStability(s.court).value >= 55 : false;
          if (steady && s.factions[f].foothold < 35) {
            s.factions[f].foothold += 10;
            fx.flag(s, f, 'war_averted_1845', true);
            return 'For now, the Sutlej held as a frontier of peace.';
          }
          startWar(s, f);
          return 'The Company crossed instead.';
        },
      },
    ],
    aiChoice: 0,
  },
  {
    id: 'sobraon',
    title: 'Sobraon',
    gurmukhi: 'ਸਭਰਾਉਂ',
    kind: 'historical',
    from: { year: 1846, festival: 'vaisakhi' },
    to: { year: 1846, festival: 'vaisakhi' },
    weight: 10,
    mood: 'solemn',
    when: (s) => !!sarkar(s) && atWar(s, sarkar(s)!, 'company') && !!s.factions[sarkar(s)!].flags.war_started,
    text: (s) => {
      const f = sarkar(s)!;
      return warScore(s, f, Number(s.factions[f].flags.war_started)) >= 0
        ? 'On the Sutlej at Sobraon the Khalsa’s entrenchments hold. The Company’s regiments break on them again and again. The Governor-General sends to ask for terms.'
        : 'At Sobraon, in February, the Khalsa stands with its back to the swollen Sutlej. The bridge of boats behind it is broken — some say on its own commander’s order. Sham Singh Attariwala, an old man dressed all in white, rides into the Company’s line at the head of fifty horsemen and does not come back. The river runs red.';
    },
    effect: (s) => {
      const f = sarkar(s)!;
      const won = warScore(s, f, Number(s.factions[f].flags.war_started)) >= 0;
      fx.relation(s, f, 'company', 'peace');
      if (won) {
        s.factions[f].foothold = Math.max(0, s.factions[f].foothold - 20);
        fx.legend(s, f, 15);
        fx.piri(s, f, 4, 'The Khalsa holds the Sutlej');
        fx.flag(s, f, 'first_war_won', true);
        for (const r of regionsOf(s, 'company')) if (['jalandhar', 'hoshiarpur', 'kapurthala', 'kasur', 'lahore', 'amritsar'].includes(r)) fx.give(s, r, f, 40);
        chronicle(s, 'battle', 'At Sobraon the Khalsa held, and the Company asked for terms.', { faction: f, weight: 10 });
        return 'The Company asked for terms. The Sutlej remains the frontier.';
      }
      if (leaderAlive(s, 'sham_singh_attariwala')) fx.kill(s, 'sham_singh_attariwala', 'fell at Sobraon, dressed in white, leading the last charge');
      for (const a of armiesOf(s, f)) for (const u of a.units) u.men = Math.round(u.men * 0.6);
      // The Treaty of Lahore and the Treaty of Amritsar (1846).
      for (const r of ['jalandhar', 'hoshiarpur', 'kapurthala']) if (owns(s, f, r)) fx.give(s, r, 'company', 50);
      for (const r of ['srinagar', 'muzaffarabad', 'hazara']) if (owns(s, f, r)) fx.give(s, r, alive(s, 'jammu') ? 'jammu' : 'company', 50);
      s.factions.jammu.alive = true;
      fx.money(s, f, -Math.min(s.factions[f].treasury, 500));
      s.factions[f].foothold += 40;
      fx.flag(s, f, 'treaty_lahore', true);
      fx.piri(s, f, -3, 'The Treaty of Lahore');
      return 'By the Treaty of Lahore the Jalandhar Doab passes to the Company and Kashmir to Gulab Singh. A British Resident sits at Lahore.';
    },
  },
  {
    id: 'multan_revolt',
    title: 'Multan rises',
    kind: 'historical',
    from: { year: 1848, festival: 'vaisakhi' },
    to: { year: 1848, festival: 'vaisakhi' },
    weight: 8,
    mood: 'heroic',
    when: (s) => !!sarkar(s) && !!s.factions[sarkar(s)!].flags.treaty_lahore,
    text: () =>
      'At Multan two British officers come to take over the fort from Diwan Mulraj; his soldiers kill them. The revolt spreads. In Hazara old Chattar Singh Attariwala rises; his son Sher Singh takes the army over to the rebels. The question is put to the Lahore darbar: whose side is it on?',
    playerOnly: (s) => playerIsSarkar(s),
    choices: [
      {
        label: 'Raise the Khalsa: the Second Anglo-Sikh War',
        detail: 'Fight to throw off the Resident. Lose, and the Punjab is annexed.',
        effect: (s) => {
          startWar(s, sarkar(s)!);
          fx.flag(s, sarkar(s)!, 'second_war', true);
          return 'The Khalsa marched to the Chenab.';
        },
      },
      {
        label: 'Stand by the Resident and the treaty',
        detail: 'A protected state under the Company, if it keeps its word. Piri falls sharply.',
        effect: (s) => {
          const f = sarkar(s)!;
          fx.flag(s, f, 'company_protection', true);
          fx.flag(s, f, 'loyal_to_resident', true);
          fx.piri(s, f, -10, 'Standing aside as the Khalsa rose');
          return 'The darbar issued proclamations against the rebels. Few listened.';
        },
      },
    ],
    aiChoice: 0,
  },
  {
    id: 'chillianwala_gujrat',
    title: 'Chillianwala and Gujrat',
    gurmukhi: 'ਚੇਲਿਆਂਵਾਲਾ',
    kind: 'historical',
    from: { year: 1848, festival: 'diwali' },
    to: { year: 1848, festival: 'diwali' },
    weight: 10,
    mood: 'solemn',
    when: (s) => !!sarkar(s) && atWar(s, sarkar(s)!, 'company'),
    text: (s) => {
      const f = sarkar(s)!;
      return warScore(s, f, Number(s.factions[f].flags.war_started)) >= 0
        ? 'At Chillianwala, in the jungle by the Jhelum, the Khalsa fights the Company to a bloody standstill, and at Gujrat it holds again. Dalhousie’s letters to London grow careful. The Punjab is not to be swallowed this year.'
        : 'At Chillianwala, in January, the Khalsa fights the Company to a standstill in the jungle by the Jhelum; the Company’s losses shock London. But at Gujrat in February the Company’s guns, a hundred of them, do what its bayonets could not. The Khalsa soldiers lay down their arms; it is said each veteran kissed his sword before he gave it up.';
    },
    effect: (s) => {
      const f = sarkar(s)!;
      const won = warScore(s, f, Number(s.factions[f].flags.war_started)) >= 0;
      fx.relation(s, f, 'company', 'peace');
      if (won) {
        fx.flag(s, f, 'second_war_won', true);
        fx.legend(s, f, 15);
        s.factions[f].foothold = 0;
        fx.flag(s, f, 'treaty_lahore', false);
        return 'The Company withdrew its Resident. The Punjab remained the Punjab.';
      }
      fx.flag(s, f, 'annexed', true);
      if (f !== P(s)) for (const r of regionsOf(s, f)) fx.give(s, r, 'company', 40);
      return 'The war was lost. In March the Punjab was annexed; the Koh-i-Noor was sent to London.';
    },
  },
];

function appointLalTej(s: GameState, f: string) {
  for (const id of ['lal_singh', 'tej_singh']) {
    const L = s.leaders[id];
    if (!L) continue;
    L.faction = f;
    L.active = true;
    L.loyalty = Math.min(L.loyalty, 30);
  }
  const armies = armiesOf(s, f).sort((a, b) => armyMen(b) - armyMen(a));
  if (armies[0] && s.leaders.tej_singh) {
    if (armies[0].leader) s.leaders[armies[0].leader].armyId = undefined;
    armies[0].leader = 'tej_singh';
    s.leaders.tej_singh.armyId = armies[0].id;
  }
  if (armies[1] && s.leaders.lal_singh) {
    if (armies[1].leader) s.leaders[armies[1].leader].armyId = undefined;
    armies[1].leader = 'lal_singh';
    s.leaders.lal_singh.armyId = armies[1].id;
  }
}

function startWar(s: GameState, f: string) {
  fx.relation(s, f, 'company', 'war');
  fx.flag(s, f, 'war_started', s.turn);
  spawnCompanyArmy(s, 45000);
  // The court party's men, if appointed, are in command.
  if (s.factions[f].flags.court_crisis && f !== P(s)) appointLalTej(s, f);
  for (const g of ['phulkian', 'bahawalpur', 'malerkotla']) if (s.factions[g]?.flags.company_protection || s.factions[g]?.relations.company === 'alliance') fx.relation(s, g, f, 'war');
  chronicle(s, 'event', `War between ${polityName(s, f)} and the East India Company.`, { faction: f, weight: 8 });
}
