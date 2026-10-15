import { Route, Routes, useLocation } from 'react-router-dom';
import { useLanguage } from './i18n';
import { NavigationEffects, SectionLink, scrollToSection } from './navigation';

const discordUrl = 'https://discord.gg/YkKv6X6gQB';
const asset = (name) => `/assets/${name}`;
const Arrow = ({ children = '↗' }) => <span aria-hidden="true">{children}</span>;

function Eyebrow({ children }) {
  return <p className="eyebrow"><span className="pink-slash" aria-hidden="true">/</span><span>{children}</span></p>;
}

function DiscordLink({ children, className = '', accessibleHint = false }) {
  const { t } = useLanguage();
  return <a className={className} href={discordUrl} target="_blank" rel="noopener noreferrer">
    <span>{children}</span><Arrow />{accessibleHint && <span className="sr-only">{t.discordNewTab}</span>}
  </a>;
}

function Header() {
  const { language, changeLanguage, t } = useLanguage();
  const { pathname } = useLocation();
  return <header className="site-header">
    <div className="header-inner shell">
      <SectionLink className="brand" to="/" aria-label={t.home}><img src={asset('netlore-logo.png')} width="1536" height="559" alt="NetLore" /></SectionLink>
      <span className="brand-caption"><span>{t.brandLine1}</span><br /><span>{t.brandLine2}</span></span>
      <nav aria-label={t.navigation}>
        <SectionLink to="/servidores/" aria-current={pathname === '/servidores/' ? 'location' : undefined}>{t.navServers}</SectionLink>
        <SectionLink to="/promocion/" aria-current={pathname === '/promocion/' ? 'location' : undefined}>{t.navPromotion}</SectionLink>
      </nav>
      <div className="language-switch">
        <label htmlFor="language">{t.language}</label>
        <select id="language" name="language" value={language} onChange={(event) => changeLanguage(event.target.value)}>
          <option value="es" lang="es">Español</option><option value="en" lang="en">English</option><option value="fr" lang="fr">Français</option>
        </select>
      </div>
      <DiscordLink className="button button-pink header-action" accessibleHint>{t.promoteServer}</DiscordLink>
    </div>
  </header>;
}

function Hero() {
  const { t } = useLanguage();
  return <section className="hero" aria-labelledby="hero-title">
    <img className="hero-image" src={asset('netlore-city.png')} width="1672" height="941" alt="" fetchPriority="high" />
    <div className="hero-shade" aria-hidden="true" />
    <div className="hero-inner shell">
      <div className="hero-copy">
        <Eyebrow>{t.heroEyebrow}</Eyebrow>
        <h1 id="hero-title"><span>{t.heroLine1}</span><br /><span>{t.heroLine2}</span>{' '}<em>{t.heroEmphasis}</em></h1>
        <p className="hero-description"><span>{t.heroDescription1}</span><br /><span>{t.heroDescription2}</span></p>
        <SectionLink className="hero-link" to="/servidores/"><span>{t.explore}</span><Arrow>↓</Arrow></SectionLink>
      </div>
      <div className="hero-caption" aria-hidden="true"><span>{t.caption1}</span><b>{t.caption2}</b></div>
    </div>
    <div className="hero-foot shell"><span>{t.communityDirectory}</span><span>OPEN2077 <Arrow>↙</Arrow></span></div>
  </section>;
}

function Directory() {
  const { t } = useLanguage();
  return <section className="directory shell" id="servidores" aria-labelledby="directory-title">
    <div className="section-heading">
      <div><Eyebrow>{t.directoryEyebrow}</Eyebrow><h2 id="directory-title">{t.directoryTitle}</h2></div>
      <span className="category-label">CYBERPUNK <Arrow>/</Arrow> OPEN2077</span>
    </div>
    <p className="directory-description">{t.directoryDescription}</p>
    <div className="server-grid">
      <div className="directory-empty">
        <div className="empty-mark" aria-hidden="true"><span /><span /><span /></div>
        <div className="empty-copy"><p className="eyebrow">{t.emptyEyebrow}</p><h3>{t.emptyTitle}</h3><p>{t.emptyDescription}</p></div>
        <SectionLink className="text-link" to="/promocion/"><span>{t.appearHere}</span><Arrow /></SectionLink>
      </div>
    </div>
  </section>;
}

function Promotion() {
  const { t } = useLanguage();
  return <section className="promotion shell" id="promocion" aria-labelledby="promotion-title">
    <div className="promotion-copy">
      <Eyebrow>{t.promotionEyebrow}</Eyebrow>
      <h2 id="promotion-title"><span>{t.promotionLine1}</span><br /><em>{t.promotionLine2}</em></h2>
      <p><span>{t.promotionDescription1}</span><br /><span>{t.promotionDescription2}</span></p>
      <span className="promotion-note">{t.promotionNote}</span>
    </div>
    <div className="price-panel">
      <p className="offer-label">{t.offer}</p><p className="price">5<span>{t.perMonth}</span></p>
      <p className="price-note">{t.limitedTime}</p>
      <div className="price-inclusion"><Arrow>↳</Arrow><span>{t.inclusion}</span></div>
      <DiscordLink className="button button-pink" accessibleHint>{t.requestPromotion}</DiscordLink>
      <p className="discord-note"><span>{t.discordNote1}</span><br /><span>{t.discordNote2}</span></p>
    </div>
  </section>;
}

function HowItWorks() {
  const { t } = useLanguage();
  return <section className="how shell" aria-labelledby="how-title">
    <div className="how-heading"><Eyebrow>{t.howEyebrow}</Eyebrow><h2 id="how-title">{t.howTitle}</h2></div>
    <ol className="steps">{[1, 2, 3].map((step) => <li key={step}>
      <span className="step-number">0{step}</span><div><h3>{t[`step${step}Title`]}</h3><p>{t[`step${step}Description`]}</p></div>
    </li>)}</ol>
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
    </div>
  </section>;
}

function Footer() {
  const { t } = useLanguage();
  return <footer className="footer shell">
    <div className="footer-top"><p><span>{t.footerLine1}</span><br /><strong>{t.footerLine2}</strong></p><DiscordLink className="text-link">{t.talkServer}</DiscordLink></div>
    <div className="footer-wordmark" aria-hidden="true">NETLORE<span>↗</span></div>
    <div className="footer-bottom"><span>{t.copyright}</span><SectionLink to="/"><span>{t.backTop}</span><Arrow>↑</Arrow></SectionLink></div>
  </footer>;
}

function Portal() {
  return <main id="contenido"><Hero /><Directory /><Promotion /><HowItWorks /><Questions /></main>;
}

function NotFound() {
  const { t } = useLanguage();
  return <main className="not-found shell" id="contenido"><h1>{t.notFoundTitle}</h1><p>{t.notFoundText}</p><SectionLink className="button button-pink" to="/">{t.backHome}<Arrow /></SectionLink></main>;
}

export default function App() {
  const { t } = useLanguage();
  return <>
    <NavigationEffects />
    <button className="skip-link" type="button" onClick={() => scrollToSection('contenido', true)}>{t.skip}</button>
    <Header />
    <Routes><Route path="/" element={<Portal />} /><Route path="/servidores/" element={<Portal />} /><Route path="/promocion/" element={<Portal />} /><Route path="/index.html" element={<Portal />} /><Route path="*" element={<NotFound />} /></Routes>
    <Footer />
  </>;
}
