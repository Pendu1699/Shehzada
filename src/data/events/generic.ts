// Generic events: the texture of a century. Each is small, has a real choice, and
// is written in the dhadi's voice. They fire for the player only.

import { REGION_BY_ID } from '../regions';
import { armiesOf, armyMen, isSikh, regionsOf, year } from '../../engine/query';
import { chance, pick } from '../../engine/rng';
import type { GameState } from '../../engine/state';
import { fx, P, randomLeader, randomOwned } from './fx';
import type { Ctx, EventDef } from './types';

const name = (ctx: Ctx) => REGION_BY_ID[String(ctx.region)]?.name ?? 'the district';
const ldr = (s: GameState, ctx: Ctx) => s.leaders[String(ctx.leader)]?.name ?? 'a sardar';
const treasury = (s: GameState) => s.factions[P(s)].treasury;
const afford = (n: number) => (s: GameState) => treasury(s) >= n;
const inRegion = (filter: (r: string, s: GameState) => boolean = () => true) => (s: GameState): Ctx | null => {
  const r = randomOwned(s, P(s), (x) => filter(x, s));
  return r ? { region: r } : null;
};
const withLeader = (filter: (id: string, s: GameState) => boolean = () => true) => (s: GameState): Ctx | null => {
  const l = randomLeader(s, P(s), (id) => filter(id, s) && s.factions[P(s)].chief !== id);
  return l ? { leader: l } : null;
};
const sikhPlayer = (s: GameState) => isSikh(P(s));

const gen = (e: Omit<EventDef, 'kind'>): EventDef => ({ kind: 'generic', chance: 0.014, cooldown: 16, ...e });

export const GENERIC: EventDef[] = [
  gen({
    id: 'famine',
    title: 'Famine',
    mood: 'solemn',
    ctx: inRegion((r) => REGION_BY_ID[r].fertility <= 3),
    text: (_s, c) => `The rains failed over ${name(c)}. The wells are low, the grain is gone, and the people are eating the bark of the kikar trees.`,
    choices: [
      { label: 'Open the langar and the granaries', detail: 'Costs 30. Piri and stability rise greatly.', available: afford(30), effect: (s, c) => (fx.money(s, P(s), -30), fx.piri(s, P(s), 4, `Feeding ${name(c)} in famine`), fx.stability(s, String(c.region), 20), (s.regions[String(c.region)].langar = true), 'Smoke rose from the langar fires; no one was turned away.') },
      { label: 'Remit the revenue this year', detail: 'Lose a season of income here; stability rises.', effect: (s, c) => (fx.devastate(s, String(c.region), 0.1), fx.stability(s, String(c.region), 10), fx.piri(s, P(s), 1, 'Remitting revenue in famine'), 'The tax-gatherers stayed at home.') },
      { label: 'Collect as usual', detail: 'The treasury is spared. The people remember.', effect: (s, c) => (fx.devastate(s, String(c.region), 0.3), fx.stability(s, String(c.region), -20), fx.piri(s, P(s), -3, `Collecting revenue from starving ${name(c)}`), 'The revenue came in. So did the curses.') },
    ],
  }),
  gen({
    id: 'flood',
    title: 'The river in flood',
    season: 'vaisakhi',
    ctx: inRegion((r) => ['bela', 'plains'].includes(REGION_BY_ID[r].terrain)),
    text: (_s, c) => `The monsoon came early and heavy. The river has jumped its bed below ${name(c)}, and whole villages stand in brown water.`,
    choices: [
      { label: 'Send men and boats', detail: 'Costs 12. Stability rises; devastation lessened.', available: afford(12), effect: (s, c) => (fx.money(s, P(s), -12), fx.stability(s, String(c.region), 10), fx.piri(s, P(s), 1, 'Relief after the flood'), 'Boats went from village to village.') },
      { label: 'Let the waters fall', effect: (s, c) => (fx.devastate(s, String(c.region), 0.2), 'The silt will make next year’s wheat grow tall.') },
    ],
  }),
  gen({
    id: 'horse_fair',
    title: 'A horse fair',
    ctx: (s) => (regionsOf(s, P(s)).some((r) => REGION_BY_ID[r].resources.includes('horses')) || chance(s, 0.4) ? {} : null),
    text: () => 'At the great horse fair the traders have brought mares from the Dhanni country and stallions from beyond the Indus. Good horses make good ghorchare.',
    choices: [
      { label: 'Buy remounts for the jathas', detail: 'Costs 15. Your armies’ morale rises.', available: afford(15), effect: (s) => { fx.money(s, P(s), -15); for (const a of armiesOf(s, P(s))) a.morale = Math.min(100, a.morale + 10); return 'Fresh horses for every jatha.'; } },
      { label: 'Admire them and ride home', effect: () => 'The horses went to other buyers.' },
    ],
  }),
  gen({
    id: 'sardar_wedding',
    title: 'A sardar’s wedding',
    mood: 'festive',
    ctx: withLeader(),
    text: (s, c) => `${ldr(s, c)} is to marry. The baraat will ride with drums and fireworks, and every sardar watches to see who honours the wedding.`,
    choices: [
      { label: 'Send rich gifts', detail: 'Costs 10. Loyalty +12.', available: afford(10), effect: (s, c) => (fx.money(s, P(s), -10), fx.loyalty(s, String(c.leader), 12), 'The gifts were the talk of the wedding.') },
      { label: 'Attend in person', detail: 'Loyalty +6.', effect: (s, c) => (fx.loyalty(s, String(c.leader), 6), 'You danced at the wedding.') },
      { label: 'Send apologies', detail: 'Loyalty −6.', effect: (s, c) => (fx.loyalty(s, String(c.leader), -6), 'The slight was noted.') },
    ],
  }),
  gen({
    id: 'jagir_dispute',
    title: 'A dispute over a jagir',
    ctx: (s) => {
      const ls = Object.values(s.leaders).filter((l) => l.alive && l.active && l.faction === P(s) && s.factions[P(s)].chief !== l.id);
      if (ls.length < 2) return null;
      const a = pick(s, ls);
      const b = pick(s, ls.filter((x) => x.id !== a.id));
      return { leader: a.id, other: b.id };
    },
    text: (s, c) => `${ldr(s, c)} and ${s.leaders[String(c.other)]?.name} both claim the revenue of the same villages. Each has brought witnesses and old papers.`,
    choices: [
      { label: (s, c) => `Decide for ${ldr(s, c)}`, effect: (s, c) => (fx.loyalty(s, String(c.leader), 10), fx.loyalty(s, String(c.other), -12), 'One rode away pleased, one sullen.') },
      { label: (s, c) => `Decide for ${s.leaders[String(c.other)]?.name}`, effect: (s, c) => (fx.loyalty(s, String(c.other), 10), fx.loyalty(s, String(c.leader), -12), 'One rode away pleased, one sullen.') },
      { label: 'Split the villages between them', detail: 'Costs 8 in compensation; both content.', available: afford(8), effect: (s, c) => (fx.money(s, P(s), -8), fx.loyalty(s, String(c.leader), 3), fx.loyalty(s, String(c.other), 3), 'Neither was delighted, both were satisfied.') },
    ],
  }),
  gen({
    id: 'holy_man',
    title: 'A holy man’s blessing',
    ctx: inRegion(),
    text: (_s, c) => `An old faqir who has sat for forty years beneath a pipal tree near ${name(c)} sends word that he wishes to bless your house. Sikhs, Hindus and Muslims alike go to him.`,
    choices: [
      { label: 'Visit him barefoot', detail: 'Piri and stability rise.', effect: (s, c) => (fx.piri(s, P(s), 1.5, 'Honouring a holy man of another faith'), fx.stability(s, String(c.region), 8), 'He blessed your house; the villages talked of it for a year.') },
      { label: 'Endow his khanqah with land', detail: 'Costs 10. More Piri.', available: afford(10), effect: (s, c) => (fx.money(s, P(s), -10), fx.piri(s, P(s), 2.5, 'Endowing a shrine'), fx.stability(s, String(c.region), 12), 'Land was granted for his lamp and his kitchen.') },
      { label: 'Ignore the summons', effect: () => 'The faqir smiled and went on with his prayers.' },
    ],
  }),
  gen({
    id: 'kabul_caravan',
    title: 'A caravan from Kabul',
    ctx: (s) => (regionsOf(s, P(s)).some((r) => REGION_BY_ID[r].gtRoad) ? {} : null),
    text: () => 'A caravan of three hundred camels has come down the Khyber road: dried fruit, horses, lapis, and Kabuli merchants asking for safe passage to Amritsar.',
    choices: [
      { label: 'Grant passage for a fair toll', detail: '+20 treasury.', effect: (s) => (fx.money(s, P(s), 20), 'The toll was paid and the caravan went on.') },
      { label: 'Give free passage and an escort', detail: 'Trade grows; Piri for fair dealing.', effect: (s) => (fx.money(s, P(s), 5), fx.piri(s, P(s), 1, 'Protecting travellers on the road'), 'The merchants spread your name down the road to Kabul.') },
      { label: 'Seize the goods', detail: '+60 treasury; Piri falls.', effect: (s) => (fx.money(s, P(s), 60), fx.piri(s, P(s), -4, 'Robbing a caravan'), 'The caravan was taken. Few will come this way again.') },
    ],
  }),
  gen({
    id: 'nihang_justice',
    title: 'Nihangs demand justice',
    when: (s) => sikhPlayer(s),
    ctx: withLeader(),
    text: (s, c) => `A jatha of blue-clad Nihangs rides into your camp. They say ${ldr(s, c)} has been taking more than the rakhi share from the villages, and they will not leave until justice is done.`,
    choices: [
      { label: 'Fine the sardar and repay the villages', detail: 'Piri rises; the sardar’s loyalty falls.', effect: (s, c) => (fx.loyalty(s, String(c.leader), -15), fx.piri(s, P(s), 3, 'Doing justice when the Nihangs asked it'), 'The villages were repaid to the last paisa.') },
      { label: 'Ask the Akal Takht to decide', detail: 'A tankhah (penance) for the sardar; Piri rises a little.', effect: (s, c) => (fx.loyalty(s, String(c.leader), -6), fx.piri(s, P(s), 2, 'Bowing to the Akal Takht'), 'The sardar stood barefoot before the Akal Takht and accepted his penance.') },
      { label: 'Send the Nihangs away', detail: 'The sardar is grateful; the Panth is not.', effect: (s, c) => (fx.loyalty(s, String(c.leader), 8), fx.piri(s, P(s), -4, 'Dismissing the Nihangs’ complaint'), 'The Nihangs rode off. They will tell everyone.') },
    ],
  }),
  gen({
    id: 'rakhi_request',
    title: 'Villages ask for rakhi',
    ctx: (s) => {
      const cands = Object.values(s.regions).filter((r) => r.owner !== P(s) && !r.rakhi && regionsOf(s, P(s)).some((x) => x !== r.id));
      const near = cands.filter((r) => regionsOf(s, P(s)).length && (s.explored[r.id] ?? 0) > 0);
      return near.length ? { region: pick(s, near).id } : null;
    },
    text: (_s, c) => `Headmen from the villages of ${name(c)} have come with turbans in their hands. Raiders took their cattle last month. They will pay a fifth of their crop if your riders will guard them.`,
    choices: [
      { label: 'Accept them under your rakhi', detail: 'Income from rakhi; you must answer if they are raided.', effect: (s, c) => ((s.regions[String(c.region)].rakhi = P(s)), (s.regions[String(c.region)].rakhiTurns = 0), 'The villages tied a thread of rakhi to your banner.') },
      { label: 'Decline: you cannot protect them', effect: () => 'The headmen went to seek another protector.' },
    ],
  }),
  gen({
    id: 'deserter',
    title: 'A deserter',
    ctx: () => ({}),
    text: () => 'A rider from an enemy camp comes in under a white cloth. He says he knows their roads and their numbers, and asks for bread and a place among your men.',
    choices: [
      { label: 'Take him in and listen', detail: 'Reveals distant land.', effect: (s) => { for (const r of Object.keys(s.regions)) if ((s.explored[r] ?? 0) === 0 && chance(s, 0.25)) s.explored[r] = 1; return 'He talked through the night. Your map grew.'; } },
      { label: 'Send him back', effect: () => 'He rode away into the dark.' },
    ],
  }),
  gen({
    id: 'european_adventurer',
    title: 'A European seeks service',
    when: (s) => year(s) >= 1790,
    ctx: () => ({}),
    text: () => 'A sunburnt European in a faded coat — a deserter from some Company regiment, or an adventurer from much farther away — asks to drill your foot in the Western manner.',
    choices: [
      { label: 'Hire him', detail: 'Costs 15. A new drillmaster sardar joins you.', available: afford(15), effect: (s) => { fx.money(s, P(s), -15); const L = fx.newLeader(s, P(s)); L.name = pick(s, ['Colonel Mouton', 'Captain Gardner', 'Major Holmes', 'Captain Ford', 'Signor Avitabile']); L.traits = ['drillmaster', 'cautious']; L.loyalty = 60; return `${L.name} took service.`; } },
      { label: 'Send him away', effect: () => 'He rode on toward the next court.' },
    ],
  }),
  gen({
    id: 'holla_mohalla',
    title: 'Holla Mohalla at Anandpur',
    mood: 'festive',
    season: 'vaisakhi',
    when: (s) => sikhPlayer(s),
    ctx: () => ({}),
    text: () => 'At Anandpur the Holla Mohalla is held as Guru Gobind Singh Ji began it: mock battles, horsemanship, the Nihangs galloping in their blue and saffron, and langar for all who come.',
    choices: [
      { label: 'Send your best riders to compete', detail: 'Morale and Legend.', effect: (s) => { for (const a of armiesOf(s, P(s))) a.morale = Math.min(100, a.morale + 8); fx.legend(s, P(s), 1); return 'Your riders won two of the contests.'; } },
      { label: 'Fund the langar at Anandpur', detail: 'Costs 10. Piri.', available: afford(10), effect: (s) => (fx.money(s, P(s), -10), fx.piri(s, P(s), 2, 'The langar at Holla Mohalla'), 'Ten thousand ate at the langar.') },
    ],
  }),
  gen({
    id: 'diwali_illumination',
    title: 'Diwali at Amritsar',
    mood: 'festive',
    season: 'diwali',
    when: (s) => sikhPlayer(s) && s.regions.amritsar.owner !== null && isSikh(s.regions.amritsar.owner) && !s.regions.amritsar.desecrated.length,
    ctx: () => ({}),
    text: () => 'For Bandi Chhor Divas the whole parikrama is lit with clay lamps, their light doubled in the sarovar. Pilgrims have come from every misl.',
    choices: [
      { label: 'Pay for the illumination', detail: 'Costs 8. Piri and Legend.', available: afford(8), effect: (s) => (fx.money(s, P(s), -8), fx.piri(s, P(s), 1.5, 'The Diwali illumination at Amritsar'), fx.legend(s, P(s), 1), 'Ten thousand lamps burned till dawn.') },
      { label: 'Join the pilgrims quietly', effect: (s) => (fx.piri(s, P(s), 0.5, 'Keeping Diwali among the pilgrims'), 'You bathed in the sarovar like any pilgrim.') },
    ],
  }),
  gen({
    id: 'bumper_harvest',
    title: 'A golden harvest',
    mood: 'festive',
    ctx: inRegion((r) => REGION_BY_ID[r].fertility >= 3),
    text: (_s, c) => `The wheat in ${name(c)} stands taller than any old man remembers. The threshing floors are piled high.`,
    choices: [
      { label: 'Fill the granaries against hard years', detail: '+10 treasury; stability.', effect: (s, c) => (fx.money(s, P(s), 10), fx.stability(s, String(c.region), 6), 'The granaries were full.') },
      { label: 'Take a larger share', detail: '+30 treasury; the farmers grumble.', effect: (s, c) => (fx.money(s, P(s), 30), fx.stability(s, String(c.region), -8), 'The share was taken.') },
    ],
  }),
  gen({
    id: 'locusts',
    title: 'Locusts',
    ctx: inRegion(),
    text: (_s, c) => `A dark cloud came out of the south-west over ${name(c)}, and when it lifted the fields were bare stalks.`,
    choices: [
      { label: 'Remit the revenue', effect: (s, c) => (fx.stability(s, String(c.region), 8), fx.devastate(s, String(c.region), 0.1), fx.piri(s, P(s), 0.5, 'Remitting revenue after the locusts'), 'The farmers were spared the tax.') },
      { label: 'Collect anyway', effect: (s, c) => (fx.devastate(s, String(c.region), 0.25), fx.stability(s, String(c.region), -12), 'The revenue was collected from empty fields.') },
    ],
  }),
  gen({
    id: 'cholera',
    title: 'Sickness in the camp',
    mood: 'solemn',
    ctx: (s) => (armiesOf(s, P(s)).length ? {} : null),
    text: () => 'Cholera has come into the camp with the summer heat. Men who were well at dawn are dead by nightfall.',
    choices: [
      { label: 'Break camp and scatter to clean water', detail: 'Smaller losses; morale falls.', effect: (s) => { fx.losses(s, P(s), 0.04); for (const a of armiesOf(s, P(s))) a.morale -= 8; return 'The sickness passed.'; } },
      { label: 'Stay and nurse the sick', detail: 'Larger losses; the men see you did not abandon them.', effect: (s) => { fx.losses(s, P(s), 0.08); fx.piri(s, P(s), 1, 'Nursing the sick'); return 'Many died; none died alone.'; } },
    ],
  }),
  gen({
    id: 'merchant_loan',
    title: 'The bankers of Amritsar',
    ctx: () => ({}),
    text: () => 'The great sahukars who keep their hundis in the bazaars of Amritsar offer you a loan against next year’s harvest.',
    choices: [
      { label: 'Borrow 60, repay 80 within two years', effect: (s) => (fx.money(s, P(s), 60), fx.flag(s, P(s), 'debt', 80), fx.flag(s, P(s), 'debt_due', s.turn + 4), 'The silver was counted out.') },
      { label: 'Decline politely', effect: () => 'The bankers bowed and went away.' },
    ],
  }),
  gen({
    id: 'debt_due',
    title: 'The debt falls due',
    once: false,
    chance: 1,
    when: (s) => Number(s.factions[P(s)].flags.debt ?? 0) > 0 && s.turn >= Number(s.factions[P(s)].flags.debt_due ?? 0),
    ctx: () => ({}),
    text: (s) => `The bankers have come for their ${s.factions[P(s)].flags.debt} thousand rupees.`,
    choices: [
      { label: 'Repay in full', available: (s) => treasury(s) >= Number(s.factions[P(s)].flags.debt), effect: (s) => (fx.money(s, P(s), -Number(s.factions[P(s)].flags.debt)), fx.flag(s, P(s), 'debt', 0), 'The hundi was torn up.') },
      { label: 'Default', detail: 'Trade suffers; stability falls in your towns.', effect: (s) => { fx.flag(s, P(s), 'debt', 0); for (const r of regionsOf(s, P(s))) fx.stability(s, r, -6); fx.piri(s, P(s), -1, 'Defaulting on a debt'); return 'No banker will lend to you again soon.'; } },
    ],
  }),
  gen({
    id: 'salt_dispute',
    title: 'The salt mines',
    ctx: (s) => (regionsOf(s, P(s)).includes('khewra') ? { region: 'khewra' } : null),
    text: () => 'The miners of the Salt Range have downed tools. The contractor cheats them on every maund of salt.',
    choices: [
      { label: 'Take the mines into your own hands', detail: 'Income rises, the contractor is angry.', effect: (s) => (fx.money(s, P(s), 15), fx.stability(s, 'khewra', 5), 'Salt flowed again, and fairly weighed.') },
      { label: 'Back the contractor', effect: (s) => (fx.money(s, P(s), 8), fx.stability(s, 'khewra', -10), 'The miners went back sullenly.') },
    ],
  }),
  gen({
    id: 'shawl_traders',
    title: 'The shawl merchants',
    ctx: (s) => (regionsOf(s, P(s)).includes('srinagar') ? { region: 'srinagar' } : null),
    text: () => 'The weavers of Kashmir have finished a run of shawls so fine they pass through a finger ring. Merchants from Amritsar wait to buy.',
    choices: [
      { label: 'Tax the trade lightly', detail: '+15 and stability.', effect: (s) => (fx.money(s, P(s), 15), fx.stability(s, 'srinagar', 6), 'The looms were busy all winter.') },
      { label: 'Tax it heavily', detail: '+40; weavers flee.', effect: (s) => (fx.money(s, P(s), 40), fx.stability(s, 'srinagar', -15), fx.devastate(s, 'srinagar', 0.1), 'Some weavers left for the plains.') },
    ],
  }),
  gen({
    id: 'pilgrims_nankana',
    title: 'Pilgrims to Nankana',
    when: (s) => sikhPlayer(s),
    ctx: () => ({}),
    text: () => 'Pilgrims going to Nankana Sahib for the Gurpurab ask for protection on the road through the bar.',
    choices: [
      { label: 'Escort them', detail: 'Piri.', effect: (s) => (fx.piri(s, P(s), 1, 'Protecting pilgrims'), 'They reached Nankana safely.') },
      { label: 'You have no riders to spare', effect: () => 'They went on alone.' },
    ],
  }),
  gen({
    id: 'urs_pakpattan',
    title: 'The urs of Baba Farid',
    ctx: () => ({}),
    text: () => 'At Pakpattan the urs of Baba Farid is held, and the Bahishti Darwaza is opened. Pilgrims of every faith pass through it. The diwan of the shrine asks your protection for the fair.',
    choices: [
      { label: 'Send riders to keep the peace', detail: 'Piri through tolerance.', effect: (s) => (fx.piri(s, P(s), 1.5, 'Protecting the urs at Pakpattan'), 'The fair passed in peace.') },
      { label: 'Decline', effect: () => 'The fair passed without you.' },
    ],
  }),
  gen({
    id: 'mosque_petition',
    title: 'A petition from the qazi',
    ctx: inRegion((r) => REGION_BY_ID[r].faith.muslim >= 30),
    text: (_s, c) => `The qazi of ${name(c)} asks that the revenue-free land of the old mosque, granted under the Mughals, be confirmed under your rule.`,
    choices: [
      { label: 'Confirm the grant', detail: 'Lose a little revenue; stability and Piri rise.', effect: (s, c) => (fx.money(s, P(s), -4), fx.stability(s, String(c.region), 12), fx.piri(s, P(s), 1.5, 'Confirming the mosque’s land'), 'The grant was sealed again.') },
      { label: 'Resume the land', detail: '+10; stability falls sharply.', effect: (s, c) => (fx.money(s, P(s), 10), fx.stability(s, String(c.region), -18), fx.piri(s, P(s), -2, 'Resuming a mosque’s land'), 'The land was taken. The qazi said nothing; the town said a great deal.') },
    ],
  }),
  gen({
    id: 'temple_festival',
    title: 'The fair at Jwalamukhi',
    ctx: () => ({}),
    text: () => 'The great fair at Jwalamukhi draws pilgrims from all the hills. The priests ask for a gift of gold for the temple’s roof.',
    choices: [
      { label: 'Give the gold', detail: 'Costs 12. Piri through tolerance; the hill rajas warm to you.', available: afford(12), effect: (s) => { fx.money(s, P(s), -12); fx.piri(s, P(s), 1.5, 'A gift to the temple at Jwalamukhi'); fx.attitude(s, 'kangra', P(s), 15); fx.attitude(s, 'hill_states', P(s), 15); return 'The temple roof shone in the hills.'; } },
      { label: 'Send good wishes', effect: () => 'The priests blessed you anyway.' },
    ],
  }),
  gen({
    id: 'gt_bandits',
    title: 'Bandits on the road',
    ctx: inRegion((r) => !!REGION_BY_ID[r].gtRoad),
    text: (_s, c) => `Bandits are robbing travellers on the Grand Trunk Road near ${name(c)}. The merchants have stopped coming.`,
    choices: [
      { label: 'Hunt them down', detail: 'Costs a few men; trade restored, stability rises.', effect: (s, c) => (fx.losses(s, P(s), 0.01), fx.stability(s, String(c.region), 10), fx.money(s, P(s), 8), 'The road was safe again.') },
      { label: 'Offer them service', detail: 'A hundred tough men join your foot.', effect: (s, c) => (fx.recruit(s, P(s), String(c.region), 'piyada', 300), fx.piri(s, P(s), -0.5, 'Taking bandits into service'), 'The bandits became soldiers, more or less.') },
    ],
  }),
  gen({
    id: 'canal_silted',
    title: 'The old canal is silted',
    ctx: inRegion((r, s) => !s.regions[r].buildings.includes('canal') && REGION_BY_ID[r].fertility >= 3),
    text: (_s, c) => `The Mughal canal that watered ${name(c)} has silted up. The farmers say that with labour and money it could run again.`,
    choices: [
      { label: 'Clear the canal', detail: 'Costs 30. A canal is built here.', available: afford(30), effect: (s, c) => (fx.money(s, P(s), -30), s.regions[String(c.region)].buildings.push('canal'), fx.piri(s, P(s), 0.5, 'Clearing a canal'), 'Water flowed again through the fields.') },
      { label: 'Not now', effect: () => 'The canal stayed dry.' },
    ],
  }),
  gen({
    id: 'bazaar_fire',
    title: 'Fire in the bazaar',
    ctx: inRegion((r) => REGION_BY_ID[r].trade >= 3),
    text: (_s, c) => `A fire started in a sweetmaker’s shop has burned half the bazaar of ${name(c)}.`,
    choices: [
      { label: 'Pay to rebuild', detail: 'Costs 15. Stability rises.', available: afford(15), effect: (s, c) => (fx.money(s, P(s), -15), fx.stability(s, String(c.region), 10), 'The bazaar was rebuilt in brick.') },
      { label: 'Let the merchants rebuild', effect: (s, c) => (fx.devastate(s, String(c.region), 0.1), 'Trade will be slow this year.') },
    ],
  }),
  gen({
    id: 'wrestling',
    title: 'The wrestling ground',
    mood: 'festive',
    ctx: () => ({}),
    text: () => 'A famous pehlwan has thrown every challenger in the district and now challenges the champion of your camp.',
    choices: [
      { label: 'Put up your champion', detail: 'A gamble for morale.', effect: (s) => { const win = chance(s, 0.5); for (const a of armiesOf(s, P(s))) a.morale = Math.min(100, Math.max(0, a.morale + (win ? 8 : -4))); return win ? 'Your champion won; the camp drummed all night.' : 'Your champion was thrown. The camp was quiet.'; } },
      { label: 'Invite the pehlwan to join you', detail: 'Costs 5.', available: afford(5), effect: (s) => (fx.money(s, P(s), -5), 'He joined your household and trained the young riders.') },
    ],
  }),
  gen({
    id: 'basant',
    title: 'Basant',
    mood: 'festive',
    season: 'vaisakhi',
    ctx: (s) => (regionsOf(s, P(s)).includes('lahore') ? { region: 'lahore' } : null),
    text: () => 'At Basant the sky over Lahore is full of kites, and the court dresses in yellow like the mustard fields.',
    choices: [
      { label: 'Hold a great Basant darbar', detail: 'Costs 10. Stability, Legend.', available: afford(10), effect: (s) => (fx.money(s, P(s), -10), fx.stability(s, 'lahore', 8), fx.legend(s, P(s), 1), 'The darbar was all yellow silk.') },
      { label: 'Fly a kite from the fort walls', effect: (s) => (fx.stability(s, 'lahore', 3), 'Your kite cut three others.') },
    ],
  }),
  gen({
    id: 'maghi_muktsar',
    title: 'Maghi at Muktsar',
    when: (s) => sikhPlayer(s),
    season: 'diwali',
    ctx: () => ({}),
    text: () => 'At Maghi the Sikhs gather at Muktsar to remember the Forty Liberated Ones, who had left Guru Gobind Singh Ji in the siege of Anandpur and came back to give their lives for him at Khidrana.',
    choices: [
      { label: 'Forgive the deserters in your own ranks', detail: 'Men who left return. Piri.', effect: (s) => { const r = regionsOf(s, P(s))[0]; if (r) fx.recruit(s, P(s), r, 'ghorchare', 400); fx.piri(s, P(s), 1, 'Forgiving the deserters at Maghi'); return 'Four hundred riders came back to the banner.'; } },
      { label: 'Attend the fair', effect: (s) => (fx.piri(s, P(s), 0.5, 'Keeping Maghi at Muktsar'), 'You bathed in the tank at Muktsar.') },
    ],
  }),
  gen({
    id: 'pathan_soldiers',
    title: 'Pathan soldiers seek service',
    ctx: () => ({}),
    text: () => 'Three hundred Pathan matchlockmen, whose last master could not pay them, offer you their service. They are good soldiers and they keep their word.',
    choices: [
      { label: 'Enlist them', detail: 'Costs 10. Jezailchi join; a multi-faith army is a strength.', available: afford(10), effect: (s) => { const r = regionsOf(s, P(s))[0]; if (!r) return 'There was no place to muster them.'; fx.money(s, P(s), -10); fx.recruit(s, P(s), r, 'jezailchi', 300); fx.piri(s, P(s), 0.5, 'An army open to men of every faith'); return 'The Pathans took service under your banner.'; } },
      { label: 'Turn them away', effect: () => 'They went to the next court.' },
    ],
  }),
  gen({
    id: 'brahmin_astrologer',
    title: 'The astrologer’s warning',
    ctx: () => ({}),
    text: () => 'A court astrologer insists that the stars forbid any campaign this season, and the superstitious among your men are listening.',
    choices: [
      { label: 'Thank him and ignore the stars', detail: 'Morale dips slightly.', effect: (s) => { for (const a of armiesOf(s, P(s))) a.morale -= 4; return 'The men grumbled, and rode.'; } },
      { label: 'Reward him for his care', detail: 'Costs 3.', available: afford(3), effect: (s) => (fx.money(s, P(s), -3), 'He found a more favourable conjunction.') },
    ],
  }),
  gen({
    id: 'widow_petition',
    title: 'A widow’s petition',
    ctx: inRegion(),
    text: (_s, c) => `A widow from ${name(c)} walks two days to your camp. Her late husband’s brother has taken her fields. She asks for justice, not charity.`,
    choices: [
      { label: 'Restore her fields', detail: 'Piri for justice.', effect: (s, c) => (fx.piri(s, P(s), 1.5, 'Justice for a widow'), fx.stability(s, String(c.region), 4), 'Her fields were restored and her son given a place among your riders.') },
      { label: 'Refer her to the panchayat', effect: () => 'The panchayat will take its time.' },
    ],
  }),
  gen({
    id: 'thief_in_langar',
    title: 'A thief at the langar',
    when: (s) => sikhPlayer(s),
    ctx: () => ({}),
    text: () => 'A thin boy is caught stealing brass bowls from the langar. The sevadars want him flogged.',
    choices: [
      { label: 'Feed him and give him work', detail: 'Piri.', effect: (s) => (fx.piri(s, P(s), 1, 'Mercy at the langar'), 'He became the best water-carrier in the camp.') },
      { label: 'Let the sevadars punish him', effect: () => 'The bowls were returned.' },
    ],
  }),
  gen({
    id: 'muslim_village_rakhi',
    title: 'A Muslim village asks protection',
    ctx: (s) => {
      const r = Object.values(s.regions).filter((x) => x.owner !== P(s) && REGION_BY_ID[x.id].faith.muslim > 60 && !x.rakhi && (s.explored[x.id] ?? 0) > 0);
      return r.length ? { region: pick(s, r).id } : null;
    },
    text: (_s, c) => `The Muslim villages of ${name(c)}, raided by their own nawab’s horse, ask whether the Khalsa’s rakhi is for them too.`,
    choices: [
      { label: 'Rakhi is for all who ask', detail: 'Rakhi accepted; Piri rises.', effect: (s, c) => ((s.regions[String(c.region)].rakhi = P(s)), fx.piri(s, P(s), 2, 'Protecting villages of every faith'), 'The villages paid rakhi and were protected like any other.') },
      { label: 'Decline', effect: () => 'The headmen went home.' },
    ],
  }),
  gen({
    id: 'caravan_robbed',
    title: 'A caravan robbed by your own',
    ctx: withLeader(),
    text: (s, c) => `A Hindu merchant of Amritsar complains that men of ${ldr(s, c)}’s jatha robbed his caravan on the Jalandhar road.`,
    choices: [
      { label: 'Repay the merchant from the sardar’s share', detail: 'Piri; the sardar sulks.', effect: (s, c) => (fx.loyalty(s, String(c.leader), -10), fx.piri(s, P(s), 2, 'Repaying a robbed merchant'), 'The merchant was repaid in full.') },
      { label: 'Repay him from your treasury', detail: 'Costs 15. Piri; the sardar keeps face.', available: afford(15), effect: (s) => (fx.money(s, P(s), -15), fx.piri(s, P(s), 1.5, 'Repaying a robbed merchant'), 'The merchant was repaid.') },
      { label: 'Dismiss the complaint', effect: (s) => (fx.piri(s, P(s), -2, 'Shielding robbers'), 'The merchants of Amritsar will remember.') },
    ],
  }),
  gen({
    id: 'young_sardar',
    title: 'A young sardar seeks command',
    ctx: () => ({}),
    text: () => 'The son of a sardar who fell in your service has come of age. He asks for a command of his own.',
    choices: [
      { label: 'Give him a command', detail: 'A new sardar joins you.', effect: (s) => { const L = fx.newLeader(s, P(s)); L.loyalty = 80; return `${L.name} joined your sardars.`; } },
      { label: 'Tell him to wait', effect: () => 'He waited, not patiently.' },
    ],
  }),
  gen({
    id: 'spy_report',
    title: 'The harkara’s report',
    ctx: () => ({}),
    text: () => 'Your harkaras — runners and spies — bring news from far districts.',
    choices: [
      { label: 'Read the reports', detail: 'Reveals distant regions.', effect: (s) => { let n = 0; for (const r of Object.keys(s.regions)) if ((s.explored[r] ?? 0) === 0 && chance(s, 0.3)) ((s.explored[r] = 1), n++); return `${n} districts became known to you.`; } },
    ],
  }),
  gen({
    id: 'mughal_deserters',
    title: 'Mughal horsemen seek service',
    when: (s) => year(s) < 1800,
    ctx: () => ({}),
    text: () => 'A troop of Mughal cavalry, unpaid for a year, has killed its officer and rides to your camp.',
    choices: [
      { label: 'Take them in', detail: 'Costs 12. Heavy horse join you.', available: afford(12), effect: (s) => { const r = regionsOf(s, P(s))[0]; if (!r) return 'There was nowhere to muster them.'; fx.money(s, P(s), -12); fx.recruit(s, P(s), r, sikhPlayer(s) ? 'ghorchare' : 'piyada', 500); return 'Five hundred horsemen changed their colours.'; } },
      { label: 'Send them away', effect: () => 'They rode off to try their luck elsewhere.' },
    ],
  }),
  gen({
    id: 'school_founding',
    title: 'A school for the town',
    ctx: inRegion((r, s) => !s.regions[r].buildings.includes('school')),
    text: (_s, c) => `The teachers of ${name(c)} — a granthi, a pandit and a maulvi — come together to ask for a school open to all children.`,
    choices: [
      { label: 'Found the school', detail: 'Costs 20. Stability, Piri.', available: afford(20), effect: (s, c) => (fx.money(s, P(s), -20), s.regions[String(c.region)].buildings.push('school'), fx.piri(s, P(s), 1.5, 'A school for children of every faith'), 'Children of three faiths learned their letters under one roof.') },
      { label: 'Not now', effect: () => 'The teachers went home.' },
    ],
  }),
  gen({
    id: 'river_course',
    title: 'The river changes course',
    ctx: inRegion((r) => REGION_BY_ID[r].terrain === 'bela'),
    text: (_s, c) => `The river has left its bed near ${name(c)} and cut a new channel a kos away. A neighbouring chief claims the new land.`,
    choices: [
      { label: 'Hold the new land', detail: 'Control rises; the neighbour is angry.', effect: (s, c) => (fx.control(s, String(c.region), 10), 'Your boundary stones went in.') },
      { label: 'Let it go', effect: () => 'The neighbour ploughed it.' },
    ],
  }),
  gen({
    id: 'gun_founder',
    title: 'A gun-founder',
    ctx: () => ({}),
    text: () => 'A master gun-founder from Lahore, trained in the old Mughal karkhanas, offers to cast guns for you.',
    choices: [
      { label: 'Commission a battery', detail: 'Costs 40. Heavy guns join your army.', available: afford(40), effect: (s) => { const r = regionsOf(s, P(s))[0]; if (!r) return 'No foundry could be set up.'; fx.money(s, P(s), -40); fx.recruit(s, P(s), r, s.factions[P(s)].sarkar && year(s) >= 1810 ? 'topkhana' : 'top', 200); return 'The new guns were proved on the plain.'; } },
      { label: 'Decline', effect: () => 'He went to the next court.' },
    ],
  }),
  gen({
    id: 'hill_raja_marriage',
    title: 'A hill raja proposes a marriage',
    when: (s) => s.factions.hill_states.alive || s.factions.kangra.alive,
    ctx: () => ({}),
    text: () => 'A raja of the hills proposes to marry his daughter into your house, with a dowry of horses and a promise of friendship.',
    choices: [
      { label: 'Accept the alliance', detail: 'The hill states become friendly.', effect: (s) => { for (const f of ['hill_states', 'kangra']) { fx.attitude(s, f, P(s), 40); if (s.factions[f].relations[P(s)] !== 'war') fx.relation(s, f, P(s), 'alliance'); } fx.money(s, P(s), 10); return 'The marriage party wound up into the hills.'; } },
      { label: 'Decline graciously', effect: () => 'The raja understood, or said he did.' },
    ],
  }),
  gen({
    id: 'lohri',
    title: 'Lohri',
    mood: 'festive',
    season: 'diwali',
    ctx: () => ({}),
    text: () => 'At Lohri the bonfires burn in every village and the children go door to door singing of Dulla Bhatti, the rebel who stole from the rich to marry off poor girls.',
    choices: [
      { label: 'Light a great fire at your camp', detail: 'Morale.', effect: (s) => { for (const a of armiesOf(s, P(s))) a.morale = Math.min(100, a.morale + 5); return 'The camp danced around the fire.'; } },
    ],
  }),
  gen({
    id: 'teeyan',
    title: 'Teeyan',
    mood: 'festive',
    season: 'vaisakhi',
    ctx: inRegion(),
    text: (_s, c) => `In the monsoon the women of ${name(c)} gather for Teeyan under the trees, with swings and giddha. They ask that the soldiers stay out of their grove.`,
    choices: [
      { label: 'Order the camp to keep away', detail: 'Stability.', effect: (s, c) => (fx.stability(s, String(c.region), 6), 'The swings flew high.') },
    ],
  }),
  gen({
    id: 'jatha_quarrel',
    title: 'Quarrel in the jatha',
    ctx: withLeader((id, s) => !!s.leaders[id].armyId),
    text: (s, c) => `In ${ldr(s, c)}’s camp two riders have drawn swords over a horse. The whole jatha has taken sides.`,
    choices: [
      { label: 'Let the sardar settle it', effect: (s, c) => (fx.loyalty(s, String(c.leader), 3), 'The sardar settled it in his own way.') },
      { label: 'Settle it yourself', detail: 'Morale steadies; the sardar’s pride is hurt.', effect: (s, c) => { fx.loyalty(s, String(c.leader), -4); const a = s.armies[s.leaders[String(c.leader)].armyId ?? '']; if (a) a.morale = Math.min(100, a.morale + 6); return 'Both riders were sent to serve in the langar for a month.'; } },
    ],
  }),
  gen({
    id: 'horse_sickness',
    title: 'Sickness among the horses',
    ctx: (s) => (armiesOf(s, P(s)).some((a) => a.units.some((u) => u.type === 'ghorchare')) ? {} : null),
    text: () => 'A sickness has run through the horse lines. The salutris (horse-doctors) are bleeding the animals and shaking their heads.',
    choices: [
      { label: 'Buy fresh horses', detail: 'Costs 20.', available: afford(20), effect: (s) => (fx.money(s, P(s), -20), 'The jathas were remounted.') },
      { label: 'Ride the sick horses', detail: 'Morale and men lost.', effect: (s) => { fx.losses(s, P(s), 0.03); for (const a of armiesOf(s, P(s))) a.morale -= 6; return 'Some riders walked home.'; } },
    ],
  }),
  gen({
    id: 'granthi_request',
    title: 'A copy of the scripture',
    when: (s) => sikhPlayer(s),
    ctx: inRegion((r) => REGION_BY_ID[r].faith.sikh >= 20),
    text: (_s, c) => `The sangat of ${name(c)} has no hand-written bir of the Guru Granth Sahib for its gurdwara. A scribe at Damdama could prepare one, but the paper and ink are costly.`,
    choices: [
      { label: 'Pay the scribe', detail: 'Costs 8. Piri.', available: afford(8), effect: (s, c) => (fx.money(s, P(s), -8), fx.piri(s, P(s), 1.5, 'A bir for the sangat'), fx.stability(s, String(c.region), 5), 'The bir was carried to the village on the head of the granthi, with drums.') },
      { label: 'Not this year', effect: () => 'The sangat waited.' },
    ],
  }),
  gen({
    id: 'sarai_request',
    title: 'Merchants ask for a sarai',
    ctx: inRegion((r, s) => !!REGION_BY_ID[r].gtRoad && !s.regions[r].buildings.includes('sarai')),
    text: (_s, c) => `Travellers on the road through ${name(c)} sleep in the open and are robbed. The merchants offer half the cost of a sarai.`,
    choices: [
      { label: 'Build it', detail: 'Costs 10. A sarai is built.', available: afford(10), effect: (s, c) => (fx.money(s, P(s), -10), s.regions[String(c.region)].buildings.push('sarai'), 'A sarai rose with a well and a mosque and a dharamsala.') },
      { label: 'Decline', effect: () => 'The travellers slept in the open.' },
    ],
  }),
  gen({
    id: 'drought_winter',
    title: 'No winter rain',
    season: 'diwali',
    ctx: inRegion((r) => REGION_BY_ID[r].terrain === 'bar' || REGION_BY_ID[r].terrain === 'desert'),
    text: (_s, c) => `The winter rains have not come to ${name(c)}. The camels are thin and the wells brackish.`,
    choices: [
      { label: 'Dig new wells', detail: 'Costs 10.', available: afford(10), effect: (s, c) => (fx.money(s, P(s), -10), fx.stability(s, String(c.region), 8), 'Sweet water was found at forty hands.') },
      { label: 'Wait for rain', effect: (s, c) => (fx.devastate(s, String(c.region), 0.15), 'The rain came late.') },
    ],
  }),
  gen({
    id: 'gift_horses_afghan',
    title: 'Afghan horse-traders',
    ctx: () => ({}),
    text: () => 'Afghan horse-traders, who come every year whatever the kings are doing, have brought a string of fine stallions.',
    choices: [
      { label: 'Buy the best of them', detail: 'Costs 12. Your leader’s martial skill improves.', available: afford(12), effect: (s) => { fx.money(s, P(s), -12); const c = s.factions[P(s)].chief; if (c && s.leaders[c]) s.leaders[c].martial = Math.min(5, s.leaders[c].martial + 1); return 'You rode the grey stallion into every battle after.'; } },
      { label: 'Trade fairly and let them go', effect: (s) => (fx.money(s, P(s), 4), 'The traders went on to Amritsar.') },
    ],
  }),
  gen({
    id: 'sufi_poet',
    title: 'A poet at court',
    ctx: () => ({}),
    text: () => 'A Sufi poet recites a qissa of Heer and Ranjha at your court, in Punjabi so sweet the guards stop to listen.',
    choices: [
      { label: 'Reward him', detail: 'Costs 4. Legend.', available: afford(4), effect: (s) => (fx.money(s, P(s), -4), fx.legend(s, P(s), 1), 'His verses were copied in every bazaar.') },
      { label: 'Listen, and thank him', effect: () => 'The poet smiled and moved on.' },
    ],
  }),
  gen({
    id: 'reconcile_misl',
    title: 'Envoys from a rival misl',
    when: (s) => sikhPlayer(s) && Object.values(s.factions).some((f) => f.alive && isSikh(f.id) && f.id !== P(s) && s.factions[P(s)].relations[f.id] === 'war'),
    ctx: (s) => {
      const f = Object.values(s.factions).filter((x) => x.alive && isSikh(x.id) && x.id !== P(s) && s.factions[P(s)].relations[x.id] === 'war');
      return f.length ? { faction: pick(s, f).id } : null;
    },
    text: (_s, c) => `Envoys of the ${String(c.faction)} misl come to your camp with covered heads. They say brothers should not kill brothers while the Afghans watch.`,
    choices: [
      { label: 'Make peace before the Akal Takht', detail: 'Peace; Piri rises.', effect: (s, c) => (fx.relation(s, P(s), String(c.faction), 'peace'), fx.piri(s, P(s), 2, 'Peace among the misls'), 'Peace was sworn before the Akal Takht.') },
      { label: 'Send them back', effect: (s) => (fx.piri(s, P(s), -1, 'Refusing peace with fellow Sikhs'), 'The war goes on.') },
    ],
  }),
  gen({
    id: 'bandi_chhor',
    title: 'Bandi Chhor',
    season: 'diwali',
    when: (s) => sikhPlayer(s),
    ctx: () => ({}),
    text: () => 'On Bandi Chhor Divas the Sikhs remember how Guru Hargobind Ji, released from Gwalior fort, would not leave without the fifty-two rajas imprisoned with him.',
    choices: [
      { label: 'Release your prisoners of war', detail: 'Piri; enemies soften.', effect: (s) => { fx.piri(s, P(s), 1.5, 'Releasing prisoners at Bandi Chhor'); for (const f of Object.keys(s.factions)) fx.attitude(s, f, P(s), 5); return 'The prisoners walked home with lamps in their hands.'; } },
      { label: 'Light the lamps', effect: () => 'The lamps burned all night.' },
    ],
  }),
  gen({
    id: 'veteran_retires',
    title: 'An old sardar asks leave',
    ctx: withLeader((id, s) => year(s) - s.leaders[id].born > 60 && !s.leaders[id].female),
    text: (s, c) => `${ldr(s, c)}, grey and scarred, asks leave to retire to his village and spend his last years at the gurdwara there.`,
    choices: [
      { label: 'Grant it with honour', detail: 'He leaves your service; Piri rises.', effect: (s, c) => { const L = s.leaders[String(c.leader)]; if (L.armyId && s.armies[L.armyId]) s.armies[L.armyId].leader = undefined; L.armyId = undefined; L.active = false; fx.piri(s, P(s), 1, 'Honouring an old sardar'); return 'The old sardar rode home with a robe of honour.'; } },
      { label: 'Ask him to stay one more season', effect: (s, c) => (fx.loyalty(s, String(c.leader), -5), 'He stayed, out of duty.') },
    ],
  }),
  gen({
    id: 'earth_tremor',
    title: 'The earth shakes',
    ctx: inRegion((r) => ['hills', 'mountain'].includes(REGION_BY_ID[r].terrain)),
    text: (_s, c) => `An earthquake has shaken ${name(c)}. Walls are cracked and a tower of the fort has fallen.`,
    choices: [
      { label: 'Repair the fort at once', detail: 'Costs 15.', available: afford(15), effect: (s, c) => (fx.money(s, P(s), -15), fx.stability(s, String(c.region), 4), 'The masons worked through the winter.') },
      { label: 'Leave it', effect: (s, c) => { const st = s.regions[String(c.region)]; st.fort = Math.max(0, st.fort - 1); return 'The fort is weaker now.'; } },
    ],
  }),
  gen({
    id: 'army_pay',
    title: 'The soldiers ask for their pay',
    when: (s) => s.factions[P(s)].treasury < 20 && armiesOf(s, P(s)).reduce((t, a) => t + armyMen(a), 0) > 3000,
    ctx: () => ({}),
    text: () => 'The men have not been paid in months. Their panchayat sits outside your tent.',
    choices: [
      { label: 'Pay what you can and promise the rest', detail: 'Costs up to 15.', effect: (s) => (fx.money(s, P(s), -Math.min(15, Math.max(0, s.factions[P(s)].treasury))), 'The men went back to their lines.') },
      { label: 'Let them forage on the enemy', detail: 'Morale holds; Piri falls.', effect: (s) => (fx.piri(s, P(s), -1.5, 'Letting unpaid soldiers forage'), 'The villages suffered.') },
    ],
  }),
  gen({
    id: 'scholar_visit',
    title: 'A scholar from Damdama',
    when: (s) => sikhPlayer(s),
    ctx: () => ({}),
    text: () => 'A learned Singh from Damdama Sahib — where the scripture was completed and copied — comes to teach your sardars to read Gurmukhi.',
    choices: [
      { label: 'Keep him at your court', detail: 'Costs 5. A random sardar becomes just.', available: afford(5), effect: (s) => { fx.money(s, P(s), -5); const l = Object.values(s.leaders).find((x) => x.alive && x.faction === P(s) && !x.traits.includes('just')); if (l) l.traits.push('just'); return 'The sardars learned their letters.'; } },
      { label: 'Thank him', effect: () => 'He returned to Damdama.' },
    ],
  }),
];

