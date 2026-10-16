import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {useLanguage} from './i18n';
import {SectionLink} from './navigation';
import {api,API_BASE} from './api.mjs';
import {CATEGORIES,CATEGORY_LABELS,filterServers,orderServers,serverDestination} from './server-model.mjs';
import {directoryCopy} from './directory-copy.mjs';
import initialServers from './data/servers.json';
import './directory.css';

function ServerIdentity({server,large=false}) {
 const initials=Array.from(server.name.trim()).slice(0,2).join('').toLocaleUpperCase();
 return <span className={`server-identity ${large?'identity-large':''}`} aria-hidden="true"><span>{initials}</span><svg viewBox="0 0 100 60" fill="none"><path d="M0 48h20l12-12h20L72 16h28M0 20h12l8 8h20L60 8h40M16 60V44l14-14V0M68 60V40l18-18V0"/><circle cx="52" cy="36" r="3"/><circle cx="20" cy="28" r="3"/></svg></span>;
}

export function ServerProfile({server,c,titleRef}) {
 const details=server.details||{},destination=serverDestination(server.url);
 return <article className={`server-profile ${server.promoted?'profile-promoted':''}`}>
  <header className="profile-hero">
   <div className="profile-cover" aria-hidden="true"><span>{CATEGORY_LABELS[server.category]}</span></div>
   <div className="profile-hero-content"><ServerIdentity server={server} large/><div className="profile-heading"><p className="server-meta"><span className="server-status-dot" aria-hidden="true"/>{server.promoted?c.paidNote:c.freeBadge}</p><h2 ref={titleRef} tabIndex="-1" id="server-profile-title">{server.name}</h2><div className="profile-tags"><span className="server-category">{CATEGORY_LABELS[server.category]}</span><span>Open2077</span>{details.language&&<span>{details.language}</span>}</div></div></div>
   {server.description&&details.about&&<p className="profile-summary">{server.description}</p>}
  </header>
  <div className="profile-layout"><div className="profile-sections">
   <section className="profile-box"><p className="eyebrow">01 / {c.about}</p><h3>{c.about}</h3>{details.about?<p className="profile-prose">{details.about}</p>:server.description?<p className="profile-prose">{server.description}</p>:<p className="profile-missing">{c.missing}</p>}</section>
   {details.features?.length>0&&<section className="profile-box"><p className="eyebrow">02 / {c.features}</p><h3>{c.features}</h3><ul className="profile-features">{details.features.map(feature=><li key={feature}><span aria-hidden="true">＋</span>{feature}</li>)}</ul></section>}
   {details.access&&<section className="profile-box"><p className="eyebrow">{details.features?.length?'03':'02'} / {c.access}</p><h3>{c.access}</h3><p className="profile-prose">{details.access}</p></section>}
  </div><aside className="profile-sidebar">
   <section className="profile-box profile-connect"><span className="profile-link-icon" aria-hidden="true">↗</span><h3>{c.links}</h3>{destination&&<><p className="profile-host">{destination.host}</p><a href={server.url} target="_blank" rel="noopener noreferrer" aria-describedby="profile-external-note" className={`button ${server.promoted?'button-pink':'button-outline'}`}>{destination.discord?c.discord:c.website}<span aria-hidden="true">↗</span></a><p className="profile-external" id="profile-external-note">{c.external}</p></>}</section>
   <section className="profile-box"><h3>{c.facts}</h3><dl className="profile-facts"><div><dt>{c.mode}</dt><dd>{CATEGORY_LABELS[server.category]}</dd></div><div><dt>{c.platform}</dt><dd>Open2077</dd></div>{details.language&&<div><dt>{c.language}</dt><dd>{details.language}</dd></div>}</dl></section>
   <p className="profile-note">{c.profileNote}</p>
  </aside></div>
 </article>;
}

export default function Directory() {
 const {language,t}=useLanguage(),c=directoryCopy[language];
 const [servers,setServers]=useState(initialServers),[status,setStatus]=useState(API_BASE?'loading':'ready');
 const [category,setCategory]=useState('all'),[query,setQuery]=useState(''),[reload,setReload]=useState(0);
 const [params]=useSearchParams(),selectedId=params.get('servidor');
 const rootRef=useRef(null),titleRef=useRef(null),previousId=useRef(null),listScroll=useRef(0);
 useEffect(()=>{
  if(!API_BASE)return;
  const controller=new AbortController();
  api('/servers',{signal:controller.signal}).then(data=>{setServers(orderServers(data.servers));setStatus('ready');}).catch(error=>{if(error.name!=='AbortError')setStatus('error');});
  const onFocus=()=>{if(document.visibilityState==='visible')setReload(value=>value+1);};
  window.addEventListener('focus',onFocus);
  return()=>{controller.abort();window.removeEventListener('focus',onFocus);};
 },[reload]);
 useLayoutEffect(()=>{
  if(status!=='ready')return;
  const panel=rootRef.current?.closest('.map-content');
  if(selectedId){panel?.scrollTo({top:0,behavior:'instant'});titleRef.current?.focus({preventScroll:true});}
  else if(previousId.current){panel?.scrollTo({top:listScroll.current,behavior:'instant'});rootRef.current?.querySelector(`[data-server-id="${CSS.escape(previousId.current)}"]`)?.focus({preventScroll:true});}
  previousId.current=selectedId;
 },[selectedId,status]);
 const selected=servers.find(server=>server.id===selectedId);
 const filtered=filterServers(servers,category,query);
 const groups=[{label:c.promoted,note:c.paidNote,items:filtered.filter(server=>server.promoted)},{label:c.free,note:c.freeNote,items:filtered.filter(server=>!server.promoted)}];
 const rememberScroll=()=>{listScroll.current=rootRef.current?.closest('.map-content')?.scrollTop||0;};
 const resetFilters=()=>{setCategory('all');setQuery('');};
 const pending=status==='loading'?<p role="status" className="directory-status">{c.loading}</p>:status==='error'?<div className="directory-status" role="alert"><p>{c.error}</p><button type="button" className="button button-outline" onClick={()=>{setStatus('loading');setReload(value=>value+1);}}>{c.retry}</button></div>:null;
 return <section ref={rootRef} className={`directory shell ${selectedId?'directory-profile':''}`} id="servidores" aria-labelledby={selectedId&&selected&&status==='ready'?'server-profile-title':'directory-title'}>
  {selectedId?<div className="directory-view" key={selectedId}><Link className="profile-back" to="/servidores/">← {c.back}</Link>{pending&&<h2 className="sr-only" id="directory-title">{c.loading}</h2>}{pending|| (selected?<ServerProfile server={selected} c={c} titleRef={titleRef}/>:<div className="directory-status"><h2 id="directory-title" ref={titleRef} tabIndex="-1">{c.unavailable}</h2><Link className="button button-outline" to="/servidores/">{c.browse}</Link></div>)}</div>:<div className="directory-view" key="list">
   <div className="directory-overview"><div><div className="section-heading"><div><p className="eyebrow">CYBERPUNK / OPEN2077</p><h2 id="directory-title">{t.directoryTitle}</h2></div></div>
   <p className="directory-description">{c.intro}</p></div>
   <div className="directory-tools"><div className="directory-search"><label className="sr-only" htmlFor="directory-query">{c.search}</label><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input id="directory-query" type="search" value={query} placeholder={c.searchHint} onChange={event=>setQuery(event.target.value)}/>{query&&<button type="button" aria-label={c.clear} onClick={()=>setQuery('')}>×</button>}</div><div className="directory-count" role="status" aria-live="polite">{status==='ready'&&<><strong>{filtered.length}</strong> {filtered.length===1?c.listing:c.listings}</>}</div></div>
   </div><div className="directory-listing-callout"><p>{t.directoryListingNote}</p><SectionLink to="/promocion/">{t.listingRequestLink}<span aria-hidden="true">→</span></SectionLink></div><div className="category-filters" role="group" aria-label={c.filters}>{['all',...CATEGORIES].map(value=><button type="button" key={value} aria-pressed={category===value} onClick={()=>setCategory(value)}><span>{value==='all'?c.all:CATEGORY_LABELS[value]}</span><small>{value==='all'?servers.length:servers.filter(server=>server.category===value).length}</small></button>)}</div>
   {pending|| (servers.length===0?<div className="directory-empty"><div className="empty-copy"><p className="eyebrow">{t.emptyEyebrow}</p><h3>{t.emptyTitle}</h3><p>{t.emptyDescription}</p></div><SectionLink className="text-link" to="/promocion/">{t.appearHere} ↗</SectionLink></div>:filtered.length===0?<div className="directory-status"><p role="status">{c.noMatches}</p><button type="button" className="button button-outline" onClick={resetFilters}>{c.reset}</button></div>:groups.map(group=>group.items.length>0&&<div className="directory-group" key={group.label}><div className="directory-group-heading"><h3>{group.label} <span>{group.items.length}</span></h3><span>{group.note}</span></div><div className="server-grid">{group.items.map(server=><article key={server.id} className={`server-card ${server.promoted?'server-promoted':'server-free'}`}><Link className="server-card-link" to={`?servidor=${encodeURIComponent(server.id)}`} data-server-id={server.id} onClick={rememberScroll} aria-label={`${c.view}: ${server.name}`}><div className="server-card-art"><ServerIdentity server={server}/><span className="server-art-mode" aria-hidden="true">{CATEGORY_LABELS[server.category]}</span><span className="server-meta">{server.promoted?<><span aria-hidden="true">✦</span> {c.paidNote}</>:c.freeBadge}</span></div><div className="server-card-body"><div className="server-card-top"><span className="server-category">{CATEGORY_LABELS[server.category]}</span><span className="server-platform">Open2077</span></div><h4>{server.name}</h4>{server.description&&<p className="server-excerpt">{server.description}</p>}{server.details?.language&&<span className="server-card-language">{server.details.language}</span>}<span className="server-card-action"><span>{c.view}<small>{c.more}</small></span><span className="server-card-arrow" aria-hidden="true">→</span></span></div></Link></article>)}</div></div>))}
   {status==='ready'&&servers.length>0&&<p className="directory-disclosure">{c.notice}</p>}
  </div>}
 </section>;
}
