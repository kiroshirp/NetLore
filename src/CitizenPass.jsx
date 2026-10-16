import { useEffect, useState } from 'react';
import { useLanguage } from './i18n';
import { factions, citizenCopy, citizenSvg, cleanCardText, cardFilename, loadCardLogos, cardPng } from './citizen-card.mjs';
import './citizen.css';

export default function CitizenPass() {
  const {language}=useLanguage(), t=citizenCopy[language];
  const [name,setName]=useState(''), [role,setRole]=useState(''), [faction,setFaction]=useState('maelstrom'), [format,setFormat]=useState('wide');
  const [logos,setLogos]=useState(null), [status,setStatus]=useState(''), [busy,setBusy]=useState(false), [retry,setRetry]=useState(0);
  useEffect(()=>{let active=true;setLogos(null);setStatus('');loadCardLogos(import.meta.env.BASE_URL).then(value=>{if(active)setLogos(value);}).catch(()=>{if(active)setStatus('error');});return()=>{active=false;};},[retry]);
  const svg=citizenSvg({name,role,faction,format,language,logos:logos||{}});
  async function download(event) {
    event.preventDefault();if(busy)return;
    if(!logos){setRetry(value=>value+1);return;}
    setBusy(true);setStatus('');
    try {const blob=await cardPng(svg),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=cardFilename(name,format);link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);setStatus('ready');}
    catch{setStatus('error');}finally{setBusy(false);}
  }
  function change(setter,value){setter(value);setStatus('');}
  return <section className="citizen-studio" id="pase" aria-labelledby="citizen-title">
    <div className="citizen-heading"><p className="eyebrow">NETLORE / IDENTITY LAB <span className="citizen-beta">Beta</span></p><h2 id="citizen-title">{t.title}</h2><p>{t.description}</p></div>
    <div className="citizen-layout"><form className="citizen-editor" onSubmit={download}>
      <h3>{t.intro}</h3>
      <label htmlFor="citizen-name">{t.name}</label><input id="citizen-name" value={name} onChange={e=>change(setName,e.target.value)} maxLength={32} required pattern=".*\S.*" placeholder={t.alias} autoComplete="off"/>
      <label htmlFor="citizen-role">{t.role}</label><input id="citizen-role" value={role} onChange={e=>change(setRole,e.target.value)} maxLength={40} required pattern=".*\S.*" placeholder={t.roleExample} autoComplete="off"/>
      <fieldset><legend>{t.faction}</legend><div className="citizen-factions">{factions.map(item=><label key={item.id} style={{'--faction-color':item.color}}><input type="radio" name="citizen-faction" value={item.id} checked={faction===item.id} onChange={()=>change(setFaction,item.id)}/><span><b>{item.code}</b>{item.name}</span></label>)}</div></fieldset>
      <label htmlFor="citizen-format">{t.format}</label><select id="citizen-format" value={format} onChange={e=>change(setFormat,e.target.value)}><option value="wide">{t.wide}</option><option value="square">{t.square}</option></select>
      <button type="submit" className="button button-pink" disabled={busy||(!logos&&status!=='error')}>{busy?t.working:t.download}<span aria-hidden="true">↓</span></button>
      <p className="citizen-status" role="status">{status==='error'?t.error:status==='ready'?t.ready:!cleanCardText(name,32)||!cleanCardText(role,40)?t.required:''}</p><p className="citizen-private">{t.privacy}</p>
    </form><div className="citizen-preview"><div className="citizen-preview-top"><span>{t.preview}</span><span>PNG / {format==='square'?'1080 × 1080':'1600 × 900'}</span></div><img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} width={format==='square'?1080:1600} height={format==='square'?1080:900} alt={`${t.title} · ${cleanCardText(name,32)||t.alias} · ${factions.find(item=>item.id===faction).name} · ${cleanCardText(role,40)||t.rolePlaceholder}`}/><p>{t.help}</p></div></div>
  </section>;
}
