import { useLayoutEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const routes = { '/': 'inicio', '/servidores/': 'servidores', '/promocion/': 'promocion', '/informacion/': 'informacion', '/privacidad/': 'contenido', '/cookies/': 'contenido', '/admin/': 'contenido' };
const oldRoutes = { '#inicio': '/', '#contenido': '/', '#servidores': '/servidores/', '#promocion': '/promocion/' };

export function scrollToSection(id, focus = false) {
  const target = document.getElementById(id);
  if (!target) return;
  if (id === 'inicio' || target.closest('.map-portal')) window.scrollTo({ top: 0, behavior: 'instant' });
  else target.scrollIntoView({ block: 'start', behavior: 'instant' });
  if (focus) {
    const heading = target.querySelector('h1, h2') || target;
    if (!heading.hasAttribute('tabindex')) {
      heading.setAttribute('tabindex', '-1');
      heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
    }
    heading.focus({ preventScroll: true });
  }
}

export function SectionLink({ to, children, ...props }) {
  return <Link to={to} state={{ focusSection: true }} {...props}>{children}</Link>;
}

export function NavigationEffects() {
  const location = useLocation();
  const navigate = useNavigate();
  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previousRestoration; };
  }, []);
  useLayoutEffect(() => {
    const path = location.pathname === '/index.html' ? '/' : location.pathname.replace(/\/*$/, '/');
    const canonical = oldRoutes[location.hash] || path;
    if (Object.hasOwn(routes, canonical) && (location.pathname !== canonical || location.hash)) {
      navigate(canonical + location.search, { replace: true });
      return;
    }
    const id = routes[canonical];
    if (id) scrollToSection(id, Boolean(location.state?.focusSection));
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.key, location.pathname, location.search, location.hash, location.state, navigate]);
  return null;
}
