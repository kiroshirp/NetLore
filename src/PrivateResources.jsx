import {useEffect,useState} from 'react';
import {api} from './api.mjs';
import {useLanguage} from './i18n';
import {paginate} from './pagination.mjs';
import Pagination from './Pagination.jsx';

export const resourceCopy={
 es:{title:'Recursos privados',intro:'Tu biblioteca de recursos para Open77. Solo tú puedes ver estas fichas, incluso cuando están listas.',add:'Nuevo recurso',edit:'Editar',save:'Guardar recurso',cancel:'Cancelar',name:'Nombre',category:'Categoría',all:'Todas',status:'Estado',draft:'Borrador',ready:'Listo',script:'Script',map:'Mapa',addon:'Addon',other:'Otro recurso',description:'Descripción',url:'Enlace de referencia (HTTPS, opcional)',open:'Abrir referencia',search:'Buscar por nombre',empty:'Todavía no tienes recursos.',none:'No hay coincidencias.',load:'Cargando recursos…',retry:'Actualizar',saved:'Recurso guardado.'},
 en:{title:'Private resources',intro:'Your Open77 resource library. Only you can see these entries, even when ready.',add:'New resource',edit:'Edit',save:'Save resource',cancel:'Cancel',name:'Name',category:'Category',all:'All',status:'Status',draft:'Draft',ready:'Ready',script:'Script',map:'Map',addon:'Addon',other:'Other resource',description:'Description',url:'Reference link (HTTPS, optional)',open:'Open reference',search:'Search by name',empty:'No resources yet.',none:'No matches.',load:'Loading resources…',retry:'Refresh',saved:'Resource saved.'},
 fr:{title:'Ressources privées',intro:'Ta bibliothèque de ressources Open77. Toi seul peux voir ces fiches, même lorsqu’elles sont prêtes.',add:'Nouvelle ressource',edit:'Modifier',save:'Enregistrer',cancel:'Annuler',name:'Nom',category:'Catégorie',all:'Toutes',status:'Statut',draft:'Brouillon',ready:'Prête',script:'Script',map:'Carte',addon:'Extension',other:'Autre ressource',description:'Description',url:'Lien de référence (HTTPS, facultatif)',open:'Ouvrir la référence',search:'Rechercher par nom',empty:'Aucune ressource pour le moment.',none:'Aucun résultat.',load:'Chargement…',retry:'Actualiser',saved:'Ressource enregistrée.'}
};
const categories=['script','map','addon','other'];
const blank={name:'',category:'script',status:'draft',description:'',url:''};
export default function PrivateResources({session,editor,setEditor,fail,setNotice,busy,setBusy,discard}){
 const {language}=useLanguage(),c=resourceCopy[language];
 const [rows,setRows]=useState(null),[refresh,setRefresh]=useState(0),[query,setQuery]=useState(''),[category,setCategory]=useState('all'),[page,setPage]=useState(1);
 useEffect(()=>{const controller=new AbortController();
  api('/admin/resources',{token:session.token,signal:controller.signal}).then(data=>{if(!controller.signal.aborted)setRows(data.resources);}).catch(error=>{if(!controller.signal.aborted){setRows(undefined);fail(error);}});
  return ()=>controller.abort();
 },[session.token,refresh]);
 const start=row=>{setNotice(null);setEditor({original:row,values:{...row}});};
 const field=(key,value)=>setEditor(current=>({...current,values:{...current.values,[key]:value}}));
 async function save(event){event.preventDefault();if(busy)return;setBusy(true);setNotice(null);const data=editor.values;
  try{await api(data.id?'/admin/resources/'+data.id:'/admin/resources',{method:data.id?'PUT':'POST',body:JSON.stringify(data),token:session.token});setEditor(null);setRefresh(n=>n+1);setNotice({error:false,text:c.saved});}
  catch(error){fail(error);}finally{setBusy(false);}
 }
 const result=paginate((rows||[]).filter(row=>(category==='all'||row.category===category)&&row.name.toLocaleLowerCase(language).includes(query.trim().toLocaleLowerCase(language))),page,12);
 return <section className="admin-box"><div className="admin-list-heading"><h2>{editor?(editor.values.id?c.edit+' · '+editor.original.name:c.add):c.title}</h2>{!editor&&<button className="button button-pink" onClick={()=>start(blank)}>{c.add}</button>}</div><p>{c.intro}</p>
 {editor?<form onSubmit={save}><fieldset disabled={busy}><label>{c.name}<input required autoFocus maxLength={100} value={editor.values.name} onChange={e=>field('name',e.target.value)}/></label>
 <label>{c.category}<select value={editor.values.category} onChange={e=>field('category',e.target.value)}>{categories.map(k=><option key={k} value={k}>{c[k]}</option>)}</select></label>
 <label>{c.status}<select value={editor.values.status} onChange={e=>field('status',e.target.value)}>{['draft','ready'].map(k=><option key={k} value={k}>{c[k]}</option>)}</select></label>
 <label>{c.description}<textarea rows="4" maxLength={2000} value={editor.values.description} onChange={e=>field('description',e.target.value)}/></label>
 <label>{c.url}<input type="url" pattern="https://.*" maxLength={2048} value={editor.values.url} onChange={e=>field('url',e.target.value)}/></label>
 <button className="button button-pink">{c.save}</button><button type="button" className="admin-cancel" onClick={()=>{if(discard())setEditor(null);}}>{c.cancel}</button></fieldset></form>:<>
 <div className="admin-filters"><label>{c.search}<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></label><label>{c.category}<select value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}>{['all',...categories].map(k=><option key={k} value={k}>{c[k]}</option>)}</select></label></div>
 <button className="admin-cancel" onClick={()=>setRefresh(n=>n+1)}>{c.retry}</button>
 {rows===null?<p role="status">{c.load}</p>:rows===undefined?null:!result.total?<p>{rows.length?c.none:c.empty}</p>:<ul className="admin-server-list">{result.items.map(row=><li key={row.id}><div><h3>{row.name}</h3><p>{c[row.category]} · {c[row.status]}</p><p className="resource-description">{row.description}</p>{row.url&&<a className="text-link" href={row.url} target="_blank" rel="noopener noreferrer">{c.open} ↗</a>}</div><button className="button button-outline" onClick={()=>start(row)}>{c.edit}</button></li>)}</ul>}
 <Pagination result={result} onChange={setPage}/></>}
 </section>;
}
