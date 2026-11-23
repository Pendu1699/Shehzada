# Music and sound

Every sound in the game is synthesised at runtime with the Web Audio API
(`src/audio/engine.ts`). There are no recordings.

## The drone

A tanpura-style drone plays under everything: four plucked strings in the classic
**Pa – Sa' – Sa' – Sa** cycle. Each pluck is a sawtooth with a few harmonics passed
through a soft waveshaper and a sweeping band-pass filter, which imitates the buzzing
*jawari* bridge that gives the tanpura its shimmer. The tonic shifts by era:

| Era | Sa | Why |
|---|---|---|
| 1748–1798, the misl years | C | A neutral, open centre for a century that has not yet decided what it will be. |
| 1799–1838, the Sarkar | D | A whole tone higher: the brighter, more confident sound of an empire. |
| 1839–1849, the twilight | B♭ | Lower than where the game began: the ground has given way. |

In mourning (a desecration, a martyrdom) the drone drops in volume and slows.

## The sarangi voice

A bowed voice — two slightly detuned sawtooth oscillators, a band-pass "body", a peak
around 2.6 kHz for the nasal skin-belly resonance, vibrato that deepens through each
note, and *meend* (a glide into each note) — plays short raga-inflected phrases over
the drone. The phrases are original; they use the characteristic note-sets and
movements of each raga, not any composition.

| Mood | Raga | Reason |
|---|---|---|
| Title | **Bilaval** | The major-scale morning raga: the dawn over the sarovar. |
| Exploration | **Pahadi** (pentatonic) | The folk colour of the hills and villages of the Punjab. |
| Monsoon turns | **Desh** | The classic raga of the rains in North India. |
| War | **Maru** (here with a Bihag-like tivra Ma colour) | Maru has long been associated with valour and the battlefield. |
| Mourning: the Ghallugharas, desecration, martyrdom | **Bhairavi** | The raga of pathos, with its flat second, third, sixth and seventh. |
| Celebration: victory, sovereignty | **Khamaj** | Festive and light. |
| Diwali turns | **Yaman** | The evening raga, for a night of lamps. |
| The twilight after 1839 | **Marwa** | The dusk raga of unease, with its restless komal Re. |

## Drums

- **Nagara** — the great war kettledrum: a low sine with a falling pitch and a burst of
  filtered noise. Struck when you end a turn, between battle rounds and in war music.
- **Dhol** — two heads: the bass *dagga* and the sharp *tilli*, in the bhangra *chaal*
  rhythm (dha . ge na | dha . ge na), for victories and Vaisakhi.
- **Dhadd** — the dhadi's small hourglass drum, whose pitch bends as the player
  squeezes the lacing: played under the dhadi's narration and on Diwali turns.

## Interface sounds

- Paper rustle (fluttering band-passed noise) for opening the ledger and panels.
- A quill stroke (short high band-passed noise) for orders and choices.
- A soft metallic ting (three inharmonic sine partials) for gold.

## What the game does not do

Kirtan and Gurbani recitation are never synthesised or imitated. The sarangi voice
plays instrumental raga phrases only.

## Controls

Master, music and effects volume sliders and a mute switch are in **Settings**.
