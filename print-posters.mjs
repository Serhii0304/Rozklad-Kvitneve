import {classIndex,classGrade} from './time-core.mjs';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function posterForClass(config,grade){
  const index=classIndex(config,grade);
  if(index<0)return null;
  const id=classGrade(config,index);
  if(!/^(?:[5-9]|10|11)$/.test(id))return null;
  return {grade:id,label:config.classes[index],imagePath:'assets/print/class-'+id+'-week.png',previewPath:'assets/print/class-'+id+'-preview.webp',pagePath:'print.html?class='+encodeURIComponent(id),downloadName:'Квітневий ліцей — '+config.classes[index]+' — розклад 2026-2027.png'};
}

export function posterPrintMarkup(poster){
  return '<section class="print-page poster-print-page"><div class="print-sheet poster-print-sheet"><img class="class-print-poster" src="'+escapeHtml(poster.imagePath)+'" alt="'+escapeHtml(poster.label)+' — тижневий розклад уроків Квітневого ліцею, І семестр 2026–2027"></div></section>';
}
