#!/bin/bash
# Fotky v1 z Higgsfieldu (gpt_image_2_5, 29. 10. 2026 ~9:34, rawUrl) -> assets/img/p0–p4 (assets/img je v .gitignore).
cd "$(dirname "$0")/.." && mkdir -p assets/img
B=https://d8j0ntlcm91z4.cloudfront.net/user_30jyPfVkc1sdXbrfRP8H33Gq4r3
curl -sSf -o assets/img/p0.png $B/hf_20261029_093444_9ad9a46d-d978-45f1-aa33-ed36b766c52f.png   # ruka s mobilem
curl -sSf -o assets/img/p1.png $B/hf_20261029_093444_18428d08-89ab-408f-ace7-dd0b8e3b5e41.png   # křeslo
curl -sSf -o assets/img/p2.png $B/hf_20261029_093443_fcb19933-4d71-4d81-b501-cba0478e289c.png   # regál obleků
curl -sSf -o assets/img/p3.png $B/hf_20261029_093445_8dbc0c8d-2ad1-47bf-a636-dfc411f749d0.png   # krejčí
curl -sSf -o assets/img/p4.png $B/hf_20261029_093444_632fad9d-6242-4ef3-a56c-57f712007631.png   # kniha
