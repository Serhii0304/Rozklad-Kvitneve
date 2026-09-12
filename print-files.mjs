import {posterForClass} from './print-posters.mjs';
import {weekPosterForDay,wholeWeekPdfPath} from './week-posters.mjs';

export function pdfForPrintRequest(config,{section='schedule',grade='all',view='week',day=0,printDay=null}={}){
  if(section==='bells')return null;
  if(printDay!==null)return weekPosterForDay(config,printDay)?.pdfPath||null;
  if(view==='week')return grade==='all'?wholeWeekPdfPath:posterForClass(config,grade)?.pdfPath||null;
  return grade==='all'?weekPosterForDay(config,day)?.pdfPath||null:null;
}

export function openPrintPdf(path){
  // A same-origin download also works in embedded browsers without PDF popups.
  // Printing the file never adds the HTML page's URL/date/title; audio stays open.
  const link=document.createElement('a');
  link.href=path;
  link.download=path.split('/').at(-1);
  document.body.append(link);
  link.click();
  link.remove();
}
