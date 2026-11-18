// ================= JAZYK APLIKACE (i18n) =================
// Pevné překlady – žádná AI, nic se neposílá ven. Zdrojový jazyk appky je čeština;
// překlad se aplikuje na všechny texty v rozhraní (i ty, které appka dokreslí později)
// podle slovníku ve složce i18n/ (např. i18n/en.js → window.I18N_DICT.en).
// Volba jazyka se uloží do zařízení (localStorage 'efk_ui') a platí při každém dalším spuštění.
(function(){
  // [kód, název v daném jazyce, vlajka (soubor flags/<kód>.svg), je hotový]
  const UI_LANGS = [
    ['en','English','gb',true], ['cs','Čeština','cz',true],
    ['sk','Slovenčina','sk'], ['pl','Polski','pl'], ['de','Deutsch','de'], ['fr','Français','fr'],
    ['es','Español','es'], ['it','Italiano','it'], ['pt','Português','pt'], ['nl','Nederlands','nl'],
    ['hu','Magyar','hu'], ['ro','Română','ro'], ['uk','Українська','ua'], ['ru','Русский','ru'],
    ['tr','Türkçe','tr'], ['ar','العربية','sa'], ['hi','हिन्दी','in'], ['zh','中文','cn'],
    ['ja','日本語','jp'], ['ko','한국어','kr'], ['id','Bahasa Indonesia','id'], ['vi','Tiếng Việt','vn'],
  ];
  const READY = new Set(UI_LANGS.filter(l=>l[3]).map(l=>l[0]));
  let saved=null; try{ saved=localStorage.getItem('efk_ui'); }catch(e){}
  // první spuštění: podle jazyka zařízení (čeština / slovenština → čeština, jinak angličtina)
  const dev=((navigator.languages&&navigator.languages[0])||navigator.language||'en').toLowerCase();
  const auto = /^(cs|sk)/.test(dev) ? 'cs' : 'en';
  const LANG = READY.has(saved) ? saved : auto;
  const D = (window.I18N_DICT && window.I18N_DICT[LANG]) || null;
  const ON = LANG!=='cs' && !!D;
  const NUM=/\d+(?:[.,]\d+)?/g;

  // části vět (pro texty složené z kousků a čísel): nejdelší první, jen celé úseky slov
  let FR=null;
  function fragRe(){
    if (FR!==null) return FR;
    const keys=Object.keys(D).filter(k=>k.replace(/#/g,'').length>=4 && /\p{L}/u.test(k)).sort((a,b)=>b.length-a.length);
    if (!keys.length) return (FR=false);
    const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/#/g,'\\d+(?:[.,]\\d+)?');
    FR={ re:new RegExp('(?<![\\p{L}\\p{N}])(?:'+keys.map(esc).join('|')+')(?![\\p{L}\\p{N}])','gu'), keys };
    return FR;
  }
  function look(core){
    let r=D[core]; if (r!=null) return r;
    if (/\d/.test(core)){ const nums=[]; const k=core.replace(NUM,x=>{ nums.push(x); return '#'; }); const v=D[k]; if (v!=null){ let i=0; return v.replace(/#/g,()=>nums[i++]??'#'); } }
    return null;
  }
  function tr(s){
    if (!ON || s==null) return s; s=String(s);
    const m=s.match(/^(\s*)([\s\S]*?)(\s*)$/), core=m[2].replace(/\s+/g,' ');
    if (!core || !/\p{L}/u.test(core)) return s;
    let r=look(core);
    if (r==null){ const f=fragRe(); if (f){ let hit=false; const out=core.replace(f.re,x=>{ const v=look(x); if (v==null) return x; hit=true; return v; }); if (hit) r=out; } }
    return r==null ? s : m[1]+r+m[3];
  }
  // uživatelský obsah (slova titulků, názvy projektů, editor textu) se nepřekládá
  const SKIP='script,style,textarea,input,.ws,.cb,.pn,[data-notr],#inlineEdit,#dictText';
  const SKIP_ATTR='.ws,.cb,.pn,[data-notr]';   // nápovědy (placeholder) v polích se překládají, obsah polí ne
  const ATTR=['title','placeholder','aria-label','alt'];
  function trText(n){ const p=n.parentElement; if (!p || p.closest(SKIP)) return; const v=n.nodeValue; if (n.__tr===v) return; const t=tr(v); if (t!==v) n.nodeValue=t; n.__tr=n.nodeValue; }
  function trEl(el){ if (el.closest(SKIP_ATTR)) return; for (const a of ATTR){ const v=el.getAttribute(a); if (v && el['__tr_'+a]!==v){ const t=tr(v); if (t!==v) el.setAttribute(a,t); el['__tr_'+a]=el.getAttribute(a); } } }
  function trTree(root){
    if (root.nodeType===3) return trText(root);
    if (root.nodeType!==1) return;
    trEl(root);
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT); let n;
    while ((n=w.nextNode())) (n.nodeType===3?trText:trEl)(n);
  }
  function start(){
    document.documentElement.lang=LANG;
    if (!ON) return;
    trTree(document.body); document.title=tr(document.title);
    new MutationObserver(ms=>{ for (const m of ms){
      if (m.type==='characterData') trText(m.target);
      else if (m.type==='attributes') trEl(m.target);
      else m.addedNodes.forEach(trTree);
    } }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTR});
    // systémová okna (potvrzení, upozornění)
    const oc=window.confirm.bind(window), oa=window.alert.bind(window), op=window.prompt.bind(window);
    window.confirm=m=>oc(tr(m)); window.alert=m=>oa(tr(m)); window.prompt=(m,d)=>op(tr(m),d);
  }
  function set(code){ if (!READY.has(code)) return; try{ localStorage.setItem('efk_ui',code); }catch(e){} location.reload(); }
  window.I18N={ lang:LANG, langs:UI_LANGS, ready:READY, tr, set, locale: LANG==='cs'?'cs-CZ':LANG };
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
