export function printPagesMarkup(pages){
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return pages.map((page,i)=>'<section class="print-page"><div class="print-sheet"><header class="print-heading"><div><p class="print-school">Квітневий ліцей</p><h1>'+esc(page.title)+'</h1><p class="print-term">І семестр · 2026–2027 навчальний рік</p></div><img src="assets/ui/'+(page.bells?'school-bell-refined.png':'school-building.png')+'" alt="" width="90" height="90"></header>'+page.content+'<div class="print-footer"><span>Квітневе · Розклад уроків і дзвінків</span><span>'+String(i+1)+' / '+String(pages.length)+'</span></div></div></section>').join('');
}
export function fitPrintPages(stage){
 stage.classList.add('print-measure');
 stage.querySelectorAll('.print-page').forEach(page=>{
  const sheet=page.querySelector('.print-sheet');sheet.style.setProperty('--print-scale','1');
  const scale=Math.min(1,(page.clientHeight-2)/Math.max(1,sheet.scrollHeight));
  sheet.style.setProperty('--print-scale',String(scale));
 });
 stage.classList.remove('print-measure');
}
export async function settlePrintAssets(stage){
 if(document.fonts)await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1800))]);
 await Promise.all([...stage.querySelectorAll('img')].map(img=>img.decode?.().catch(()=>{})));
}
