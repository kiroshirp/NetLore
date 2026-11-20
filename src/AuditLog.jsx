import {useEffect,useState} from 'react';
import {api} from './api.mjs';
import {useLanguage} from './i18n';

const copy={
 es:{title:'Actividad reciente',empty:'Todavía no hay actividad registrada.',unavailable:'El registro no está disponible todavía en la API.',login:'Acceso',create:'Alta',update:'Edición',delete:'Borrado',server:'ficha',resource:'recurso',session:'sesión'},
 en:{title:'Recent activity',empty:'No activity has been recorded yet.',unavailable:'The activity log is not available on the API yet.',login:'Sign-in',create:'Created',update:'Edited',delete:'Deleted',server:'listing',resource:'resource',session:'session'},
 fr:{title:'Activité récente',empty:'Aucune activité enregistrée pour le moment.',unavailable:'Le journal n’est pas encore disponible sur l’API.',login:'Connexion',create:'Création',update:'Modification',delete:'Suppression',server:'fiche',resource:'ressource',session:'session'}
};

export default function AuditLog({session,refresh}) {
 const {language}=useLanguage(),c=copy[language];
 const [entries,setEntries]=useState(null);
 useEffect(()=>{
  const controller=new AbortController();
  api('/admin/audit',{token:session.token,signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setEntries(Array.isArray(data.entries)?data.entries:[]);}).catch(error=>{if(error.name!=='AbortError')setEntries(undefined);});
  return()=>controller.abort();
 },[session.token,refresh]);
 const format=new Intl.DateTimeFormat(language,{dateStyle:'short',timeStyle:'short'});
 return <section className="admin-box admin-audit" aria-labelledby="audit-title">
  <h2 id="audit-title">{c.title}</h2>
  {entries===undefined?<p className="admin-field-hint">{c.unavailable}</p>:entries===null?null:entries.length===0?<p className="admin-field-hint">{c.empty}</p>:<ul className="admin-audit-list">{entries.map(entry=><li key={entry.id}><time dateTime={new Date(entry.at*1000).toISOString()}>{format.format(new Date(entry.at*1000))}</time><strong>{c[entry.action]||entry.action}</strong><span>{c[entry.target_type]||entry.target_type}{entry.summary?`: ${entry.summary}`:''}</span></li>)}</ul>}
 </section>;
}
