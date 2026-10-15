// Public endpoint only. Authentication secrets are never exposed to Vite.
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://netlore-api.kiroshirp.workers.dev').replace(/\/$/,'');
export async function api(path,{token,signal,...options}={}) {
 if(!API_BASE)throw new Error('not_configured');
 const response=await fetch(API_BASE+path,{...options,signal,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},cache:'no-store',credentials:'omit'});
 const data=await response.json();
 if(!response.ok)throw new Error(data.error||'server_error');
 return data;
}
