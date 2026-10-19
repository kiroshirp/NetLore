const titles={
 en:{servidores:'Cyberpunk server directory',promocion:'Free listings and priority promotion',informacion:'Frequently asked questions',pase:'Create your citizen pass',privacidad:'Privacy policy',cookies:'Cookies and local storage',admin:'Admin'},
 es:{servidores:'Directorio de servidores Cyberpunk',promocion:'Fichas gratuitas y promoción destacada',informacion:'Preguntas frecuentes',pase:'Crea tu pase de ciudadano',privacidad:'Política de privacidad',cookies:'Cookies y almacenamiento local',admin:'Administración'},
 fr:{servidores:'Annuaire de serveurs Cyberpunk',promocion:'Fiches gratuites et promotion prioritaire',informacion:'Questions fréquentes',pase:'Crée ton pass citoyen',privacidad:'Politique de confidentialité',cookies:'Cookies et stockage local',admin:'Administration'}
};
export const publicRoutes=['servidores','promocion','informacion','pase','privacidad','cookies'];
export function pageTitle(path,language='en',home='NetLore — The city has more stories'){
 const key=path.replace(/^\/+|\/+$/g,'');
 return (titles[language]||titles.en)[key]?`${(titles[language]||titles.en)[key]} — NetLore`:home;
}
export function metadataHtml(html,route,siteUrl){
 const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const title=pageTitle(route);
 const url=new URL(route?`${route}/`:'',siteUrl.endsWith('/')?siteUrl:siteUrl+'/').href;
 const description=html.match(/<meta name="description" content="([^"]*)"/)?.[1]||'';
 const image=new URL('assets/netlore-logo.png',siteUrl.endsWith('/')?siteUrl:siteUrl+'/').href;
 return html.replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`).replace('</head>',[
  `<link rel="canonical" href="${escape(url)}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:title" content="${escape(title)}" />`,
  `<meta property="og:description" content="${description}" />`,
  `<meta property="og:url" content="${escape(url)}" />`,
  `<meta property="og:image" content="${escape(image)}" />`,
  ...(route==='admin'?['<meta name="robots" content="noindex, nofollow" />']:[]),
  '</head>'
 ].join('\n'));
}
