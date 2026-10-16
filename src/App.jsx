import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useLanguage } from './i18n';
import { NavigationEffects, SectionLink, scrollToSection } from './navigation';
import ServerDirectory from './Directory';
import Admin from './Admin';
import { copyRequestMessage, listingRequestMessage } from './copy-request.mjs';
import { CookiesPage, PrivacyNotice, PrivacyPage } from './Privacy';
import { clearNetLorePreferences, NOTICE_KEY, NOTICE_VERSION, readLocal, writeLocal } from './privacy-storage.mjs';
import { MapPortal } from './MapPortal';

const discordUrl = 'https://discord.gg/YkKv6X6gQB';
const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}`;
const Arrow = ({ children = '↗' }) => <span aria-hidden="true">{children}</span>;

function Eyebrow({ children }) {
  return <p className="eyebrow"><span className="pink-slash" aria-hidden="true">/</span><span>{children}</span></p>;
}

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
      <SectionLink className="brand" to="/" aria-label={t.home}><img src={asset('netlore-logo.webp')} width="768" height="280" alt="NetLore" /></SectionLink>
      <span className="brand-caption"><span>{t.brandLine1}</span><br /><span>{t.brandLine2}</span></span>
      <nav aria-label={t.navigation}>
        <SectionLink to="/servidores/" aria-current={pathname === '/servidores/' ? 'location' : undefined}>{t.navServers}</SectionLink>
        <SectionLink to="/promocion/" aria-current={pathname === '/promocion/' ? 'location' : undefined}>{t.navPromotion}</SectionLink>
      </nav>
      <div className="language-switch">
        <label className="sr-only" htmlFor="language">{t.language}</label>
        <select id="language" name="language" value={language} onChange={(event) => changeLanguage(event.target.value)}>
          <option value="es" lang="es" aria-label="Español">ES</option><option value="en" lang="en" aria-label="English">EN</option><option value="fr" lang="fr" aria-label="Français">FR</option>
        </select>
      </div>
      <SectionLink className="button button-pink header-action" to="/promocion/"><span>{t.headerPromote}</span><Arrow>↓</Arrow></SectionLink>
    </div>
  </header>;
}

function Hero() {
  const { t } = useLanguage();
  return <section className="hero" aria-labelledby="hero-title">
    <img className="hero-image" src={asset('netlore-city-1672.webp')} srcSet={[768, 1280, 1672].map((width) => `${asset(`netlore-city-${width}.webp`)} ${width}w`).join(', ')} sizes="100vw" width="1672" height="941" alt="" fetchPriority="high" />
    <div className="hero-shade" aria-hidden="true" />
    <div className="hero-inner shell">
      <div className="hero-copy">
        <Eyebrow>{t.heroEyebrow}</Eyebrow>
        <h1 id="hero-title"><span>{t.heroLine1}</span><br /><span>{t.heroLine2}</span>{' '}<em>{t.heroEmphasis}</em></h1>
        <p className="hero-description">{t.heroDescription2}</p>
        <div className="hero-actions">
          <SectionLink className="hero-link" to="/servidores/"><span>{t.explore}</span><Arrow>↓</Arrow></SectionLink>
          <SectionLink className="hero-offer" to="/promocion/">{t.heroOffer}</SectionLink>
        </div>
      </div>
    </div>
    <div className="hero-foot shell"><span>{t.communityDirectory}</span><span>OPEN2077 <Arrow>↙</Arrow></span></div>
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
          <DiscordLink className="button button-pink" accessibleHint>{t.openDiscord}</DiscordLink>
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
      <Eyebrow>{t.promotionEyebrow}</Eyebrow>
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
    <div className="footer-top"><p className="footer-description"><strong>NETLORE</strong><span>{t.footerDescription}</span></p><SectionLink className="text-link" to="/promocion/"><span>{t.promoteServer}</span><Arrow /></SectionLink></div>
    <div className="footer-legal"><SectionLink to="/privacidad/">{legal.privacy.title}</SectionLink><SectionLink to="/cookies/">{legal.cookies.title}</SectionLink><button type="button" ref={noticeTriggerRef} onClick={onOpenNotice}>{legal.openNotice}</button></div>
    <div className="footer-bottom"><span>{t.copyright}</span><SectionLink to="/"><span>{t.backTop}</span><Arrow>↑</Arrow></SectionLink></div>
  </footer>;
}

function Portal() {
  return <MapPortal directory={<Directory />} promotion={<Promotion />} questions={<Questions />} />;
}

function NotFound() {
  const { t } = useLanguage();
  return <main className="not-found shell" id="contenido"><h1>{t.notFoundTitle}</h1><p>{t.notFoundText}</p><SectionLink className="button button-pink" to="/">{t.backHome}<Arrow /></SectionLink></main>;
}

export default function App() {
  const { t, legal } = useLanguage();
  const { pathname } = useLocation();
  const [noticeVisible, setNoticeVisible] = useState(() => readLocal(NOTICE_KEY) !== NOTICE_VERSION);
  const [focusNotice, setFocusNotice] = useState(false);
  const noticeTriggerRef = useRef(null);
  useEffect(() => {
    document.title = pathname.startsWith('/admin') ? 'Admin — NetLore' : pathname.startsWith('/privacidad') ? `${legal.privacy.title} — NetLore` : pathname.startsWith('/cookies') ? `${legal.cookies.title} — NetLore` : t.pageTitle;
  }, [pathname, legal, t.pageTitle]);
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
  const isPortal = ['/', '/index.html', '/servidores/', '/promocion/', '/informacion/'].includes(pathname);
  return <div className={`${noticeVisible ? 'app-with-notice' : ''} ${isPortal ? 'map-application' : ''}`}>
    <NavigationEffects />
    <button className="skip-link" type="button" onClick={() => scrollToSection('contenido', true)}>{t.skip}</button>
    <Header />
    <Routes><Route path="/" element={<Portal />} /><Route path="/servidores/" element={<Portal />} /><Route path="/promocion/" element={<Portal />} /><Route path="/informacion/" element={<Portal />} /><Route path="/index.html" element={<Portal />} /><Route path="/admin/" element={<Admin />} /><Route path="/privacidad/" element={<PrivacyPage />} /><Route path="/cookies/" element={<CookiesPage onClearPreferences={clearPreferences} />} /><Route path="*" element={<NotFound />} /></Routes>
    <Footer onOpenNotice={openNotice} noticeTriggerRef={noticeTriggerRef} />
    {noticeVisible && <PrivacyNotice onDismiss={dismissNotice} focusOnOpen={focusNotice} returnFocusRef={noticeTriggerRef} />}
  </div>;
}
