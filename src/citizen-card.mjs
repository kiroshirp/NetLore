export const factions = [
  {id:'maelstrom',name:'Maelstrom',color:'#ff526d',secondary:'#fc9e76',motif:'optic',code:'ML'},
  {id:'arasaka',name:'Arasaka',color:'#f34c64',secondary:'#e7eaf4',motif:'tower',code:'AR'},
  {id:'trauma',name:'Trauma Team',color:'#56e5cb',secondary:'#f5f8fc',motif:'medical',code:'TT'},
  {id:'nomad',name:'Nomad',color:'#f5be68',secondary:'#81d7dc',motif:'road',code:'NM'},
];
export const citizenCopy = {
  en:{title:'Citizen pass',intro:'One city. Your identity.',description:'Choose your allegiance. Make your mark in Night City.',name:'Username',role:'Role',faction:'Preferred faction',format:'Image format',wide:'Card · 1600 × 900',square:'Avatar · 1080 × 1080',download:'Download PNG',working:'Preparing image…',error:'The image could not be prepared. Please try again.',ready:'Your image is ready.',privacy:'Created on your device. These fields are not sent or saved.',preview:'Live preview',alias:'YOUR ALIAS',rolePlaceholder:'Your role',roleExample:'e.g. Netrunner, medic, solo…',affiliation:'AFFILIATION',roleLabel:'ROLE',pass:'CITIZEN PASS',note:'Fan-made roleplay card · Not an official credential',help:'Use the wide card as a signature or share the square version as an avatar.',required:'Enter a username and role to download your pass.'},
  es:{title:'Pase de Ciudadano',intro:'Una ciudad. Tu identidad.',description:'Elige tu facción. Deja tu huella en Night City.',name:'Nombre de usuario',role:'Rol',faction:'Facción preferida',format:'Formato de imagen',wide:'Tarjeta · 1600 × 900',square:'Avatar · 1080 × 1080',download:'Descargar PNG',working:'Preparando imagen…',error:'No se ha podido preparar la imagen. Inténtalo de nuevo.',ready:'Tu imagen está lista.',privacy:'Se crea en tu dispositivo. Estos campos no se envían ni se guardan.',preview:'Vista previa en directo',alias:'TU ALIAS',rolePlaceholder:'Tu rol',roleExample:'Ej.: netrunner, médico, solo…',affiliation:'AFILIACIÓN',roleLabel:'ROL',pass:'PASE DE CIUDADANO',note:'Tarjeta de rol creada por fans · Sin validez oficial',help:'Usa la tarjeta horizontal como firma o comparte la versión cuadrada como avatar.',required:'Introduce un nombre de usuario y un rol para descargar tu pase.'},
  fr:{title:'Pass citoyen',intro:'Une ville. Ton identité.',description:'Choisis ta faction. Laisse ta trace à Night City.',name:'Nom d’utilisateur',role:'Rôle',faction:'Faction préférée',format:'Format de l’image',wide:'Carte · 1600 × 900',square:'Avatar · 1080 × 1080',download:'Télécharger le PNG',working:'Préparation de l’image…',error:'Impossible de préparer l’image. Réessaie.',ready:'Ton image est prête.',privacy:'Créé sur ton appareil. Ces champs ne sont ni envoyés ni enregistrés.',preview:'Aperçu en direct',alias:'TON ALIAS',rolePlaceholder:'Ton rôle',roleExample:'Ex. : netrunner, médecin, solo…',affiliation:'AFFILIATION',roleLabel:'RÔLE',pass:'PASS CITOYEN',note:'Carte de jeu de rôle créée par des fans · Sans valeur officielle',help:'Utilise la carte horizontale comme signature ou la version carrée comme avatar.',required:'Saisis un nom d’utilisateur et un rôle pour télécharger ton pass.'},
};
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function cleanCardText(value, max) { return Array.from(String(value).replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').trim()).slice(0,max).join(''); }
export function cardFilename(name, format) { return `netlore-${cleanCardText(name,32).normalize('NFKD').replace(/[^a-z0-9_-]/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'') || 'citizen'}-${format==='square'?'avatar':'pass'}.png`; }

export function citizenSvg({name,role,faction='maelstrom',format='wide',language='en',logos={}}) {
  const f=factions.find(item=>item.id===faction)||factions[0], t=citizenCopy[language]||citizenCopy.en;
  const square=format==='square', w=square?1080:1600, h=square?1080:900;
  const text=(x,y,size,value,fill='#f2f5fc',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${escape(value)}</text>`;
  const alias=cleanCardText(name,32)||t.alias, job=cleanCardText(role,40)||t.rolePlaceholder;
  const nx=square?76:570, ny=square?665:344;
  const emblem={
    optic:'<circle r="95"/><circle r="52"/><circle r="12" fill="currentColor"/><path d="M-155-45h65m180 0h65M-155 45h65m180 0h65M-46-87l-40-55m132 55 40-55M-46 87l-40 55m132-55 40 55"/>',
    tower:'<path d="M-120 95V-45L0-135 120-45V95ZM-70 95V-20L0-75 70-20V95M0-75V95M-140 125h280"/>',
    medical:'<path d="M-40-130h80v90h90v80H40v90h-80V40h-90v-80h90Z"/><path d="M-150 0h60l20-25 28 55L0-40 30 0h120" stroke="#f5f8fc" stroke-width="6"/>',
    road:'<path d="M-150 90 0-110 150 90ZM-170 120h340M-42 90 0-40 42 90M0 40v32M0 90v20M-105-60l-30-28m240 28 30-28"/>',
  }[f.motif];
  const portraitX=square?540:282, portraitY=square?350:428, scale=square?1:.96;
  const brand=(href,x,y,width,height)=>href?`<image href="${escape(href)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#17243b"/><stop offset="1" stop-color="#070e1c"/></linearGradient><radialGradient id="glow"><stop stop-color="${f.color}" stop-opacity=".22"/><stop offset="1" stop-color="${f.color}" stop-opacity="0"/></radialGradient><pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0v44" fill="none" stroke="#647692" stroke-opacity=".12"/></pattern><clipPath id="edge"><path d="M40 0H${w-70}L${w} 70V${h-40}L${w-40} ${h}H70L0 ${h-70}V40Z"/></clipPath></defs>
  <g clip-path="url(#edge)" font-family="'Segoe UI',Arial,sans-serif"><path fill="url(#bg)" d="M0 0H${w}V${h}H0Z"/><path fill="url(#grid)" d="M0 0H${w}V${h}H0Z"/><ellipse cx="${portraitX}" cy="${portraitY}" rx="500" ry="520" fill="url(#glow)"/>
  <path d="M0 0H${w}v12H0ZM0 ${h-12}H${w}v12H0Z" fill="${f.color}"/>
  <path d="M${w-480} 0 ${w-200} 280H${w}M${w-360} 0 ${w-130} 230H${w}" stroke="${f.color}" stroke-opacity=".13" stroke-width="30" fill="none"/>
  ${text(60,78,18,'NETLORE / NIGHT CITY',f.secondary,'letter-spacing="5"')}
  <rect x="${w-145}" y="47" width="86" height="32" rx="16" fill="#ff5ec4"/>${text(w-102,69,16,'BETA','#120b18','text-anchor="middle" font-weight="700"')}
  <g transform="translate(${portraitX},${portraitY}) scale(${scale})" color="${f.color}" stroke="currentColor" fill="none" stroke-width="10"><path d="M-190-210h270l110 110v280l-80 70h-300Z" stroke-opacity=".3" stroke-width="2"/><circle r="175" stroke-opacity=".18" stroke-dasharray="12 15" stroke-width="2"/>${emblem}<path d="M-210-160v-50h50m320 0h50v50m0 320v50h-50m-320 0h-50v-50" stroke-width="4"/></g>
  ${!square?`<path d="M510 220v430" stroke="#4d5f7b" stroke-opacity=".5"/>`:''}
  ${text(nx,ny-63,19,t.pass,f.color,'letter-spacing="4"')}
  ${text(nx,ny,Math.min(square?64:78,(square?900:920)/(Array.from(alias).length||1)),alias,'#f2f5fc','font-weight="750"')}
  ${text(nx,ny+65,15,t.roleLabel,'#90a2bc','letter-spacing="3"')}
  ${text(nx,ny+109,Math.min(34,850/(Array.from(job).length||1)),job)}
  ${text(nx,ny+163,15,t.affiliation,'#90a2bc','letter-spacing="3"')}
  ${text(nx,ny+207,34,f.name,f.color,'font-weight="650"')}
  <path d="M60 ${h-152}H${w-60}" stroke="#52617b" stroke-opacity=".5"/>
  ${brand(logos.netlore,45,h-145,250,100)}${brand(logos.open77,w-305,h-126,235,55)}
  ${text(60,h-34,14,t.note,'#91a0b7')}
  ${text(w-60,h-34,14,'NETLORE / OPEN2077','#91a0b7','text-anchor="end"')}
  </g></svg>`;
}

export async function loadCardLogos(base) {
  const values=await Promise.all(['netlore-logo.png','open77-logo.png'].map(async name=>{
    const response=await fetch(`${base}assets/${name}`);
    if(!response.ok)throw new Error('Logo unavailable');
    const blob=await response.blob();
    return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
  }));
  return {netlore:values[0],open77:values[1]};
}

export async function cardPng(svg) {
  const image=new Image();
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  try {
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');ctx.drawImage(image,0,0);
    return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG unavailable')),'image/png'));
  } finally { URL.revokeObjectURL(url); }
}
