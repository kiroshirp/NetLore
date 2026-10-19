import {useLanguage} from './i18n';
import './pagination.css';
const copy={es:{label:'Páginas de resultados',previous:'Anterior',next:'Siguiente',page:'Página',of:'de'},en:{label:'Result pages',previous:'Previous',next:'Next',page:'Page',of:'of'},fr:{label:'Pages de résultats',previous:'Précédente',next:'Suivante',page:'Page',of:'sur'}};
export default function Pagination({result,onChange,disabled=false}){
 const {language}=useLanguage(),c=copy[language];
 if(result.pages<=1)return null;
 return <nav className="results-pagination" aria-label={c.label}>
  <span role="status">{result.start}–{result.end} {c.of} {result.total}</span>
  <div><button type="button" disabled={disabled||result.page===1} onClick={()=>onChange(result.page-1)}>← {c.previous}</button><span>{c.page} {result.page} {c.of} {result.pages}</span><button type="button" disabled={disabled||result.page===result.pages} onClick={()=>onChange(result.page+1)}>{c.next} →</button></div>
 </nav>;
}
