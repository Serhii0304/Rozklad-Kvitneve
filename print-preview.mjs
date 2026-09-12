import {posterForClass} from './print-posters.mjs';
const C=window.SchoolScheduleConfig;
const $=selector=>document.querySelector(selector);
const requested=new URLSearchParams(location.search).get('class');
const poster=posterForClass(C,requested)||posterForClass(C,C.classes[0]);
document.title=poster.label+' · Розклад для друку · Квітневий ліцей';
$('#poster-title').textContent=poster.label+' · Розклад для друку';
$('#poster-caption').textContent=poster.label+' · Квітневий ліцей · І семестр 2026–2027';
$('#schedule-link').href='class.html?class='+encodeURIComponent(poster.label)+'&view=week#schedule';
for(const label of C.classes){
  const item=posterForClass(C,label);
  if(!item)continue;
  const link=document.createElement('a');
  link.href=item.pagePath;link.textContent=item.label;
  if(item.grade===poster.grade)link.setAttribute('aria-current','page');
  $('#poster-classes').append(link);
}
$('#download-poster').href=poster.imagePath;
$('#download-poster').download=poster.downloadName;
$('#poster-preview').alt=poster.label+' — повний тижневий розклад з уроками, підгрупами й дзвінками';
$('#poster-preview').src=poster.previewPath;
const original=$('#poster-original');
original.alt=$('#poster-preview').alt;
original.addEventListener('load',()=>{ $('#print-poster').disabled=false;$('#poster-status').textContent='Зображення готове до друку';$('#poster-resolution').textContent=original.naturalWidth+' × '+original.naturalHeight+' px'; });
original.addEventListener('error',()=>{ $('#poster-status').textContent='Не вдалося завантажити зображення. Оновіть сторінку.'; });
original.src=poster.imagePath;
$('#print-poster').addEventListener('click',()=>window.print());
