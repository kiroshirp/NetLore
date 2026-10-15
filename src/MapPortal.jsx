import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from './i18n';
import { SectionLink } from './navigation';
import './map.css';
import './map-skin.css';

function MapIcon({name}) {
 const paths = { '⌂': <><path d="m3 10 9-7 9 7M5 9v12h14V9"/><path d="M9 21v-8h6v8"/></>, '▦': <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16M15 4v16M4 15h16"/></>, '↗': <><path d="m4 11 15-7v16L4 13zM8 14l2 7h4l-3-6M21 9h2M21 15h2"/></>, '?': <><path d="M21 11a9 9 0 0 1-9 9H6l-4 2 1-6a9 9 0 1 1 18-5Z"/><path d="M8 9h8M8 13h5"/></>, '◎': <><circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5z"/></> };
 return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const copy = {
  es: {map:'Navegación del mapa',home:'Vista general',info:'Información',roam:'Explorar el mapa',exit:'Volver al portal',hint:'Elige un punto para abrir una sección.',freeHint:'Arrastra para mover · Usa los controles para ampliar',note:'Los puntos son accesos al portal, no ubicaciones de servidores.',zoomIn:'Ampliar mapa',zoomOut:'Reducir mapa',reset:'Centrar mapa',credit:'Mapa: Pottero · Adaptado',close:'Volver al mapa',city:'OTRAS VIDAS. MISMA CIUDAD.',intro:'Encuentra tu próxima historia en los servidores Cyberpunk de Open2077.',location:'NIGHT CITY / DIRECTORIO DE COMUNIDADES'},
  en: {map:'Map navigation',home:'Overview',info:'Information',roam:'Explore the map',exit:'Back to portal',hint:'Choose a point to open a section.',freeHint:'Drag to move · Use the controls to zoom',note:'Points open portal sections; they are not server locations.',zoomIn:'Zoom in',zoomOut:'Zoom out',reset:'Center map',credit:'Map: Pottero · Adapted',close:'Back to map',city:'OTHER LIVES. SAME CITY.',intro:'Find your next story on the Cyberpunk servers of Open2077.',location:'NIGHT CITY / COMMUNITY DIRECTORY'},
  fr: {map:'Navigation de la carte',home:'Vue générale',info:'Informations',roam:'Explorer la carte',exit:'Retour au portail',hint:'Choisis un point pour ouvrir une section.',freeHint:'Fais glisser pour déplacer · Utilise les commandes pour zoomer',note:'Les points ouvrent les sections du portail, pas les emplacements des serveurs.',zoomIn:'Agrandir la carte',zoomOut:'Réduire la carte',reset:'Centrer la carte',credit:'Carte : Pottero · Adaptée',close:'Retour à la carte',city:'D’AUTRES VIES. MÊME VILLE.',intro:'Trouve ta prochaine histoire sur les serveurs Cyberpunk d’Open2077.',location:'NIGHT CITY / ANNUAIRE DES COMMUNAUTÉS'}
};

export function MapPortal({directory,promotion,questions}) {
  const { pathname } = useLocation();
  const { language,t } = useLanguage();
  const c = copy[language];
  const [free,setFree] = useState(false);
  const [camera,setCamera] = useState({x:0,y:0,z:1});
  const drag = useRef(null);
  const home = pathname === '/' || pathname === '/index.html';
  const items = [
    {to:'/',label:c.home,icon:'⌂',x:47,y:31},
    {to:'/servidores/',label:t.navServers,icon:'▦',x:37,y:47},
    {to:'/promocion/',label:t.navPromotion,icon:'↗',x:68,y:58},
    {to:'/informacion/',label:c.info,icon:'?',x:42,y:76}
  ];
  function toggleFree() { setFree(!free); setCamera({x:0,y:0,z:1}); }
  function zoom(delta) {setCamera(v=>({...v,z:Math.max(.7,Math.min(2.5,v.z+delta))}));}
  return <main id="contenido" className={`map-portal ${home?'map-home':'map-detail'} ${free?'map-free':''}`}>
    <div className="city-stage" aria-label="Night City" onPointerDown={e=>{if(!free || e.target.closest('a,button'))return;drag.current={x:e.clientX,y:e.clientY,camera};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(!drag.current)return; const d=drag.current;setCamera({...d.camera,x:Math.max(-700,Math.min(700,d.camera.x+e.clientX-d.x)),y:Math.max(-700,Math.min(700,d.camera.y+e.clientY-d.y))});}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <div className="city-grid" />
      <div className="city-camera" style={{transform:`translate(${camera.x}px,${camera.y}px) scale(${camera.z})`}}>
        <img className="city-cartography" src={`${import.meta.env.BASE_URL}assets/night-city-streets.webp`} width="2048" height="2327" alt="" draggable="false" fetchPriority="high" />
        <div className="city-points">{items.map(item=><SectionLink key={item.to} className={`city-pin ${pathname===item.to?'is-active':''}`} to={item.to} style={{left:`${item.x}%`,top:`${item.y}%`}} aria-label={item.label} onClick={()=>setFree(false)}><span aria-hidden="true"><MapIcon name={item.icon}/></span><strong>{item.label}</strong></SectionLink>)}</div>
      </div>
      <span className="map-north" aria-hidden="true">N<br/>↑</span>
    </div>
    <div className="map-status"><span className="status-dot" />{c.location}</div>
    {home && !free && <section id="inicio" className="map-intro" aria-labelledby="map-title"><SectionLink className="map-offer" to="/promocion/"><span>{t.offer}</span><b>5 <small>{t.perMonth}</small></b><span aria-hidden="true">↗</span><i>{t.limitedTime}</i></SectionLink><h1 id="map-title">Net<span>Lore</span></h1><p>{c.intro}</p><div className="map-intro-actions"><SectionLink className="button button-pink" to="/servidores/">{t.explore}<span aria-hidden="true">→</span></SectionLink><SectionLink className="button button-outline" to="/promocion/">{t.headerPromote}<span aria-hidden="true">↗</span></SectionLink></div><SectionLink className="map-scroll" to="/servidores/"><span className="mouse-shape" aria-hidden="true"/>{t.navServers}<span aria-hidden="true">⌄</span></SectionLink></section>}
    {!home && !free && <div className={`map-content ${pathname==='/servidores/'?'map-directory-content':''}`}><SectionLink className="map-back" to="/">← {c.close}</SectionLink>{pathname==='/servidores/'?directory:pathname==='/promocion/'?promotion:<div id="informacion">{questions}</div>}</div>}
    <nav className="map-dock" aria-label={c.map}>{items.map((item,index)=><SectionLink key={item.to} to={item.to} title={item.label} aria-label={item.label} aria-current={pathname===item.to?'page':undefined} onClick={()=>{setFree(false);setCamera({x:0,y:0,z:1});}}><span className="dock-icon" aria-hidden="true"><MapIcon name={item.icon}/></span><span className="dock-text"><b>{item.label}</b><small>0{index+1} / NETLORE</small></span></SectionLink>)}<button type="button" title={free?c.exit:c.roam} aria-label={free?c.exit:c.roam} aria-pressed={free} onClick={toggleFree}><span className="dock-icon" aria-hidden="true"><MapIcon name="◎"/></span><span className="dock-text">{free?c.exit:c.roam}</span></button></nav>
    <div className="map-tools"><button type="button" aria-label={c.zoomIn} onClick={()=>zoom(.2)}>+</button><button type="button" aria-label={c.zoomOut} onClick={()=>zoom(-.2)}>−</button><button type="button" aria-label={c.reset} onClick={()=>setCamera({x:0,y:0,z:1})}>⌖</button></div>
    <div className="map-caption">{free&&<p>{c.freeHint}</p>}<a href="https://atlasforge.gg/cyberpunk-2077/map" target="_blank" rel="noopener noreferrer">Night City © CD PROJEKT S.A. · AtlasForge ↗</a></div>
  </main>;
}
