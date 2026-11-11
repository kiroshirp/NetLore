import {useEffect,useState} from 'react';
import {api} from './api.mjs';
import {useLanguage} from './i18n';
import {paginate} from './pagination.mjs';
import Pagination from './Pagination.jsx';

export const resourceCopy={
 es:{catalog:'Catálogo',back:'Volver al catálogo',title:'Recursos privados',intro:'Tu biblioteca de recursos para Open77. Solo tú puedes ver estas fichas, incluso cuando están listas.',add:'Nuevo recurso',edit:'Editar',save:'Guardar recurso',cancel:'Cancelar',name:'Nombre',category:'Categoría',all:'Todas',status:'Estado',draft:'Borrador',ready:'Listo',script:'Script',map:'Mapa',addon:'Addon',other:'Otro recurso',description:'Descripción',url:'Enlace de referencia (HTTPS, opcional)',open:'Abrir referencia',search:'Buscar por nombre',empty:'Todavía no tienes recursos.',none:'No hay coincidencias.',load:'Cargando recursos…',retry:'Actualizar',saved:'Recurso guardado.'},
 en:{catalog:'Catalog',back:'Back to catalog',title:'Private resources',intro:'Your Open77 resource library. Only you can see these entries, even when ready.',add:'New resource',edit:'Edit',save:'Save resource',cancel:'Cancel',name:'Name',category:'Category',all:'All',status:'Status',draft:'Draft',ready:'Ready',script:'Script',map:'Map',addon:'Addon',other:'Other resource',description:'Description',url:'Reference link (HTTPS, optional)',open:'Open reference',search:'Search by name',empty:'No resources yet.',none:'No matches.',load:'Loading resources…',retry:'Refresh',saved:'Resource saved.'},
 fr:{catalog:'Catalogue',back:'Retour au catalogue',title:'Ressources privées',intro:'Ta bibliothèque de ressources Open77. Toi seul peux voir ces fiches, même lorsqu’elles sont prêtes.',add:'Nouvelle ressource',edit:'Modifier',save:'Enregistrer',cancel:'Annuler',name:'Nom',category:'Catégorie',all:'Toutes',status:'Statut',draft:'Brouillon',ready:'Prête',script:'Script',map:'Carte',addon:'Extension',other:'Autre ressource',description:'Description',url:'Lien de référence (HTTPS, facultatif)',open:'Ouvrir la référence',search:'Rechercher par nom',empty:'Aucune ressource pour le moment.',none:'Aucun résultat.',load:'Chargement…',retry:'Actualiser',saved:'Ressource enregistrée.'}
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
 const [detailId,setDetailId]=useState(null);
 const detail=rows?.find(row=>row.id===detailId);
 const start=row=>{setNotice(null);setEditor({original:row,values:{...row}});};
 const field=(key,value)=>setEditor(current=>({...current,values:{...current.values,[key]:value}}));
 async function save(event){event.preventDefault();if(busy)return;setBusy(true);setNotice(null);const data=editor.values;
  try{await api(data.id?'/admin/resources/'+data.id:'/admin/resources',{method:data.id?'PUT':'POST',body:JSON.stringify(data),token:session.token});setEditor(null);setRefresh(n=>n+1);setNotice({error:false,text:c.saved});}
  catch(error){fail(error);}finally{setBusy(false);}
 }
 const result=paginate((rows||[]).filter(row=>(category==='all'||row.category===category)&&row.name.toLocaleLowerCase(language).includes(query.trim().toLocaleLowerCase(language))),page,12);
 return <section className="admin-box"><div className="admin-list-heading"><h2>{editor?(editor.values.id?c.edit+' · '+editor.original.name:c.add):detail?detail.name:c.catalog}</h2>{!editor&&!detail&&<button className="button button-pink" onClick={()=>start(blank)}>{c.add}</button>}</div>
 {editor?<form onSubmit={save}><fieldset disabled={busy}><label>{c.name}<input required autoFocus maxLength={100} value={editor.values.name} onChange={e=>field('name',e.target.value)}/></label>
 <label>{c.category}<select value={editor.values.category} onChange={e=>field('category',e.target.value)}>{categories.map(k=><option key={k} value={k}>{c[k]}</option>)}</select></label>
 <label>{c.status}<select value={editor.values.status} onChange={e=>field('status',e.target.value)}>{['draft','ready'].map(k=><option key={k} value={k}>{c[k]}</option>)}</select></label>
 <label>{c.description}<textarea rows="4" maxLength={2000} value={editor.values.description} onChange={e=>field('description',e.target.value)}/></label>
 <label>{c.url}<input type="url" pattern="https://.*" maxLength={2048} value={editor.values.url} onChange={e=>field('url',e.target.value)}/></label>
 <button className="button button-pink">{c.save}</button><button type="button" className="admin-cancel" onClick={()=>{if(discard())setEditor(null);}}>{c.cancel}</button></fieldset></form>:detail?<article className="resource-detail"><p>{c[detail.category]} · {c[detail.status]}</p><p className="resource-description">{detail.description}</p>{detail.url&&<p><a className="text-link" href={detail.url} target="_blank" rel="noopener noreferrer">{c.open} ↗</a></p>}<button className="button button-outline" onClick={()=>start(detail)}>{c.edit}</button> <button className="admin-cancel" onClick={()=>setDetailId(null)}>{c.back}</button></article>:<>
 <div className="admin-filters"><label>{c.search}<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/></label></div><div className="resource-categories" role="group" aria-label={c.category}>{['all',...categories].map(k=><button key={k} aria-pressed={category===k} onClick={()=>{setCategory(k);setPage(1);}}>{c[k]} <strong>{rows?(k==='all'?rows.length:rows.filter(row=>row.category===k).length):'—'}</strong></button>)}</div>
 <button className="admin-cancel" onClick={()=>setRefresh(n=>n+1)}>{c.retry}</button>
 {rows===null?<p role="status">{c.load}</p>:rows===undefined?null:!result.total?<p>{rows.length?c.none:c.empty}</p>:<ul className="resource-grid">{result.items.map(row=><li key={row.id}><button onClick={()=>setDetailId(row.id)}><span>{c[row.category]} · {c[row.status]}</span><strong>{row.name}</strong></button></li>)}</ul>}
 <Pagination result={result} onChange={setPage}/></>}
 </section>;
}
