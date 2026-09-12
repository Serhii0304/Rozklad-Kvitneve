import {posterForClass} from './print-posters.mjs';
import {weekPosterForDay,wholeWeekPdfPath} from './week-posters.mjs';

export function pdfForPrintRequest(config,{section='schedule',grade='all',view='week',day=0,printDay=null}={}){
  if(section==='bells')return null;
  if(printDay!==null)return weekPosterForDay(config,printDay)?.pdfPath||null;
  if(view==='week')return grade==='all'?wholeWeekPdfPath:posterForClass(config,grade)?.pdfPath||null;
  return grade==='all'?weekPosterForDay(config,day)?.pdfPath||null:null;
}

export function openPrintPdf(path){
  // Native PDF printing has no HTML URL/date/page-title headers or footers.
  window.open(path,'_blank','noopener');
}
