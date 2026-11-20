import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import {pageTitle} from './page-metadata.mjs';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useLanguage } from './i18n';
import { NavigationEffects, SectionLink, scrollToSection } from './navigation';
import ServerDirectory from './Directory';
const Admin = lazy(() => import('./Admin'));
import { copyRequestMessage, listingRequestMessage } from './copy-request.mjs';
import { CookiesPage, PrivacyNotice, PrivacyPage } from './Privacy';
import { clearNetLorePreferences, NOTICE_KEY, NOTICE_VERSION, readLocal, writeLocal } from './privacy-storage.mjs';
import { Launcher } from './Launcher';
const CitizenPass = lazy(() => import('./CitizenPass'));

const discordUrl = 'https://discord.gg/YkKv6X6gQB';
const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}`;
const arrowPaths = { '\u2197': 'M7 17 17 7M8 7h9v9', '\u2192': 'M5 12h14m-6-6 6 6-6 6', '\u2193': 'M12 5v14m-6-6 6 6 6-6', '\u2191': 'M12 19V5m-6 6 6-6 6 6', '\u2199': 'M17 7 7 17m9 0H7V8', '\u21b3': 'M6 5v8h12m-5-5 5 5-5 5', '+': 'M12 5v14M5 12h14', '\u2713': 'm5 13 4 4L19 7', '\u29c9': 'M9 9h10v10H9zM5 15V5h10' };
const Arrow = ({ children = '\u2197' }) => arrowPaths[children]
  ? <span aria-hidden="true" className="icon"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={arrowPaths[children]} /></svg></span>
  : <span aria-hidden="true">{children}</span>;

function DiscordLink({ children, className = '', accessibleHint = false }) {
  const { t } = useLanguage();
  return <a className={className} href={discordUrl} target="_blank" rel="noopener noreferrer">
    <span>{children}</span><Arrow />{accessibleHint && <span className="sr-only">{t.opensNewTab}</span>}
  </a>;
}

function Header() {
  const { language, changeLanguage, t } = useLanguage();
  const { pathname } = useLocation();
  return <header className="site-header">
    <div className="header-inner shell">
      <SectionLink className="brand" to="/" aria-label={t.home}><img src={asset('netlore-logo-gold.webp')} width="768" height="280" alt="NetLore" /></SectionLink>
      <nav aria-label={t.navigation}>
        <SectionLink to="/servidores/" aria-current={pathname === '/servidores/' ? 'location' : undefined}>{t.navServers}</SectionLink>
        <SectionLink to="/promocion/" aria-current={pathname === '/promocion/' ? 'location' : undefined}>{t.navPromotion}</SectionLink>
      </nav>
      <div className="language-switch">
        <label className="sr-only" htmlFor="language">{t.language}</label>
        <select id="language" name="language" value={language} onChange={(event) => changeLanguage(event.target.value)}>
          <option value="es" lang="es" aria-label="Español">Es</option><option value="en" lang="en" aria-label="English">En</option><option value="fr" lang="fr" aria-label="Français">Fr</option>
        </select>
      </div>
      <DiscordLink className="button button-gold header-action" accessibleHint>{t.discordName}</DiscordLink>
    </div>
  </header>;
}

function Hero() {
  const { t } = useLanguage();
  return <section className="launcher-hero" id="inicio" aria-labelledby="hero-title">
    <h1 id="hero-title">{t.heroLine1} {t.heroLine2} {t.heroEmphasis}</h1>
    <p className="hero-description">{t.heroDescription2}</p>
    <div className="hero-actions">
      <SectionLink className="button button-gold" to="/promocion/"><span>{t.headerPromote}</span></SectionLink>
      <SectionLink className="hero-link" to="/servidores/"><span>{t.explore}</span></SectionLink>
    </div>
  </section>;
}

function Directory() {
  return <ServerDirectory />;
}

function ServerCard({ server }) {
  const { t } = useLanguage();
  return <article className="server-card">
    {server.image && <img src={server.image} alt="" width="640" height="400" loading="lazy" decoding="async" />}
    <div className="server-meta"><span>{t.promotedListing}</span>{server.language && <span>{server.language}</span>}</div>
    <h3>{server.name}</h3><p>{server.description}</p>
    {server.url && <a className="text-link" href={server.url} target="_blank" rel="noopener noreferrer"><span>{t.visitServer}</span><Arrow /><span className="sr-only">{t.opensNewTab}</span></a>}
  </article>;
}

function RequestPromotion({listingType}) {
  const { language, t } = useLanguage();
  const messageRef = useRef(null);
  const [copyResult, setCopyResult] = useState(null);
  const message = listingRequestMessage(t,listingType);
  const status = copyResult?.language === language && copyResult?.listingType === listingType ? copyResult.status : 'idle';

  async function copyMessage() {
    const result = await copyRequestMessage(message, {
      clipboard: navigator.clipboard,
      selectMessage() {
        messageRef.current?.focus();
        messageRef.current?.select();
      },
    });
    setCopyResult({ language, listingType, status: result });
  }

  return <div className="request-panel" aria-labelledby="request-title">
    <h3 id="request-title">{t.requestTitle}</h3>
    <p className="request-intro">{t.requestIntro}</p>
    <ol className="request-steps">
      <li>
        <span className="step-number" aria-hidden="true">01</span>
        <div className="request-step-content">
          <label htmlFor="request-message">{t.copyStep}</label>
          <textarea ref={messageRef} id="request-message" value={message} readOnly rows="4" spellCheck="false" aria-describedby="copy-status" />
          <button className="button button-outline copy-button" type="button" onClick={copyMessage}>{status === 'copied' ? t.copied : t.copyMessage}<Arrow>{status === 'copied' ? '✓' : '⧉'}</Arrow></button>
          <p className="copy-status" id="copy-status" role="status" aria-live="polite">{status === 'copied' ? t.copySuccess : status === 'manual' ? t.copyFallback : t.copyHint}</p>
        </div>
      </li>
      <li>
        <span className="step-number" aria-hidden="true">02</span>
        <div className="request-step-content">
          <h4>{t.discordStep}</h4>
          <DiscordLink className="button button-gold" accessibleHint>{t.openDiscord}</DiscordLink>
          <p className="discord-note">{t.discordInstructions}</p>
          <RequestPrivacyNote />
        </div>
      </li>
    </ol>
  </div>;
}

function RequestPrivacyNote() {
  const { legal } = useLanguage();
  return <p className="request-privacy-note">{legal.requestNote} <SectionLink to="/privacidad/">{legal.privacy.title}</SectionLink>.</p>;
}

function Promotion() {
  const { t } = useLanguage();
  const [listingType,setListingType] = useState('free');
  return <section className="promotion shell" id="promocion" aria-labelledby="promotion-title">
    <div className="promotion-copy">
      <h2 id="promotion-title"><span>{t.promotionLine1}</span><br /><em>{t.promotionLine2}</em></h2>
      <p>{t.promotionDescription}</p>
      <fieldset className="listing-plans"><legend>{t.listingOptionsLegend}</legend>
        <label className="listing-plan"><input type="radio" name="listing-type" value="free" checked={listingType==='free'} onChange={()=>setListingType('free')}/><span className="listing-plan-content"><span className="listing-plan-top"><strong>{t.freeListingTitle}</strong><b>0 €</b></span><span className="listing-plan-description">{t.freeListingDescription}</span></span></label>
        <label className="listing-plan listing-plan-paid"><input type="radio" name="listing-type" value="paid" checked={listingType==='paid'} onChange={()=>setListingType('paid')}/><span className="listing-plan-content"><span className="listing-plan-top"><strong>{t.paidListingTitle}</strong><b>5 <small>{t.perMonth}</small></b></span><span className="listing-plan-description">{t.paidListingDescription}</span><span className="listing-plan-offer">{t.offer} · {t.limitedTime}</span></span></label>
      </fieldset>
      <h3 className="inclusion-heading">{t.inclusionTitle}</h3>
      <ul className="inclusions">{['inclusionName', 'inclusionDescription', 'inclusionLink'].map((key) => <li key={key}><Arrow>↳</Arrow><span>{t[key]}</span></li>)}</ul>
      <p className="promotion-note">{t.promotionTerms}</p>
    </div>
    <RequestPromotion listingType={listingType} />
  </section>;
}

function Questions() {
  const { t } = useLanguage();
  return <section className="questions shell" aria-labelledby="questions-title">
    <h2 id="questions-title">{t.questionsTitle}</h2>
    <div className="questions-list">
      <details><summary><span>{t.faq1Question}</span><Arrow>+</Arrow></summary><p>{t.faq1Answer}</p></details>
      <details><summary><span>{t.faq2Question}</span><Arrow>+</Arrow></summary><p>{t.faq2Before}<a href={discordUrl} target="_blank" rel="noopener noreferrer">{t.discordName}</a>{t.faq2After}</p></details>
      <details><summary><span>{t.faq3Question}</span><Arrow>+</Arrow></summary><p>{t.faq3Answer}</p></details>
      <details><summary><span>{t.faq4Question}</span><Arrow>+</Arrow></summary><p>{t.faq4Answer}</p></details>
    </div>
  </section>;
}

function Footer({ onOpenNotice, noticeTriggerRef }) {
  const { t, legal } = useLanguage();
  return <footer className="footer shell">
    <div className="footer-top"><p className="footer-description"><strong>NetLore</strong><span>{t.footerDescription}</span></p><SectionLink className="text-link" to="/promocion/"><span>{t.promoteServer}</span><Arrow /></SectionLink></div>
    <div className="footer-legal"><SectionLink to="/privacidad/">{legal.privacy.title}</SectionLink><SectionLink to="/cookies/">{legal.cookies.title}</SectionLink><button type="button" ref={noticeTriggerRef} onClick={onOpenNotice}>{legal.openNotice}</button></div>
    <div className="footer-bottom"><span>{t.copyright}</span><SectionLink to="/"><span>{t.backTop}</span><Arrow>↑</Arrow></SectionLink></div>
  </footer>;
}

function Portal() {
  return <Launcher hero={<Hero />} directory={<Directory />} promotion={<Promotion />} questions={<Questions />} citizen={<CitizenPass />} />;
}

function NotFound() {
  const { t } = useLanguage();
  return <main className="not-found shell" id="contenido"><h1>{t.notFoundTitle}</h1><p>{t.notFoundText}</p><SectionLink className="button button-gold" to="/">{t.backHome}<Arrow /></SectionLink></main>;
}

export default function App() {
  const { t, legal, language } = useLanguage();
  const { pathname } = useLocation();
  const [noticeVisible, setNoticeVisible] = useState(() => readLocal(NOTICE_KEY) !== NOTICE_VERSION);
  const [focusNotice, setFocusNotice] = useState(false);
  const noticeTriggerRef = useRef(null);
  useEffect(() => {
    document.title = pageTitle(pathname,language,t.pageTitle);
    const canonical=document.querySelector('link[rel="canonical"]');
    const url=new URL(import.meta.env.BASE_URL.replace(/\/$/,'')+pathname,location.origin).href;
    if(canonical)canonical.href=url;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content',document.title);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content',url);
  }, [pathname, language, t.pageTitle]);
  function dismissNotice() {
    writeLocal(NOTICE_KEY, NOTICE_VERSION);
    setNoticeVisible(false);
    setFocusNotice(false);
  }
  function openNotice() { setFocusNotice(true); setNoticeVisible(true); }
  function clearPreferences() {
    const success = clearNetLorePreferences();
    if (success) { setFocusNotice(false); setNoticeVisible(true); }
    return success;
  }
  const isPortal = ['/', '/index.html', '/servidores/', '/promocion/', '/informacion/', '/pase/'].includes(pathname);
  return <div className={`${noticeVisible ? 'app-with-notice' : ''} ${isPortal ? 'launcher-app' : ''}`}>
    <NavigationEffects />
    <button className="skip-link" type="button" onClick={() => scrollToSection('contenido', true)}>{t.skip}</button>
    <Header />
    <Suspense fallback={<main id="contenido" className="shell" aria-busy="true"><p role="status">NetLore…</p></main>}><Routes><Route path="/" element={<Portal />} /><Route path="/servidores/" element={<Portal />} /><Route path="/promocion/" element={<Portal />} /><Route path="/informacion/" element={<Portal />} /><Route path="/pase/" element={<Portal />} /><Route path="/index.html" element={<Portal />} /><Route path="/admin/recursos?" element={<Admin />} /><Route path="/privacidad/" element={<PrivacyPage />} /><Route path="/cookies/" element={<CookiesPage onClearPreferences={clearPreferences} />} /><Route path="*" element={<NotFound />} /></Routes></Suspense>
    <Footer onOpenNotice={openNotice} noticeTriggerRef={noticeTriggerRef} />
    {noticeVisible && <PrivacyNotice onDismiss={dismissNotice} focusOnOpen={focusNotice} returnFocusRef={noticeTriggerRef} />}
  </div>;
}
