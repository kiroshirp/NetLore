import {useEffect,useRef,useState} from 'react';
import {useLanguage} from './i18n';
import {SectionLink} from './navigation';
import {api,API_BASE} from './api.mjs';
import {CATEGORIES,CATEGORY_LABELS} from './server-model.mjs';
import './admin.css';

const messages={
 es:{title:'Administrar servidores',login:'Acceso privado',user:'Usuario',password:'Contraseña',signIn:'Entrar',signOut:'Cerrar sesión',new:'Nueva ficha',edit:'Editar ficha',name:'Nombre del servidor',category:'Modalidad',url:'Enlace a Discord o web (HTTPS)',description:'Descripción breve (opcional)',promoted:'Promoción pagada activa',published:'Visible en el directorio',save:'Guardar ficha',cancel:'Cancelar edición',list:'Tus servidores',refresh:'Actualizar lista',none:'Todavía no hay fichas.',editButton:'Editar',paid:'Promocionado',free:'Gratuito',hidden:'Oculto',saved:'Ficha guardada. El directorio ya puede mostrar los cambios.',busy:'Procesando…',public:'Ver directorio',session:'La sesión caduca en una hora y se cierra al recargar.',not_configured:'El panel todavía no está conectado.',invalid_credentials:'Usuario o contraseña incorrectos.',unauthorized:'La sesión ha caducado. Vuelve a entrar.',rate_limited:'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.',invalid_server:'Revisa el nombre, la modalidad y los campos de la ficha.',invalid_url:'Introduce un enlace HTTPS válido, sin credenciales.',conflict:'Esta ficha ha cambiado en otra sesión. Actualiza la lista y vuelve a seleccionarla antes de guardar.',server_error:'No se ha podido completar la operación. Inténtalo de nuevo.'},
 en:{title:'Manage servers',login:'Private access',user:'Username',password:'Password',signIn:'Sign in',signOut:'Sign out',new:'New listing',edit:'Edit listing',name:'Server name',category:'Game mode',url:'Discord or website link (HTTPS)',description:'Short description (optional)',promoted:'Paid promotion active',published:'Visible in the directory',save:'Save listing',cancel:'Cancel editing',list:'Your servers',refresh:'Refresh list',none:'There are no listings yet.',editButton:'Edit',paid:'Promoted',free:'Free',hidden:'Hidden',saved:'Listing saved. The directory can now show the changes.',busy:'Processing…',public:'View directory',session:'The session expires in one hour and closes when you reload.',not_configured:'The panel is not connected yet.',invalid_credentials:'Incorrect username or password.',unauthorized:'Your session has expired. Please sign in again.',rate_limited:'Too many attempts. Wait 15 minutes before trying again.',invalid_server:'Check the name, category and listing fields.',invalid_url:'Enter a valid HTTPS link without credentials.',conflict:'This listing has changed in another session. Refresh the list and select it again before saving.',server_error:'The operation could not be completed. Please try again.'},
 fr:{title:'Gérer les serveurs',login:'Accès privé',user:'Identifiant',password:'Mot de passe',signIn:'Se connecter',signOut:'Se déconnecter',new:'Nouvelle fiche',edit:'Modifier la fiche',name:'Nom du serveur',category:'Mode de jeu',url:'Lien Discord ou site web (HTTPS)',description:'Description courte (facultatif)',promoted:'Promotion payante active',published:'Visible dans l’annuaire',save:'Enregistrer la fiche',cancel:'Annuler la modification',list:'Tes serveurs',refresh:'Actualiser la liste',none:'Aucune fiche pour le moment.',editButton:'Modifier',paid:'Sponsorisé',free:'Gratuit',hidden:'Masqué',saved:'Fiche enregistrée. L’annuaire peut désormais afficher les changements.',busy:'Traitement…',public:'Voir l’annuaire',session:'La session expire dans une heure et se ferme à l’actualisation.',not_configured:'Le panneau n’est pas encore connecté.',invalid_credentials:'Identifiant ou mot de passe incorrect.',unauthorized:'La session a expiré. Reconnecte-toi.',rate_limited:'Trop de tentatives. Attends 15 minutes avant de réessayer.',invalid_server:'Vérifie le nom, la catégorie et les champs de la fiche.',invalid_url:'Saisis un lien HTTPS valide sans identifiants.',conflict:'Cette fiche a changé dans une autre session. Actualise la liste et sélectionne-la à nouveau avant d’enregistrer.',server_error:'Impossible de terminer l’opération. Réessaie.'}
};
const empty=()=>({name:'',category:'roleplay',url:'',description:'',promoted:false,published:true});
const deletionMessages={
 es:{remove:'Eliminar',confirmTitle:'Eliminar servidor',confirmText:'Se eliminará esta ficha de la web y de la base de datos. Esta acción no se puede deshacer.',confirmDelete:'Eliminar definitivamente',keep:'Cancelar',removed:'Servidor eliminado de la web y de la base de datos.'},
 en:{remove:'Delete',confirmTitle:'Delete server',confirmText:'This listing will be deleted from the website and database. This action cannot be undone.',confirmDelete:'Delete permanently',keep:'Cancel',removed:'Server deleted from the website and database.'},
 fr:{remove:'Supprimer',confirmTitle:'Supprimer le serveur',confirmText:'Cette fiche sera supprimée du site et de la base de données. Cette action est irréversible.',confirmDelete:'Supprimer définitivement',keep:'Annuler',removed:'Serveur supprimé du site et de la base de données.'}
};

export default function Admin() {
 const {language}=useLanguage(),c={...messages[language],...deletionMessages[language]};
 const [session,setSession]=useState(null),[username,setUsername]=useState(''),[password,setPassword]=useState('');
 const [servers,setServers]=useState([]),[draft,setDraft]=useState(empty),[busy,setBusy]=useState(false),[notice,setNotice]=useState(null),[refresh,setRefresh]=useState(0);
 const nameRef=useRef(null);
 const [deleteTarget,setDeleteTarget]=useState(null);
 const dialogRef=useRef(null),cancelRef=useRef(null),deleteTriggerRef=useRef(null),listTitleRef=useRef(null);
 const message=code=>c[code]||c.server_error;
 function fail(error){setNotice({error:true,text:message(error.message)});if(error.message==='unauthorized')setSession(null);}
 useEffect(()=>{
  const tag=document.createElement('meta');tag.name='robots';tag.content='noindex, nofollow';document.head.append(tag);
  return()=>tag.remove();
 },[]);
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(deleteTarget&&session){if(!dialog.open)dialog.showModal();cancelRef.current?.focus();}
  else {if(dialog?.open)dialog.close();if(!session&&deleteTarget)setDeleteTarget(null);}
 },[deleteTarget,session]);
 function cancelDeletion(){
  if(busy)return;
  setDeleteTarget(null);
  dialogRef.current?.close();
  deleteTriggerRef.current?.focus({preventScroll:true});
 }
 async function removeServer(){
  if(!deleteTarget||!session||busy)return;
  const target=deleteTarget;
  setBusy(true);setNotice(null);
  try{
   await api(`/admin/servers/${target.id}`,{method:'DELETE',body:JSON.stringify({revision:target.revision}),token:session.token});
   setServers(current=>current.filter(server=>server.id!==target.id));
   if(draft.id===target.id)setDraft(empty());
   setNotice({error:false,text:c.removed});
   setDeleteTarget(null);
   dialogRef.current?.close();
   listTitleRef.current?.focus({preventScroll:true});
   setRefresh(value=>value+1);
  }catch(error){setDeleteTarget(null);dialogRef.current?.close();deleteTriggerRef.current?.focus({preventScroll:true});fail(error);}
  finally{setBusy(false);}
 }
 useEffect(()=>{
  if(!session)return;
  const timeout=setTimeout(()=>{setSession(null);setNotice({error:true,text:c.unauthorized});},Math.max(0,session.expiresAt*1000-Date.now()));
  return()=>clearTimeout(timeout);
 },[session,language]);
 useEffect(()=>{
  if(!session)return;
  const controller=new AbortController();
  api('/admin/servers',{token:session.token,signal:controller.signal}).then(data=>setServers(data.servers)).catch(error=>{if(error.name!=='AbortError')fail(error);});
  return()=>controller.abort();
 },[session,refresh]);
 async function login(event){
  event.preventDefault();setBusy(true);setNotice(null);
  try{setSession(await api('/admin/login',{method:'POST',body:JSON.stringify({username,password})}));setDraft(empty());}
  catch(error){fail(error);}finally{setPassword('');setBusy(false);}
 }
 async function logout(){
  setBusy(true);
  try{await api('/admin/logout',{method:'POST',token:session.token});setSession(null);setServers([]);setNotice(null);setDraft(empty());}
  catch(error){fail(error);}finally{setBusy(false);}
 }
 async function save(event){
  event.preventDefault();setBusy(true);setNotice(null);
  try{
   await api(draft.id?`/admin/servers/${draft.id}`:'/admin/servers',{method:draft.id?'PUT':'POST',body:JSON.stringify(draft),token:session.token});
   setDraft(empty());setNotice({error:false,text:c.saved});setRefresh(v=>v+1);
  }catch(error){fail(error);}finally{setBusy(false);}
 }
 function field(key,value){setDraft(current=>({...current,[key]:value}));}
 function edit(server){setDraft({...server});setNotice(null);nameRef.current?.focus();nameRef.current?.scrollIntoView({block:'center',behavior:'smooth'});}
 return <main id="contenido" className="admin-page shell">
  <div className="admin-heading"><div><p className="eyebrow">NETLORE / ADMIN</p><h1>{c.title}</h1></div><SectionLink className="text-link" to="/servidores/">{c.public} ↗</SectionLink></div>
  {!API_BASE&&<p role="alert">{c.not_configured}</p>}
  {notice&&<p className={`admin-notice ${notice.error?'is-error':''}`} role={notice.error?'alert':'status'}>{notice.text}</p>}
  {!session?<form className="admin-login admin-box" onSubmit={login}><h2>{c.login}</h2><label htmlFor="admin-user">{c.user}</label><input id="admin-user" name="username" autoComplete="username" maxLength="128" required value={username} onChange={e=>setUsername(e.target.value)}/><label htmlFor="admin-password">{c.password}</label><input id="admin-password" name="password" type="password" autoComplete="current-password" maxLength="512" required value={password} onChange={e=>setPassword(e.target.value)}/><button className="button button-pink" type="submit" disabled={busy||!API_BASE}>{busy?c.busy:c.signIn}</button></form>:<>
   <div className="admin-session"><p>{c.session}</p><button type="button" className="button button-outline" onClick={logout} disabled={busy}>{c.signOut}</button></div>
   <div className="admin-layout"><form className="admin-box" onSubmit={save}><h2>{draft.id?c.edit:c.new}</h2><fieldset disabled={busy}><label htmlFor="server-name">{c.name}</label><input ref={nameRef} id="server-name" name="name" value={draft.name} maxLength="80" required onChange={e=>field('name',e.target.value)}/><label htmlFor="server-category">{c.category}</label><select id="server-category" value={draft.category} onChange={e=>field('category',e.target.value)}>{CATEGORIES.map(category=><option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}</select><label htmlFor="server-url">{c.url}</label><input id="server-url" name="url" type="url" pattern="https://.*" value={draft.url} required maxLength="2048" onChange={e=>field('url',e.target.value)}/><label htmlFor="server-description">{c.description}</label><textarea id="server-description" name="description" value={draft.description} maxLength="300" rows="3" onChange={e=>field('description',e.target.value)}/><label className="admin-checkbox"><input type="checkbox" checked={draft.promoted} onChange={e=>field('promoted',e.target.checked)}/>{c.promoted}</label><label className="admin-checkbox"><input type="checkbox" checked={draft.published} onChange={e=>field('published',e.target.checked)}/>{c.published}</label><button className="button button-pink" type="submit">{busy?c.busy:c.save}</button>{draft.id&&<button className="admin-cancel" type="button" onClick={()=>{setDraft(empty());setNotice(null);}}>{c.cancel}</button>}</fieldset></form>
    <section className="admin-box" aria-labelledby="admin-list-title"><div className="admin-list-heading"><h2 id="admin-list-title" ref={listTitleRef} tabIndex="-1">{c.list}</h2><button type="button" className="admin-cancel" onClick={()=>setRefresh(v=>v+1)} disabled={busy}>{c.refresh}</button></div>{servers.length===0?<p>{c.none}</p>:<ul className="admin-server-list">{servers.map(server=><li key={server.id}><div><h3>{server.name}</h3><p>{CATEGORY_LABELS[server.category]} · {server.promoted?c.paid:c.free}{!server.published?` · ${c.hidden}`:''}</p></div><div className="admin-row-actions"><button type="button" className="button button-outline" disabled={busy} onClick={()=>edit(server)} aria-label={`${c.editButton}: ${server.name}`}>{c.editButton}</button><button type="button" className="button admin-delete" disabled={busy} onClick={event=>{deleteTriggerRef.current=event.currentTarget;setDeleteTarget(server);}} aria-label={`${c.remove}: ${server.name}`}>{c.remove}</button></div></li>)}</ul>}</section>
   </div>
  </>}
  <dialog ref={dialogRef} className="admin-delete-dialog" aria-labelledby="delete-title" aria-describedby="delete-description" onCancel={event=>{event.preventDefault();cancelDeletion();}}>
   <h2 id="delete-title">{c.confirmTitle}</h2><p className="admin-delete-name">{deleteTarget?.name}</p><p id="delete-description">{c.confirmText}</p><div className="admin-dialog-actions"><button ref={cancelRef} type="button" className="button button-outline" disabled={busy} onClick={cancelDeletion}>{c.keep}</button><button type="button" className="button admin-delete" disabled={busy||!session} onClick={removeServer}>{busy?c.busy:c.confirmDelete}</button></div>
  </dialog>
 </main>;
}
