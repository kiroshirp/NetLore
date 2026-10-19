export function paginate(items,requested=1,size=12){
 const pages=Math.max(1,Math.ceil(items.length/size));
 const number=Number(requested);
 const page=Math.min(pages,Math.max(1,Number.isSafeInteger(number)?number:1));
 return {page,pages,total:items.length,start:items.length?(page-1)*size+1:0,end:Math.min(page*size,items.length),items:items.slice((page-1)*size,page*size)};
}
