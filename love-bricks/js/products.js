// Ukázková data produktů Love Bricks (zatím nic neprodáváme – ceny a parametry jsou orientační).
export const OCCASIONS = {
  pary: 'Pro páry',
  maminka: 'Pro maminku',
  rodina: 'Pro rodinu',
  auta: 'Pro milovníky aut'
};

const BOT = 'Botanická kolekce', CAR = 'Kolekce aut', BIG = 'Sběratelská auta';

export const ALL = [
  // ------------------------------------------------ květiny
  { id: 'orchid', model: 'orchid', name: 'Orchidej', line: BOT, price: 1399, old: 1599, pieces: 608, size: '39 cm', age: '18+', tags: ['maminka', 'pary'], featured: true,
    kicker: 'Bestseller pro maminky', desc: 'Bílá orchidej v šedomodrém květináči. Nikdy nezvadne.',
    variant: { key: 'pot', label: 'Květináč', options: [['Šedomodrý', '#7F8FA6'], ['Bílý', '#F2F3F2'], ['Grafit', '#3E4347']] }, bg: '#EFE6F8', ink: '#2B1838', accent: '#D3359D', word: 'ORCHIDEJ' },
  { id: 'miniorchid', model: 'miniorchid', name: 'Mini orchidej', line: BOT, price: 749, pieces: 274, size: '26 cm', age: '18+', tags: ['pary', 'maminka'], featured: true,
    kicker: 'Malá radost na stůl', desc: 'Malá broskvová orchidej na noční stolek.',
    variant: { key: 'petal', label: 'Květy', options: [['Broskvové', '#F7CBA8'], ['Bílé', '#F2F3F2'], ['Růžové', '#FC97AC']] }, bg: '#FFF1E4', ink: '#3A2208', accent: '#E07B39', word: 'MINI' },
  { id: 'tulips', model: 'tulips', name: 'Kytice tulipánů', line: BOT, price: 1399, pieces: 576, size: '38 cm', age: '18+', tags: ['maminka', 'pary'], featured: true,
    kicker: 'Jaro, které nezvadne', desc: 'Barevné tulipány, které vydrží navždy. Váza v ukázce není součástí balení.',
    variant: { key: null, label: 'Provedení', options: [['Originál', '#F6A9C8']] }, bg: '#FFE6EC', ink: '#3B0A1E', accent: '#D01012', word: 'TULIPÁNY' },
  { id: 'bouquet', model: 'bouquet', name: 'Kytice květin', line: BOT, price: 1399, pieces: 756, size: '37 cm', age: '18+', tags: ['maminka', 'pary'],
    kicker: 'Růže, sedmikrásky a levandule', desc: 'Pestrá kytice z růží, sedmikrásek, levandule a dalších květů. Váza v ukázce není součástí balení.',
    variant: { key: null, label: 'Provedení', options: [['Originál', '#F2B48C']] }, bg: '#F1F4EC', ink: '#1F2A1A', accent: '#E07B39', word: 'KYTICE' },
  { id: 'tinyplants', model: 'tinyplants', name: 'Malé rostlinky', line: BOT, price: 1499, pieces: 758, size: '9 květináčků', age: '18+', tags: ['rodina', 'maminka'],
    kicker: 'Devět mini zahrádek', desc: 'Devět mini květináčků s kaktusy a sukulenty.',
    variant: { key: 'pot', label: 'Květináčky', options: [['Terakota', '#A3501E'], ['Bílé', '#F2F3F2'], ['Grafit', '#3E4347']] }, bg: '#F6ECDD', ink: '#3A2208', accent: '#A3501E', word: 'ROSTLINKY' },
  { id: 'cactus', model: 'cactus', name: 'Kvetoucí kaktus', line: BOT, price: 899, pieces: 482, size: '28 cm', age: '9+', tags: ['rodina', 'pary'],
    kicker: 'Pichlavá láska', desc: 'Dva kaktusy s růžovým květem v modrém květináči.',
    variant: { key: 'pot', label: 'Květináč', options: [['Světle modrý', '#9CC8EC'], ['Růžový', '#FC97AC'], ['Bílý', '#F2F3F2']] }, bg: '#E5F1FB', ink: '#0E2A44', accent: '#E4569A', word: 'KAKTUS' },
  { id: 'chrysanthemum', model: 'chrysanthemum', name: 'Chryzantéma', line: BOT, price: 1049, pieces: 278, size: '34 cm', age: '18+', tags: ['maminka'], featured: true,
    kicker: 'Elegance s tradicí', desc: 'Oranžová chryzantéma v zelené váze.',
    variant: { key: 'flower', label: 'Květy', options: [['Oranžové', '#FE8A18'], ['Žluté', '#F5C518'], ['Růžové', '#E4569A']] }, bg: '#FFF0DE', ink: '#3A1E06', accent: '#E2541B', word: 'CHRYZANTÉMA' },
  { id: 'peacelily', model: 'peacelily', name: 'Lopatkovec', line: BOT, price: 1199, pieces: 424, size: '37 cm', age: '18+', tags: ['maminka', 'rodina'],
    kicker: 'Zelený klid domova', desc: 'Zelená pokojovka s bílými květy, nepotřebuje zalévat.',
    variant: { key: 'pot', label: 'Květináč', options: [['Broskvový', '#E9B98F'], ['Bílý', '#F2F3F2'], ['Terakota', '#A3501E']] }, bg: '#E7F5E4', ink: '#0F2C14', accent: '#2C9A3C', word: 'LOPATKOVEC' },
  { id: 'plum', model: 'plum', name: 'Kvetoucí slivoň', line: BOT, price: 1199, pieces: 327, size: '45 cm', age: '18+', tags: ['pary', 'maminka'],
    kicker: 'Japonská jarní větev', desc: 'Tmavá větev s rudými květy ve vysoké váze.',
    variant: { key: 'flower', label: 'Květy', options: [['Rudé', '#C91A09'], ['Růžové', '#FC97AC'], ['Bílé', '#F2F3F2']] }, bg: '#F6E4E8', ink: '#3B0A12', accent: '#C91A09', word: 'SLIVOŇ' },
  { id: 'bonsai', model: 'bonsai', name: 'Bonsaj', line: BOT, price: 1399, pieces: 878, size: '18 cm', age: '18+', tags: ['rodina', 'pary'], featured: true,
    kicker: 'Zelená nebo v květu', desc: 'Bonsaj na dřevěném stojánku. Listy vyměníš za růžovou sakuru.',
    variant: { key: 'foliage', label: 'Koruna', options: [['Zelená', '#4B9F4A'], ['Sakura', '#F59BC0']] }, bg: '#EAF2E1', ink: '#1A2A10', accent: '#4B9F4A', word: 'BONSAJ' },
  // ------------------------------------------------ auta (skutečné modely z originálních dílků)
  { id: 'sian', model: 'sian', name: 'Lamborghini růžové', line: CAR, price: 590, pieces: 420, size: '21 cm', age: '8+', tags: ['auta', 'pary'], featured: true,
    kicker: 'Pro holky, co milují rychlost', desc: 'Malý růžový supersport s otevřenou kabinou, růžovými trubkami a černým spoilerem.',
    variant: { key: 'body', label: 'Lak', options: [['Růžová', '#F4B6CF']] }, bg: '#FFE4EF', ink: '#3B0A22', accent: '#D3359D', word: 'ROSA' },
  { id: 'sianblack', model: 'sianblack', name: 'Lamborghini černo-zlaté', line: CAR, price: 590, pieces: 420, size: '21 cm', age: '8+', tags: ['auta', 'rodina'], featured: true,
    kicker: 'Černá se zlatou', desc: 'Malý černý supersport se zlatými disky a černým spoilerem.',
    variant: { key: 'body', label: 'Lak', options: [['Černá', '#1B1D22']] }, bg: '#1E2226', ink: '#F4F6F8', accent: '#C9A44C', accentInk: '#1B1D22', word: 'NERO', dark: true },
  { id: 'chiron', model: 'chiron', name: 'Bugatti modré', line: BIG, price: 899, pieces: 1388, size: '34,5 cm', age: '14+', tags: ['auta', 'rodina'], featured: true,
    kicker: 'Hypersport v modré', desc: 'Světle modrá příď s podkovou masky, tmavě modrá záď a bílý oblouk kolem dveří.',
    variant: { key: 'body', label: 'Lak', options: [['Modrá', '#4A93C6']] }, bg: '#E3EEF7', ink: '#0E2A44', accent: '#2E6FA8', word: 'BUGATTI' },
  { id: 'gulf', model: 'gulf', name: 'Porsche GT3 RS Gulf', line: BIG, price: 1490, pieces: 1300, size: '33 cm', age: '14+', tags: ['auta', 'pary'], featured: true,
    kicker: 'Závodní legenda', desc: 'Porsche v legendárních barvách Gulf, světle modrá s oranžovou a velké zadní křídlo.',
    variant: { key: 'body', label: 'Lak', options: [['Gulf modrá', '#8EC5E8']] }, bg: '#E3F1FA', ink: '#0E2A44', accent: '#F07A1E', word: 'GULF' },
  { id: 'turbo', model: 'turbo', name: 'Porsche 911 Turbo černé', line: CAR, price: 590, pieces: 320, size: '17 cm', age: '8+', tags: ['auta', 'rodina'], featured: true,
    kicker: 'Malá klasika', desc: 'Černá devětsetjedenáctka Turbo s velkým zadním spoilerem, malé měřítko do poličky.',
    variant: { key: 'body', label: 'Lak', options: [['Černá', '#1B1D22']] }, bg: '#ECEEF0', ink: '#1A1D21', accent: '#F57C1F', word: 'TURBO' }
];

export const PRODUCTS = ALL.filter(p => p.featured);
export const byId = (id) => ALL.find(p => p.id === id);
export const fmt = (n) => n.toLocaleString('cs-CZ') + ' Kč';
export const FREE_SHIP = 1500;
