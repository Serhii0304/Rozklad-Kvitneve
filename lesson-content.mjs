import {subjectIconMarkup} from './subject-icons.mjs';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function subjectsInLesson(value){
  return String(value||'').split(/\s*\/\s*/).map(part=>part.replace(/\s*\(\d+\s+підгрупа\)/g,'').trim()).filter(Boolean);
}
export function subjectCellMarkup(config,value,extraClass=''){
  if(!value)return '<span class="empty" aria-label="Уроку немає">—</span>';
  const parts=String(value).split(/\s*\/\s*/).filter(Boolean);
  return '<div class="lesson-subjects'+(parts.length>1?' has-groups':'')+'">'+parts.map(part=>{
    const name=subjectsInLesson(part)[0],qualifier=part.match(/\(\d+\s+підгрупа\)/g)?.join(' ')||'';
    return '<button type="button" class="subject '+esc(extraClass)+'" data-subject="'+esc(name)+'" title="Виділити предмет: '+esc(name)+'">'+subjectIconMarkup(config,name)+'<span class="subject-copy"><span class="subject-name">'+esc(name)+'</span>'+(qualifier?'<small class="subgroup">'+esc(qualifier)+'</small>':'')+'</span></button>';
  }).join('<span class="subject-divider" aria-hidden="true">/</span>')+'</div>';
}
