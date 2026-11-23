// Glossary of key terms, with Gurmukhi where the spelling is well established.
// Any spelling marked `review: true` is listed in GURMUKHI_REVIEW.md for a native
// reader to check. Do not add Gurmukhi here without that care.

export interface GlossaryEntry {
  id: string;
  term: string;
  gurmukhi?: string;
  translit: string;
  gloss: string;
  review?: boolean;
}

export const GLOSSARY: GlossaryEntry[] = [
  { id: 'khalsa', term: 'Khalsa', gurmukhi: 'ਖ਼ਾਲਸਾ', translit: 'Khālsā', gloss: 'The order of initiated Sikhs created by Guru Gobind Singh Ji at Vaisakhi 1699; also the collective body of the Sikhs.' },
  { id: 'panth', term: 'Panth', gurmukhi: 'ਪੰਥ', translit: 'Panth', gloss: 'The Sikh community as a whole, the "path".' },
  { id: 'sarbat_khalsa', term: 'Sarbat Khalsa', gurmukhi: 'ਸਰਬੱਤ ਖ਼ਾਲਸਾ', translit: 'Sarbatt Khālsā', gloss: 'The assembly of the whole Khalsa, held at Amritsar at Vaisakhi and Diwali in the misl era.' },
  { id: 'gurmata', term: 'Gurmata', gurmukhi: 'ਗੁਰਮਤਾ', translit: 'Gurmatā', gloss: 'A resolution adopted by the Sarbat Khalsa before the Akal Takht, binding on all.' },
  { id: 'misl', term: 'Misl', gurmukhi: 'ਮਿਸਲ', translit: 'Misl', gloss: 'One of the confederate Sikh chiefships of the eighteenth century, each led by a misldar.' },
  { id: 'dal_khalsa', term: 'Dal Khalsa', gurmukhi: 'ਦਲ ਖ਼ਾਲਸਾ', translit: 'Dal Khālsā', gloss: 'The combined army of the misls, organised in 1748.' },
  { id: 'budha_dal', term: 'Budha Dal', gurmukhi: 'ਬੁੱਢਾ ਦਲ', translit: 'Buḍḍhā Dal', gloss: 'The army of the veterans, organised under Nawab Kapur Singh.' },
  { id: 'taruna_dal', term: 'Taruna Dal', gurmukhi: 'ਤਰੁਣਾ ਦਲ', translit: 'Taruṇā Dal', gloss: 'The army of the younger fighters.' },
  { id: 'rakhi', term: 'Rakhi', gurmukhi: 'ਰਾਖੀ', translit: 'Rākhī', gloss: 'Protection: villages paid a misl about a fifth of their produce, and the misl was bound to defend them.' },
  { id: 'jagir', term: 'Jagir', gurmukhi: 'ਜਾਗੀਰ', translit: 'Jāgīr', gloss: 'A grant of land revenue to a sardar in return for service.' },
  { id: 'langar', term: 'Langar', gurmukhi: 'ਲੰਗਰ', translit: 'Langar', gloss: 'The free community kitchen, open to all regardless of faith or caste.' },
  { id: 'miri', term: 'Miri', gurmukhi: 'ਮੀਰੀ', translit: 'Mīrī', gloss: 'Temporal authority; one of the two swords of Guru Hargobind Ji.' },
  { id: 'piri', term: 'Piri', gurmukhi: 'ਪੀਰੀ', translit: 'Pīrī', gloss: 'Spiritual authority; the other sword. In the game, the cohesion and moral standing of your polity.' },
  { id: 'akal_takht', term: 'Akal Takht', gurmukhi: 'ਅਕਾਲ ਤਖ਼ਤ', translit: 'Akāl Takhat', gloss: 'The Throne of the Timeless One at Amritsar, facing the Harmandir Sahib.' },
  { id: 'harmandir', term: 'Harmandir Sahib', gurmukhi: 'ਹਰਿਮੰਦਰ ਸਾਹਿਬ', translit: 'Harimandar Sāhib', gloss: 'The holiest gurdwara of the Sikhs, at Amritsar.' },
  { id: 'gurdwara', term: 'Gurdwara', gurmukhi: 'ਗੁਰਦੁਆਰਾ', translit: 'Gurduārā', gloss: 'A Sikh place of worship.' },
  { id: 'ghallughara', term: 'Ghallughara', gurmukhi: 'ਘੱਲੂਘਾਰਾ', translit: 'Ghallūghārā', gloss: 'A holocaust or massacre. The Chhota (lesser) Ghallughara of 1746 and the Vadda (great) Ghallughara of 1762.' },
  { id: 'vadda_ghallughara', term: 'Vadda Ghallughara', gurmukhi: 'ਵੱਡਾ ਘੱਲੂਘਾਰਾ', translit: 'Vaḍḍā Ghallūghārā', gloss: 'The great massacre near Kup in February 1762, when Ahmad Shah fell on the Sikhs and their families.' },
  { id: 'dhadi', term: 'Dhadi', gurmukhi: 'ਢਾਡੀ', translit: 'Ḍhāḍī', gloss: 'A bard who sings heroic ballads to the dhadd and sarangi.' },
  { id: 'vaar', term: 'Vaar', gurmukhi: 'ਵਾਰ', translit: 'Vār', gloss: 'A heroic ballad.' },
  { id: 'dhadd', term: 'Dhadd', gurmukhi: 'ਢੱਡ', translit: 'Ḍhaḍḍ', gloss: 'A small hourglass drum played by dhadis.' },
  { id: 'sarangi', term: 'Sarangi', gurmukhi: 'ਸਾਰੰਗੀ', translit: 'Sāraṅgī', gloss: 'A bowed stringed instrument.' },
  { id: 'nishan_sahib', term: 'Nishan Sahib', gurmukhi: 'ਨਿਸ਼ਾਨ ਸਾਹਿਬ', translit: 'Nishān Sāhib', gloss: 'The Sikh flag, flown at every gurdwara; it bears the Khanda.' },
  { id: 'khanda', term: 'Khanda', gurmukhi: 'ਖੰਡਾ', translit: 'Khaṇḍā', gloss: 'The emblem of a double-edged sword within a chakkar and two kirpans.' },
  { id: 'nihang', term: 'Nihang', gurmukhi: 'ਨਿਹੰਗ', translit: 'Nihaṅg', gloss: 'The blue-clad warrior order, also called Akalis.' },
  { id: 'akali', term: 'Akali', gurmukhi: 'ਅਕਾਲੀ', translit: 'Akālī', gloss: 'Follower of the Timeless One; a name of the Nihangs.' },
  { id: 'jatha', term: 'Jatha', gurmukhi: 'ਜਥਾ', translit: 'Jathā', gloss: 'A band of Sikh fighters.' },
  { id: 'sardar', term: 'Sardar', gurmukhi: 'ਸਰਦਾਰ', translit: 'Sardār', gloss: 'A chief or commander.' },
  { id: 'darbar', term: 'Darbar', gurmukhi: 'ਦਰਬਾਰ', translit: 'Darbār', gloss: 'A royal court.' },
  { id: 'doab', term: 'Doab', gurmukhi: 'ਦੁਆਬ', translit: 'Duāb', gloss: 'The land between two rivers.' },
  { id: 'josh', term: 'Josh', gurmukhi: 'ਜੋਸ਼', translit: 'Josh', gloss: 'Ardour, righteous fury.' },
  { id: 'shaheed', term: 'Shaheed', gurmukhi: 'ਸ਼ਹੀਦ', translit: 'Shahīd', gloss: 'A martyr.' },
  { id: 'nagara', term: 'Nagara', gurmukhi: 'ਨਗਾਰਾ', translit: 'Nagārā', gloss: 'A great kettledrum beaten for war and assembly.' },
  { id: 'kesri', term: 'Kesri', gurmukhi: 'ਕੇਸਰੀ', translit: 'Kesrī', gloss: 'Saffron, the colour of the Nishan Sahib.' },
  { id: 'vaisakhi', term: 'Vaisakhi', gurmukhi: 'ਵਿਸਾਖੀ', translit: 'Visākhī', gloss: 'The spring harvest festival; the anniversary of the creation of the Khalsa.' },
  { id: 'diwali', term: 'Diwali', gurmukhi: 'ਦੀਵਾਲੀ', translit: 'Dīvālī', gloss: 'The autumn festival of lamps; for Sikhs also Bandi Chhor Divas.' },
  { id: 'hola_mohalla', term: 'Hola Mohalla', gurmukhi: 'ਹੋਲਾ ਮਹੱਲਾ', translit: 'Holā Mahallā', gloss: 'The martial festival held at Anandpur in spring.' },
  { id: 'dhai_phat', term: 'Dhai Phat', gurmukhi: 'ਢਾਈ ਫੱਟ', translit: 'Ḍhāī Phaṭṭ', gloss: '"Two and a half strikes": the hit-and-run tactic of the misl horse.', review: true },
  { id: 'ghorchare', term: 'Ghorchare', gurmukhi: 'ਘੋੜਚੜ੍ਹੇ', translit: 'Ghoṛcaṛhe', gloss: 'Horsemen; the cavalry of the misls.', review: true },
  { id: 'sarkar', term: 'Sarkar-i-Khalsa', gurmukhi: 'ਸਰਕਾਰ-ਏ-ਖ਼ਾਲਸਾ', translit: 'Sarkār-i-Khālsā', gloss: 'The government of the Khalsa: the state built by Maharaja Ranjit Singh.', review: true },
  { id: 'toshakhana', term: 'Toshakhana', gurmukhi: 'ਤੋਸ਼ਾਖ਼ਾਨਾ', translit: 'Toshākhānā', gloss: 'The royal treasury of jewels and prestige objects.', review: true },
  { id: 'bahi_khata', term: 'Bahi-khata', gurmukhi: 'ਵਹੀ-ਖਾਤਾ', translit: 'Vahī-khātā', gloss: 'The traditional red cloth-bound account book.', review: true },
  { id: 'nazrana', term: 'Nazrana', translit: 'Nazrānā', gloss: 'A tribute or offering made on submission.' },
  { id: 'sarai', term: 'Sarai', translit: 'Sarāī', gloss: 'A rest-house for travellers and caravans.' },
  { id: 'wasli', term: 'Wasli', translit: 'Waslī', gloss: 'Layered handmade paper used for miniature painting.' },
  { id: 'phulkari', term: 'Phulkari', gurmukhi: 'ਫੁਲਕਾਰੀ', translit: 'Phulkārī', gloss: 'Punjabi floss-silk embroidery; bagh phulkari covers the whole cloth.' },
];

export const TITLE_GURMUKHI = 'ਰਾਜ ਕਰੇਗਾ ਖ਼ਾਲਸਾ';
export const PUNJAB_GURMUKHI = 'ਪੰਜਾਬ';
export const G = Object.fromEntries(GLOSSARY.map((g) => [g.id, g]));
