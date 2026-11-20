import { useLocation } from 'react-router-dom';
import { useLanguage } from './i18n';
import { SectionLink } from './navigation';
import { citizenCopy } from './citizen-card.mjs';
import './launcher.css';

const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}`;

const copy = {
  es: { tabs: 'Secciones de NetLore', info: 'Información', close: 'Volver al inicio' },
  en: { tabs: 'NetLore sections', info: 'Information', close: 'Back to start' },
  fr: { tabs: 'Sections de NetLore', info: 'Informations', close: 'Retour à l’accueil' },
};

const icons = {
  servers: <><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /><path d="M7 7h.01M7 17h.01" /></>,
  promo: <><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5h.01" /></>,
  id: <><rect x="2" y="4" width="20" height="16" rx="3" /><circle cx="8" cy="10" r="2" /><path d="M5 16v-1a3 3 0 0 1 6 0v1m3-7h5m-5 4h5" /></>,
};

function TabIcon({ name }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>;
}

// The launcher: one window with tabs. The home route opens it beside the hero,
// every other route opens the same window at full width.
export function Launcher({ directory, promotion, questions, citizen, hero }) {
  const { pathname } = useLocation();
  const { language, t } = useLanguage();
  const c = copy[language];
  const home = pathname === '/' || pathname === '/index.html';
  const tabs = [
    { to: '/servidores/', icon: 'servers', label: t.navServers },
    { to: '/promocion/', icon: 'promo', label: t.navPromotion },
    { to: '/informacion/', icon: 'info', label: c.info },
    { to: '/pase/', icon: 'id', label: citizenCopy[language].title },
  ];
  const active = home ? '/servidores/' : pathname;
  const body = active === '/promocion/' ? promotion
    : active === '/informacion/' ? <div id="informacion">{questions}</div>
    : active === '/pase/' ? citizen
    : directory;
  return <main id="contenido" className={`launcher ${home ? 'launcher-home' : 'launcher-detail'}`}>
    <img className="launcher-backdrop" src={asset('netlore-city-gold-1672.webp')} srcSet={[768, 1280, 1672].map((width) => `${asset(`netlore-city-gold-${width}.webp`)} ${width}w`).join(', ')} sizes="100vw" width="1672" height="941" alt="" fetchPriority="high" />
    <div className="launcher-shade" aria-hidden="true" />
    {!home && <h1 className="sr-only">{tabs.find((tab) => tab.to === pathname)?.label}</h1>}
    <div className="launcher-inner shell">
      {home && hero}
      <section className="launcher-window" aria-label={c.tabs}>
        <nav className="launcher-tabs" aria-label={c.tabs}>
          {tabs.map((tab) => <SectionLink key={tab.to} to={tab.to} aria-current={active === tab.to ? 'page' : undefined}><TabIcon name={tab.icon} /><span>{tab.label}</span></SectionLink>)}
        </nav>
        <div className="launcher-body" key={active}>{body}</div>
      </section>
    </div>
  </main>;
}
