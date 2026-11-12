# Květiny z dílků

Každá květina je skript, který skládá model ze skutečných dílků knihovny LDraw
(okvětní lístky, listy z klínů, stonky z tyček, květináče z kulatých kostek) a uloží ho jako `.ldr`.
Pak jde stejnou cestou jako auta (viz `../ldraw/README.md`): glTF → Blender → komprese.

```bash
node orchid.mjs                                   # → orchid.ldr
LDRAW=/cesta/ldraw node ../ldraw/togltf.mjs orchid.ldr orchid.gltf
python ../ldraw/blender_opt.py orchid.gltf orchid.raw.glb 0.7        # počítač
python ../ldraw/blender_opt.py orchid.gltf orchid-lite.raw.glb 0.35  # mobil
node ../ldraw/compress.mjs orchid.raw.glb ../../models/orchid.glb
```

`lib.mjs` obsahuje pomůcky: `stem` (stonek z tyček podél křivky), `leaf` (list ze dvou klínů),
`tulip` (kalich z kopule a oblých dílů), `pot8` (válec 8x8 z rohových kostek), `band` (zlatý proužek).
Líc modelu míří do LDraw −z (po převodu na web dopředu).
