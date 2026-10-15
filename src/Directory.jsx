import {useEffect,useState} from 'react';
import {useLanguage} from './i18n';
import {SectionLink} from './navigation';
import {api,API_BASE} from './api.mjs';
import {CATEGORIES,CATEGORY_LABELS,orderServers} from './server-model.mjs';
import initialServers from './data/servers.json';
import './directory.css';

const text={
 es:{all:'Todos',promoted:'Promocionados',free:'Gratuitos',freeBadge:'Ficha gratuita',intro:'Descubre servidores Cyberpunk de Open2077 por modalidad.',loading:'Cargando servidores…',error:'No se ha podido cargar el directorio.',retry:'Volver a intentar',noMatches:'No hay servidores de esta modalidad.',filters:'Filtrar por modalidad'},
 en:{all:'All',promoted:'Promoted',free:'Free listings',freeBadge:'Free listing',intro:'Discover Cyberpunk servers on Open2077 by game mode.',loading:'Loading servers…',error:'The directory could not be loaded.',retry:'Try again',noMatches:'There are no servers in this category.',filters:'Filter by game mode'},
 fr:{all:'Tous',promoted:'Sponsorisés',free:'Fiches gratuites',freeBadge:'Fiche gratuite',intro:'Découvre les serveurs Cyberpunk d’Open2077 par mode de jeu.',loading:'Chargement des serveurs…',error:'Impossible de charger l’annuaire.',retry:'Réessayer',noMatches:'Aucun serveur dans cette catégorie.',filters:'Filtrer par mode de jeu'}
};

export default function Directory() {
 const {language,t}=useLanguage(),c=text[language];
 const [servers,setServers]=useState(initialServers),[status,setStatus]=useState(API_BASE?'loading':'ready');
 const [category,setCategory]=useState('all'),[reload,setReload]=useState(0);
 useEffect(()=>{
  if(!API_BASE)return;
  const controller=new AbortController();
  api('/servers',{signal:controller.signal}).then(data=>{setServers(orderServers(data.servers));setStatus('ready');}).catch(error=>{if(error.name!=='AbortError')setStatus('error');});
  const onFocus=()=>{if(document.visibilityState==='visible')setReload(value=>value+1);};
  window.addEventListener('focus',onFocus);
  return()=>{controller.abort();window.removeEventListener('focus',onFocus);};
 },[reload]);
 const filtered=orderServers(servers.filter(server=>category==='all'||server.category===category));
 const groups=[{label:c.promoted,items:filtered.filter(server=>server.promoted)},{label:c.free,items:filtered.filter(server=>!server.promoted)}];
 return <section className="directory shell" id="servidores" aria-labelledby="directory-title">
  <div className="section-heading"><div><p className="eyebrow">CYBERPUNK / OPEN2077</p><h2 id="directory-title">{t.directoryTitle}</h2></div></div>
  <p className="directory-description">{c.intro}</p>
  <div className="category-filters" role="group" aria-label={c.filters}>{['all',...CATEGORIES].map(value=><button type="button" key={value} aria-pressed={category===value} onClick={()=>setCategory(value)}><span>{value==='all'?c.all:CATEGORY_LABELS[value]}</span><small>{value==='all'?servers.length:servers.filter(server=>server.category===value).length}</small></button>)}</div>
  {status==='loading'?<p role="status" className="directory-status">{c.loading}</p>:status==='error'?<div className="directory-status" role="alert"><p>{c.error}</p><button type="button" className="button button-outline" onClick={()=>{setStatus('loading');setReload(value=>value+1);}}>{c.retry}</button></div>:servers.length===0?<div className="directory-empty"><div className="empty-copy"><p className="eyebrow">{t.emptyEyebrow}</p><h3>{t.emptyTitle}</h3><p>{t.emptyDescription}</p></div><SectionLink className="text-link" to="/promocion/">{t.appearHere} ↗</SectionLink></div>:filtered.length===0?<p className="directory-status" role="status">{c.noMatches}</p>:groups.map(group=>group.items.length>0&&<div className="directory-group" key={group.label}><h3>{group.label} <span>{group.items.length}</span></h3><div className="server-grid">{group.items.map(server=><article key={server.id} className={`server-card ${server.promoted?'server-promoted':'server-free'}`}><a className="server-card-link" href={server.url} target="_blank" rel="noopener noreferrer" aria-label={`${t.visitServer}: ${server.name}${t.opensNewTab}`}><div className="server-card-top"><div className="server-meta"><span className="server-status-dot" aria-hidden="true"/><span>{server.promoted?t.promotedListing:c.freeBadge}</span></div><span className="server-card-emblem" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4 7.5 8 5 8-5M12 12.5V21"/></svg></span></div><h4>{server.name}</h4><span className="server-category">{CATEGORY_LABELS[server.category]}</span>{server.description&&<p>{server.description}</p>}<span className="server-card-action"><span>{t.visitServer}</span><span className="server-card-arrow" aria-hidden="true">↗</span></span></a></article>)}</div></div>)}
 </section>;
}
