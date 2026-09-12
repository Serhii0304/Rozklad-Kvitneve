import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {pdfForPrintRequest,openPrintPdf} from '../print-files.mjs';
const box={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../schedule-config.js',import.meta.url),'utf8'),box);
const C=box.window.SchoolScheduleConfig;

test('Each class prints its own image-only PDF',()=>{
 for(const label of C.classes){const grade=label.split(' ')[0];assert.equal(pdfForPrintRequest(C,{grade,view:'week'}),`assets/print/class-${grade}-week.pdf`);}
});
test('The homepage week and individual days resolve to the correct PDF pages',()=>{
 assert.equal(pdfForPrintRequest(C),'assets/print-week/week-all-classes.pdf');
 C.dayOrder.forEach((day,index)=>{
  assert.equal(pdfForPrintRequest(C,{view:'day',day:index}),`assets/print-week/${day.id}.pdf`);
  assert.equal(pdfForPrintRequest(C,{printDay:index}),`assets/print-week/${day.id}.pdf`);
 });
});
test('Bell and single-class day tables keep their ordinary print route',()=>{
 assert.equal(pdfForPrintRequest(C,{section:'bells'}),null);
 assert.equal(pdfForPrintRequest(C,{grade:'6',view:'day'}),null);
});

test('PDF opens in the current tab if an embedded browser blocks popups',()=>{
 const previous=globalThis.window,calls=[];
 try{globalThis.window={open:()=>null,location:{assign:path=>calls.push(path)}};openPrintPdf('assets/print-week/monday.pdf');assert.deepEqual(calls,['assets/print-week/monday.pdf']);}
 finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});

test('An available PDF tab is isolated without interrupting the original page',()=>{
 const previous=globalThis.window,opened={opener:'parent'},calls=[];
 try{globalThis.window={open:()=>opened,location:{assign:path=>calls.push(path)}};openPrintPdf('assets/print/class-10-week.pdf');assert.equal(opened.opener,null);assert.deepEqual(calls,[]);}
 finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});
