// Zkopíruje webovou appku (../app/public) do www/ pro mobilní aplikaci.
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..', '..', 'app', 'public'), dst = path.join(__dirname, '..', 'www');
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true });
console.log('www/ připraveno z', src);
