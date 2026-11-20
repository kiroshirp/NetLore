import {useLanguage} from './i18n';
import './pagination.css';
const copy={es:{label:'Páginas de resultados',previous:'Anterior',next:'Siguiente',page:'Página',of:'de',to:'a'},en:{label:'Result pages',previous:'Previous',next:'Next',page:'Page',of:'of',to:'to'},fr:{label:'Pages de résultats',previous:'Précédente',next:'Suivante',page:'Page',of:'sur',to:'à'}};
export default function Pagination({result,onChange,disabled=false}){
 const {language}=useLanguage(),c=copy[language];
 if(result.pages<=1)return null;
 return <nav className="results-pagination" aria-label={c.label}>
  <span role="status">{result.start} {c.to} {result.end} {c.of} {result.total}</span>
  <div><button type="button" disabled={disabled||result.page===1} onClick={()=>onChange(result.page-1)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>{c.previous}</button><span>{c.page} {result.page} {c.of} {result.pages}</span><button type="button" disabled={disabled||result.page===result.pages} onClick={()=>onChange(result.page+1)}>{c.next}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></div>
 </nav>;
}
