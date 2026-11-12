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
    kicker: 'Bestseller pro maminky', desc: 'Elegantní bílá orchidej s růžovým středem, tmavými listy a vzdušnými kořínky v šedomodrém květináči. Kvete napořád a nikdy nepotřebuje zalít.',
    variant: { key: 'pot', label: 'Květináč', options: [['Šedomodrý', '#7F8FA6'], ['Bílý', '#F2F3F2'], ['Grafit', '#3E4347']] }, bg: '#EFE6F8', ink: '#2B1838', accent: '#D3359D', word: 'ORCHIDEJ' },
  { id: 'miniorchid', model: 'miniorchid', name: 'Mini orchidej', line: BOT, price: 749, pieces: 274, size: '26 cm', age: '18+', tags: ['pary', 'maminka'], featured: true,
    kicker: 'Malá radost na stůl', desc: 'Broskvové květy s oranžovo-růžovým středem v kulatém květináči se zlatým proužkem na dřevěném stojánku. Přesně tak velká, aby se vešla na noční stolek.',
    variant: { key: 'petal', label: 'Květy', options: [['Broskvové', '#F7CBA8'], ['Bílé', '#F2F3F2'], ['Růžové', '#FC97AC']] }, bg: '#FFF1E4', ink: '#3A2208', accent: '#E07B39', word: 'MINI' },
  { id: 'tulips', model: 'tulips', name: 'Kytice tulipánů', line: BOT, price: 1399, pieces: 576, size: '38 cm', age: '18+', tags: ['maminka', 'pary'], featured: true,
    kicker: 'Jaro, které nezvadne', desc: 'Dvanáct tulipánů v barvách jara – růžové, fialové, červené, žluté i oranžové liliokvěté, s otevřenými květy a zelenými poupaty.',
    variant: { key: null, label: 'Provedení', options: [['Originál', '#F6A9C8']] }, bg: '#FFE6EC', ink: '#3B0A1E', accent: '#D01012', word: 'TULIPÁNY' },
  { id: 'tinyplants', model: 'tinyplants', name: 'Malé rostlinky', line: BOT, price: 1499, pieces: 758, size: '9 květináčků', age: '18+', tags: ['rodina', 'maminka'],
    kicker: 'Devět mini zahrádek', desc: 'Devět terakotových květináčků: kaktusy, sukulenty, masožravky i kvetoucí rostlinky. Dají se rozestavit po celém bytě.',
    variant: { key: 'pot', label: 'Květináčky', options: [['Terakota', '#A3501E'], ['Bílé', '#F2F3F2'], ['Grafit', '#3E4347']] }, bg: '#F6ECDD', ink: '#3A2208', accent: '#A3501E', word: 'ROSTLINKY' },
  { id: 'cactus', model: 'cactus', name: 'Kvetoucí kaktus', line: BOT, price: 899, pieces: 482, size: '28 cm', age: '9+', tags: ['rodina', 'pary'],
    kicker: 'Pichlavá láska', desc: 'Dva žebrované kaktusy s bodlinkami, velkým růžovým květem a malými růžičkami ve světle modrém oválném květináči.',
    variant: { key: 'pot', label: 'Květináč', options: [['Světle modrý', '#9CC8EC'], ['Růžový', '#FC97AC'], ['Bílý', '#F2F3F2']] }, bg: '#E5F1FB', ink: '#0E2A44', accent: '#E4569A', word: 'KAKTUS' },
  { id: 'chrysanthemum', model: 'chrysanthemum', name: 'Chryzantéma', line: BOT, price: 1049, pieces: 278, size: '34 cm', age: '18+', tags: ['maminka'], featured: true,
    kicker: 'Elegance s tradicí', desc: 'Dva velké oranžové květy z desítek tenkých lístků, poupata a zubaté listy v šalvějově zelené váze se zlatým páskem na vyřezávaném stojánku.',
    variant: { key: 'flower', label: 'Květy', options: [['Oranžové', '#FE8A18'], ['Žluté', '#F5C518'], ['Růžové', '#E4569A']] }, bg: '#FFF0DE', ink: '#3A1E06', accent: '#E2541B', word: 'CHRYZANTÉMA' },
  { id: 'peacelily', model: 'peacelily', name: 'Lopatkovec', line: BOT, price: 1199, pieces: 424, size: '37 cm', age: '18+', tags: ['maminka', 'rodina'],
    kicker: 'Zelený klid domova', desc: 'Sytě zelené listy a bílé květy se žlutou paličkou v květináči z broskvových válečků. Pokojovka, která přežije i dovolenou.',
    variant: { key: 'pot', label: 'Květináč', options: [['Broskvový', '#E9B98F'], ['Bílý', '#F2F3F2'], ['Terakota', '#A3501E']] }, bg: '#E7F5E4', ink: '#0F2C14', accent: '#2C9A3C', word: 'LOPATKOVEC' },
  { id: 'plum', model: 'plum', name: 'Kvetoucí slivoň', line: BOT, price: 1199, pieces: 327, size: '45 cm', age: '18+', tags: ['pary', 'maminka'],
    kicker: 'Japonská jarní větev', desc: 'Kroucená tmavá větev s rudými květy a purpurovými poupaty ve vysoké šedomodré váze se zlatým páskem na dřevěném stojánku.',
    variant: { key: 'flower', label: 'Květy', options: [['Rudé', '#C91A09'], ['Růžové', '#FC97AC'], ['Bílé', '#F2F3F2']] }, bg: '#F6E4E8', ink: '#3B0A12', accent: '#C91A09', word: 'SLIVOŇ' },
  { id: 'bonsai', model: 'bonsai', name: 'Bonsaj', line: BOT, price: 1399, pieces: 878, size: '18 cm', age: '18+', tags: ['rodina', 'pary'], featured: true,
    kicker: 'Zelená nebo v květu', desc: 'Kroucený kmen v černé misce s oblázky na dřevěném stojánku. Listy můžeš vyměnit za růžové květy sakury – dva stromky v jednom.',
    variant: { key: 'foliage', label: 'Koruna', options: [['Zelená', '#4B9F4A'], ['Sakura', '#F59BC0']] }, bg: '#EAF2E1', ink: '#1A2A10', accent: '#4B9F4A', word: 'BONSAJ' },
  // ------------------------------------------------ auta
  { id: 'chiron', model: 'chiron', name: 'Bugatti Chiron', line: CAR, price: 1599, pieces: 771, size: '33 cm', age: '9+', tags: ['auta', 'rodina'],
    kicker: 'Podkova a C-linka', desc: 'Legendární hypersport s typickou podkovou masky, C-linkou na boku a vysunutým zadním křídlem. Oranžová s černou.',
    variant: { key: 'body', label: 'Lak', options: [['Oranžová', '#F57C1F'], ['Modrá', '#1E5AA8'], ['Černá', '#26292F']] }, bg: '#1E2226', ink: '#F4F6F8', accent: '#F57C1F', accentInk: '#1B1D22', word: 'CHIRON', dark: true },
  { id: 'huracan', model: 'huracan', name: 'Lamborghini Huracán Tecnica', line: CAR, price: 1299, pieces: 806, size: '31 cm', age: '9+', tags: ['auta', 'rodina'], featured: true,
    kicker: 'Pro něj, pro ni, pro tátu', desc: 'Ostrá klínovitá silueta, světla do Y, šestiúhelníkové detaily a pevné zadní křídlo. Zářivě zelená jako originál.',
    variant: { key: 'body', label: 'Lak', options: [['Verde', '#9BCB1B'], ['Arancio', '#FE8A18'], ['Bianco', '#F2F3F2']] }, bg: '#1E2226', ink: '#F4F6F8', accent: '#9BCB1B', accentInk: '#1B1D22', word: 'HURACÁN', dark: true },
  { id: 'sian', model: 'sian', name: 'Lamborghini Sián – růžové', line: CAR, price: 1999, pieces: 1280, size: '40 cm', age: '14+', tags: ['auta', 'pary'], featured: true,
    kicker: 'Pro holky, co milují rychlost', desc: 'Růžový supersport s obřím zadním křídlem, purpurovými disky a šesti výfuky. Dárek, ze kterého se tají dech.',
    variant: { key: 'body', label: 'Lak', options: [['Rosa', '#F7A8C8'], ['Bianco', '#F2F3F2'], ['Verde', '#9BCB1B']] }, bg: '#FFE4EF', ink: '#3B0A22', accent: '#D3359D', word: 'SIÁN' },
  { id: 'daytona', model: 'daytona', name: 'Ferrari Daytona SP3', line: BIG, price: 9999, pieces: 3778, size: '59 cm', age: '18+', tags: ['auta'], featured: true,
    kicker: 'Velký model pro sběratele', desc: 'Oblé svalnaté blatníky, černá targa střecha, žaluzie na zádi a stříbrná pětipaprsková kola. Výstavní kousek v měřítku 1:8.',
    variant: { key: 'body', label: 'Lak', options: [['Rosso', '#D01012'], ['Giallo', '#F5C518'], ['Nero', '#26292F']] }, bg: '#3A0D10', ink: '#FFF3E6', accent: '#F5C518', accentInk: '#1B1D22', word: 'SP3', dark: true },
  { id: 'mclaren', model: 'mclaren', name: 'McLaren P1', line: BIG, price: 11499, pieces: 3893, size: '58 cm', age: '18+', tags: ['auta'],
    kicker: 'Hybridní legenda', desc: 'Žlutooranžová karoserie s černou střechou, „bumerangová“ světla, velké zadní křídlo a centrální výfuk. Model 1:8 pro opravdové fanoušky.',
    variant: { key: 'body', label: 'Lak', options: [['Volcano Yellow', '#F6A81C'], ['Papaya', '#FF7A1A'], ['Šedá', '#8C9096']] }, bg: '#14171B', ink: '#F4F6F8', accent: '#F6A81C', accentInk: '#1B1D22', word: 'P1', dark: true },
  { id: 'mercedes', model: 'mercedes', name: 'Mercedes-AMG G 63 & SL 63', line: CAR, price: 1599, pieces: 808, size: '2 auta', age: '10+', tags: ['auta', 'rodina', 'pary'],
    kicker: 'Dvě auta v jedné krabici', desc: 'Hranatý černý G 63 s rezervou na zádi a žlutý kabriolet SL 63 s otevřenou střechou. Pro dva – nebo pro jednoho, kdo chce obojí.',
    variant: { key: 'body', label: 'SL 63', options: [['Žlutá', '#F5C518'], ['Červená', '#D01012'], ['Stříbrná', '#C9CCD0']] }, bg: '#EDEDED', ink: '#1A1D21', accent: '#F5C518', accentInk: '#1B1D22', word: 'AMG' },
  { id: 'visiongt', model: 'visiongt', name: 'Bugatti Vision Gran Turismo', line: CAR, price: 549, pieces: 284, size: '17 cm', age: '9+', tags: ['auta', 'rodina'],
    kicker: 'Malý dárek, velká rychlost', desc: 'Dvoubarevná modrá závodní vize s podkovou, číslem 16 a obrovským zadním křídlem. Ideální drobnost k narozeninám.',
    variant: { key: 'body', label: 'Lak', options: [['Modrá', '#3F9BE8'], ['Oranžová', '#F57C1F'], ['Bílá', '#F2F3F2']] }, bg: '#E3EEFA', ink: '#0B2342', accent: '#0E2A55', word: 'VISION GT' }
];

export const PRODUCTS = ALL.filter(p => p.featured);
export const byId = (id) => ALL.find(p => p.id === id);
export const fmt = (n) => n.toLocaleString('cs-CZ') + ' Kč';
export const FREE_SHIP = 1500;
