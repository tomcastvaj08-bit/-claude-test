// Ukázková data produktů (zatím nic neprodáváme – ceny a parametry jsou orientační).
export const OCCASIONS = {
  pary: 'Pro páry',
  maminka: 'Pro maminku',
  rodina: 'Pro rodinu',
  auta: 'Pro milovníky aut'
};

export const PRODUCTS = [
  {
    id: 'orchid', model: 'orchid', name: 'Orchidej', line: 'Botanická kolekce',
    price: 1299, old: 1499, pieces: 608, size: '39 cm', age: '18+', tags: ['maminka', 'pary'],
    kicker: 'Bestseller pro maminky',
    desc: 'Kvete napořád a nikdy nepotřebuje zalít. Elegantní orchidej z bílých a růžových dílků – dárek, který mamince vydrží roky.',
    variant: { key: 'pot', label: 'Květináč', options: [['Šedomodrý', '#8E9AB8'], ['Bílý', '#F2F3F2'], ['Růžový', '#FC97AC'], ['Grafit', '#3E4347']] },
    bg: '#EFE6F8', ink: '#2B1838', accent: '#D3359D', word: 'ORCHIDEJ'
  },
  {
    id: 'miniorchid', model: 'miniorchid', name: 'Mini orchidej', line: 'Botanická kolekce',
    price: 649, pieces: 274, size: '26 cm', age: '18+', tags: ['pary', 'maminka'],
    kicker: 'Malá radost na stůl',
    desc: 'Něžná a přesně tak velká, aby se vešla na parapet, pracovní stůl nebo noční stolek. Ideální drobnost k výročí.',
    variant: { key: 'pot', label: 'Květináč', options: [['Bílý', '#F2F3F2'], ['Levandule', '#CDA4DE'], ['Mátový', '#A8DCC9']] },
    bg: '#FFF4D6', ink: '#3A2A08', accent: '#E8A800', accentInk: '#1B1D22', word: 'MINI'
  },
  {
    id: 'roses', model: 'roses', name: 'Kytice rudých růží', line: 'Botanická kolekce',
    price: 1199, pieces: 822, size: '35 cm', age: '18+', tags: ['pary'],
    kicker: 'Láska, která nezvadne',
    desc: 'Sedm rudých růží ve váze z kulatých kostek. Klasika pro zamilované – a tentokrát se skládá ve dvou.',
    variant: { key: 'petal', label: 'Barva růží', options: [['Rudá', '#C91A09'], ['Růžová', '#FC97AC'], ['Bílá', '#F2F3F2'], ['Žlutá', '#F2CD37']] },
    bg: '#FFE4E8', ink: '#3B0A12', accent: '#C91A09', word: 'RŮŽE'
  },
  {
    id: 'tulips', model: 'tulips', name: 'Tulipány pro mámu', line: 'Botanická kolekce',
    price: 899, pieces: 365, size: '30 cm', age: '9+', tags: ['maminka', 'rodina'],
    kicker: 'Společné skládání s dětmi',
    desc: 'Barevná jarní kytice v květináči. Skvělé odpoledne pro celou rodinu – a pak ozdoba kuchyňského stolu na roky.',
    variant: { key: 'pot', label: 'Květináč', options: [['Terakota', '#B8572C'], ['Bílý', '#F2F3F2'], ['Modrý', '#0055BF']] },
    bg: '#E5F3DC', ink: '#12301A', accent: '#237841', word: 'TULIPÁNY'
  },
  {
    id: 'lambo', model: 'lambo', name: 'Lamborghini Revuelto', line: 'Kolekce aut',
    price: 2499, pieces: 1135, size: '42 cm', age: '18+', tags: ['auta', 'rodina'],
    kicker: 'Pro něj, pro ni, pro tátu',
    desc: 'Ostré linie, nízká silueta a barva, které se nedá nevšimnout. Pro každého, kdo má v garáži místo aspoň na poličce.',
    variant: { key: 'body', label: 'Lak', options: [['Verde', '#A5CA18'], ['Arancio', '#FE8A18'], ['Viola', '#8E5AA8'], ['Nero', '#2A2D31']] },
    bg: '#1E2226', ink: '#F4F6F8', accent: '#A5CA18', accentInk: '#1B1D22', word: 'REVUELTO', dark: true
  },
  {
    id: 'porsche', model: 'porsche', name: 'Porsche 911', line: 'Kolekce aut',
    price: 1899, pieces: 1458, size: '38 cm', age: '18+', tags: ['auta', 'pary'],
    kicker: 'Nadčasová klasika',
    desc: 'Ikonická silueta s typickou zádí. Skvělý dárek k výročí, narozeninám nebo jen tak – pro toho, kdo miluje ježdění.',
    variant: { key: 'body', label: 'Lak', options: [['Bílá', '#F2F3F2'], ['Stříbrná', '#C9CCD0'], ['Žlutá', '#F2CD37'], ['Modrá', '#0A3463']] },
    bg: '#E8EBEE', ink: '#1A1D21', accent: '#C91A09', word: '911'
  },
  {
    id: 'ferrari', model: 'ferrari', name: 'Ferrari', line: 'Kolekce aut',
    price: 2199, pieces: 1677, size: '45 cm', age: '18+', tags: ['auta'],
    kicker: 'Závodní červená',
    desc: 'Dlouhá kapota, spoiler a nezaměnitelná barva. Model, který se staví s nadšením a vystavuje s hrdostí.',
    variant: { key: 'body', label: 'Lak', options: [['Rosso', '#C91A09'], ['Giallo', '#F2CD37'], ['Nero', '#2A2D31']] },
    bg: '#3A0D10', ink: '#FFF3E6', accent: '#F2CD37', accentInk: '#1B1D22', word: 'ROSSO', dark: true
  }
];

// produkty jen v katalogu (bez velké scény)
export const EXTRA = [
  {
    id: 'audi', model: 'audi', name: 'Audi RS', line: 'Kolekce aut', price: 1799, pieces: 1210, size: '37 cm', age: '18+', tags: ['auta'],
    desc: 'Čisté linie a sportovní charakter.', variant: { key: 'body', label: 'Lak', options: [['Nardo', '#8C9096'], ['Modrá', '#0055BF'], ['Bílá', '#F2F3F2']] }
  },
  {
    id: 'heart', model: 'heart', name: 'Srdce z kostek', line: 'Love Bricks originál', price: 249, pieces: 64, size: '14 cm', age: '6+', tags: ['pary', 'maminka', 'rodina'],
    desc: 'Malé srdce jako vzkaz bez slov. Přidejte ho k jakémukoli dárku.', variant: { key: 'main', label: 'Barva', options: [['Červená', '#C91A09'], ['Růžová', '#FC97AC'], ['Fialová', '#8E5AA8']] }
  }
];

export const ALL = [...PRODUCTS, ...EXTRA];
export const byId = (id) => ALL.find(p => p.id === id);
export const fmt = (n) => n.toLocaleString('cs-CZ') + ' Kč';
export const FREE_SHIP = 1500;
