import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from './i18n';
import { SectionLink } from './navigation';
import { legalContact, privacySources } from './legal-config.mjs';
import { LANGUAGE_KEY, NOTICE_KEY, NOTICE_VERSION } from './privacy-storage.mjs';

export function PrivacyNotice({ onDismiss, focusOnOpen, returnFocusRef }) {
  const { legal } = useLanguage();
  const noticeRef = useRef(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty('--privacy-notice-height', `${entry.target.getBoundingClientRect().height + 24}px`);
    });
    observer.observe(noticeRef.current);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--privacy-notice-height'); };
  }, []);
  useEffect(() => { if (focusOnOpen) noticeRef.current?.focus({ preventScroll: true }); }, [focusOnOpen]);
  function dismiss() {
    onDismiss();
    if (focusOnOpen) returnFocusRef.current?.focus({ preventScroll: true });
  }
  return <aside className="privacy-notice" ref={noticeRef} tabIndex="-1" aria-labelledby="privacy-notice-title">
    <div className="privacy-notice-copy">
      <h2 id="privacy-notice-title">{legal.notice.title}</h2>
      <p>{legal.notice.body}</p>
      <div className="privacy-notice-links"><SectionLink to="/cookies/">{legal.cookies.title}</SectionLink><SectionLink to="/privacidad/">{legal.privacy.title}</SectionLink></div>
    </div>
    <button type="button" className="button button-pink" onClick={dismiss}>{legal.notice.dismiss}</button>
  </aside>;
}

function LegalSection({ section }) {
  return <section className="legal-section"><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>;
}

function LegalLayout({ title, intro, children }) {
  const { legal } = useLanguage();
  return <main id="contenido" className="legal-page shell">
    <div className="legal-top"><SectionLink className="text-link" to="/">← {legal.backHome}</SectionLink><span>{legal.updated} <time dateTime={NOTICE_VERSION}>16/10/2026</time></span></div>
    <h1>{title}</h1><p className="legal-intro">{intro}</p>
    {children}
    <nav className="legal-navigation" aria-label={legal.navigation}><SectionLink to="/privacidad/">{legal.privacy.title}</SectionLink><SectionLink to="/cookies/">{legal.cookies.title}</SectionLink></nav>
  </main>;
}

export function PrivacyPage() {
  const { legal } = useLanguage();
  return <LegalLayout title={legal.privacy.title} intro={legal.privacy.intro}>
    <section className="legal-section"><h2>{legal.identityTitle}</h2>
      <dl className="legal-identity"><div><dt>{legal.controller}</dt><dd>{legalContact.name}</dd></div><div><dt>{legal.project}</dt><dd>{legalContact.project}</dd></div><div><dt>{legal.countryLabel}</dt><dd>{legal.country}</dd></div><div><dt>{legal.contact}</dt><dd><a href={`mailto:${legalContact.email}`}>{legalContact.email}</a></dd></div></dl>
    </section>
    {legal.privacy.sections.map((section) => <LegalSection key={section.title} section={section} />)}
    <section className="legal-section"><h2>{legal.providersTitle}</h2><p>{legal.providersDescription}</p>
      <ul className="legal-source-links">{privacySources.map((source) => <li key={source.name}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}<span className="sr-only">{legal.opensNewTab}</span> ↗</a></li>)}</ul>
    </section>
    <section className="legal-section"><h2>{legal.rightsTitle}</h2><p>{legal.rights}</p><p><a href={`mailto:${legalContact.email}`}>{legalContact.email}</a></p><p>{legal.complaint} <a href="https://www.aepd.es/" target="_blank" rel="noopener noreferrer">Agencia Española de Protección de Datos (AEPD)<span className="sr-only">{legal.opensNewTab}</span> ↗</a>.</p></section>
  </LegalLayout>;
}

export function CookiesPage({ onClearPreferences }) {
  const { legal } = useLanguage();
  const [resetResult, setResetResult] = useState(null);
  function resetPreferences() { setResetResult(onClearPreferences() ? 'success' : 'error'); }
  return <LegalLayout title={legal.cookies.title} intro={legal.cookies.intro}>
    <LegalSection section={legal.cookies.usage} />
    <section className="legal-section"><h2>{legal.cookies.inventoryTitle}</h2>
      <div className="storage-inventory">{[LANGUAGE_KEY, NOTICE_KEY].map((key, index) => <article className="storage-item" key={key}><h3>{legal.cookies.items[index].title}</h3><code>{key}</code><p>{legal.cookies.items[index].purpose}</p><p>{legal.cookies.items[index].trigger}</p><p className="storage-duration">{legal.cookies.duration}</p></article>)}</div>
    </section>
    <section className="legal-section"><h2>{legal.cookies.controlsTitle}</h2><p>{legal.cookies.controls}</p><button type="button" className="button button-outline" onClick={resetPreferences}>{legal.cookies.clear}</button><p role="status" aria-live="polite" className="preference-status">{resetResult === 'success' ? legal.cookies.cleared : resetResult === 'error' ? legal.cookies.clearError : ''}</p></section>
    <LegalSection section={legal.cookies.external} />
    <p className="legal-contact"><Link to="/privacidad/">{legal.privacy.title}</Link> · <a href={`mailto:${legalContact.email}`}>{legalContact.email}</a></p>
  </LegalLayout>;
}
