import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {pdfForPrintRequest} from '../print-files.mjs';
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
