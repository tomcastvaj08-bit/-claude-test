// Most mezi webovou appkou a mobilní aplikací (Capacitor: App Store / Google Play).
// Na webu nedělá nic – vše jede jako dřív. V aplikaci:
//  • API volá přes plnou adresu serveru (soubory appky jsou uložené v telefonu),
//  • hotové video ukládá rovnou do galerie (Fotky / Galerie),
//  • předplatné PRO jde přes App Store / Google Play (RevenueCat), ne přes Stripe – tak to obchody vyžadují.
(function (g) {
  "use strict";
  const Cap = g.Capacitor;
  const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const SERVER = 'https://efektive-titulky.vercel.app';
  // Veřejné klíče RevenueCat (nejsou tajné, patří do aplikace). Doplní se po založení účtu RevenueCat.
  const RC_KEYS = { ios: '', android: '' };
  const ENTITLEMENT = 'pro';

  const N = g.NATIVE = {
    isNative,
    platform: isNative ? Cap.getPlatform() : 'web',
    api: p => (isNative ? SERVER : '') + p,
    plugin: name => (isNative && Cap.Plugins && Cap.Plugins[name]) || null,
  };

  // ---------- uložení videa do galerie ----------
  function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s); }
  N.saveVideo = async (blob, name, onP) => {
    const FS = N.plugin('Filesystem'); if (!FS) return false;
    const path = 'export-' + Date.now() + '.mp4';
    // po kouscích (velké video by se do paměti najednou nevešlo)
    const CH = 3 * 1024 * 1024;
    for (let off = 0; off < blob.size; off += CH) {
      const part = new Uint8Array(await blob.slice(off, off + CH).arrayBuffer());
      if (off === 0) await FS.writeFile({ path, data: b64(part), directory: 'CACHE' });
      else await FS.appendFile({ path, data: b64(part), directory: 'CACHE' });
      if (onP) onP(Math.min(1, (off + CH) / blob.size));
    }
    const { uri } = await FS.getUri({ path, directory: 'CACHE' });
    const Media = N.plugin('Media');
    try {
      if (Media) {
        // Android potřebuje album; iOS uloží do Fotek
        let albumIdentifier;
        if (N.platform === 'android') {
          // Android: video jde do vlastního alba „EFEKTIVE“ (najde se v Galerii / Fotkách)
          const find = async () => { const r = await Media.getAlbums(); const a = (r.albums || []).find(x => x.name === 'EFEKTIVE'); return a && a.identifier; };
          albumIdentifier = await find();
          if (!albumIdentifier) { await Media.createAlbum({ name: 'EFEKTIVE' }); albumIdentifier = await find(); }
        }
        await Media.saveVideo({ path: uri, albumIdentifier });
        return 'saved';
      }
    } catch (e) { console.warn('Uložení do galerie selhalo, nabídnu sdílení', e); }
    const Share = N.plugin('Share');
    if (Share) { await Share.share({ title: name, files: [uri] }); return 'shared'; }
    return false;
  };

  // ---------- předplatné přes obchod (RevenueCat) ----------
  const RC = () => N.plugin('Purchases');
  N.storeReady = false;
  N.storeInit = async () => {
    const P = RC(), key = RC_KEYS[N.platform];
    if (!P || !key) return false;
    try { await P.configure({ apiKey: key }); N.storeReady = true; return true; } catch (e) { console.warn('RevenueCat', e); return false; }
  };
  const proFrom = info => { const ent = info && (info.customerInfo || info).entitlements; const a = ent && ent.active && ent.active[ENTITLEMENT]; return a ? { pro: true, until: a.expirationDate ? Date.parse(a.expirationDate) : 0 } : { pro: false }; };
  N.storeStatus = async () => { const P = RC(); if (!N.storeReady) return null; try { return proFrom(await P.getCustomerInfo()); } catch (e) { return null; } };
  N.storePrice = async () => {
    const P = RC(); if (!N.storeReady) return null;
    try { const o = await P.getOfferings(); const pk = o && o.current && o.current.availablePackages && o.current.availablePackages[0]; return pk ? pk.product.priceString : null; } catch (e) { return null; }
  };
  N.storeBuy = async () => {
    const P = RC(); if (!N.storeReady) throw new Error('Předplatné v aplikaci se ještě připravuje.');
    const o = await P.getOfferings(); const pk = o && o.current && o.current.availablePackages && o.current.availablePackages[0];
    if (!pk) throw new Error('Předplatné teď není dostupné. Zkus to prosím později.');
    try { return proFrom(await P.purchasePackage({ aPackage: pk })); }
    catch (e) { if (e && (e.userCancelled || e.code === '1' || /cancel/i.test(e.message || ''))) return null; throw e; }
  };
  N.storeRestore = async () => { const P = RC(); if (!N.storeReady) throw new Error('Předplatné v aplikaci se ještě připravuje.'); return proFrom(await P.restorePurchases()); };
  N.storeManage = () => { const u = N.platform === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions'; g.open(u, '_system'); };
})(window);
