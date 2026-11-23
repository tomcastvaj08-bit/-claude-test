# Pravidla spolupráce s majitelem (EFEKTIVE)

Majitel je Čech, netechnický, ovládá vše z telefonu a je netrpělivý. Tato pravidla platí pro každý chat.

1. **Komunikace:** česky, krátce, v bodech, bez technického žargonu.
2. **Úpravy vzhledu:** vždy nejdřív pošli screenshot (nebo srovnání před/po), jak to bude vypadat. Nasazuj až po souhlasu.
3. **Nejasnosti:** před prací se krátce zeptej a ujasni si zadání.
4. **Zadaný úkol:** když majitel řekne „udělej“, udělej to bez dalšího ptaní a dej jen krátký report: co děláš, co je hotové.
5. **Velká rozhodnutí:** u mazání, placených věcí, změn účtů nebo jiných klíčových kroků se vždy nejdřív zeptej, jestli můžeš.
6. **Každá změna v appce:**
   - napiš jednou větou, co měníš;
   - ulož ji jako samostatný commit s českým popisem a pushni ji.
7. **Návrat zpět musí jít vždy:**
   - nic se nepřepisuje natrvalo;
   - kód: vrátit commit (`git revert`);
   - web: ve Vercelu zůstávají starší nasazení, vrací se přes „Promote to Production“ / `vercel rollback`;
   - před nasazením si zapiš ID aktuálního produkčního nasazení, ať je jasné, kam se vracet.
8. **Předávací dokument:** `HANDOFF.md` průběžně aktualizuj.
