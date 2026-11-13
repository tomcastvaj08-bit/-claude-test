# Doplňky aut podle replik

Repliky (Lamborghini 1:14, Bugatti růžovo-bílé) mají navíc ohebné hadičky po kapotě a kolem dveří,
tmavé prosklení střechy a zrcátka. Do originální stavby z LDraw je přidáváme skriptem:

```bash
LDRAW=/cesta/ldraw node surf.mjs 42115-1.mpd sian.surf.json          # výšková mapa karoserie
LDRAW=/cesta/ldraw node hoses.mjs 42115-1.mpd sian.surf.json sianH.mpd sian.keep.json sianH.keep.json sian
KEEP_FROM=3914 LDRAW=/cesta/ldraw node ../ldraw/togltf.mjs sianH.mpd sian.gltf sianH.keep.json
```
Hadičky jsou tyčky 3L (87994) natažené na délku úseku a vedené po povrchu. Dál stejně jako ostatní auta (Blender, komprese).
