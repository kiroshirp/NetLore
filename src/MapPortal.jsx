import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from './i18n';
import { SectionLink } from './navigation';
import './map.css';

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
        <img className="city-cartography" src={`${import.meta.env.BASE_URL}assets/night-city-map.svg`} width="870" height="1210" alt="" draggable="false" />
        <div className="city-points">{items.map(item=><SectionLink key={item.to} className={`city-pin ${pathname===item.to?'is-active':''}`} to={item.to} style={{left:`${item.x}%`,top:`${item.y}%`}} aria-label={item.label} onClick={()=>setFree(false)}><span aria-hidden="true">{item.icon}</span><strong>{item.label}</strong></SectionLink>)}</div>
      </div>
      <span className="map-north" aria-hidden="true">N<br/>↑</span>
    </div>
    <div className="map-status"><span className="status-dot" />{c.location}</div>
    {home && !free && <section id="inicio" className="map-intro" aria-labelledby="map-title"><p className="map-kicker">CYBERPUNK / ROLEPLAY / OPEN2077</p><h1 id="map-title">NET<span>LORE</span><i aria-hidden="true">®</i></h1><h2>{c.city}</h2><p>{c.intro}</p><div className="map-intro-actions"><SectionLink className="button button-pink" to="/servidores/">{t.explore}<span aria-hidden="true">↗</span></SectionLink><SectionLink className="button button-outline" to="/promocion/">{t.heroOffer}</SectionLink></div><p className="map-hint">{c.hint}</p></section>}
    {!home && !free && <div className={`map-content ${pathname==='/servidores/'?'map-directory-content':''}`}><SectionLink className="map-back" to="/">← {c.close}</SectionLink>{pathname==='/servidores/'?directory:pathname==='/promocion/'?promotion:<div id="informacion">{questions}</div>}</div>}
    <nav className="map-dock" aria-label={c.map}>{items.map((item,index)=><SectionLink key={item.to} to={item.to} aria-current={pathname===item.to?'page':undefined} onClick={()=>setFree(false)}><span className="dock-icon" aria-hidden="true">{item.icon}</span><span><b>{item.label}</b><small>0{index+1} / NETLORE</small></span><span className="dock-arrow" aria-hidden="true">↗</span></SectionLink>)}<button type="button" aria-pressed={free} onClick={toggleFree}><span className="dock-icon" aria-hidden="true">◎</span>{free?c.exit:c.roam}</button></nav>
    <div className="map-tools"><button type="button" aria-label={c.zoomIn} onClick={()=>zoom(.2)}>+</button><button type="button" aria-label={c.zoomOut} onClick={()=>zoom(-.2)}>−</button><button type="button" aria-label={c.reset} onClick={()=>setCamera({x:0,y:0,z:1})}>⌖</button></div>
    <div className="map-caption"><p>{free?c.freeHint:c.note}</p><a href="https://commons.wikimedia.org/wiki/File:Mapa_Night_City.svg" target="_blank" rel="noopener noreferrer">{c.credit}</a><a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0 ↗</a></div>
  </main>;
}
