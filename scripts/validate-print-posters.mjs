import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {printSubjectIcons} from '../print-subject-icons.mjs';
import {subjectsInLesson} from '../lesson-content.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const textHash=value=>hash(value.toString('utf8').replace(/\r\n?/g,'\n'));
const box={window:{}};
vm.runInNewContext(read('schedule-config.js').toString('utf8'),box,{timeout:1000});
const config=JSON.parse(JSON.stringify(box.window.SchoolScheduleConfig));
const manifest=JSON.parse(read('assets/print/manifest.json'));
assert.equal(manifest.configSha256,hash(JSON.stringify(config)),'Poster data are stale. Run npm run generate:posters.');
assert.equal(manifest.complete,true,'Generate all seven class posters.');
assert.equal(manifest.posters.length,config.classes.length);
assert.deepEqual([manifest.width,manifest.height,manifest.dpi],[3508,2480,300]);
const used=[...new Set(config.scheduleRows.flatMap(row=>row.classes.flatMap(subjectsInLesson)))];
assert.equal(new Set(used.map(name=>printSubjectIcons[name])).size,used.length,'Every subject must use a unique icon.');
const iconHashes=[];
for(const name of used){
 const asset=printSubjectIcons[name];
 assert.match(asset,/^assets\/print-subjects\/[a-z][a-z0-9-]*\.svg$/);
 const bytes=read(asset),digest=textHash(bytes);
 assert.equal(manifest.iconSha256[asset],digest,'Changed print icon: regenerate the posters.');
 iconHashes.push(digest);
}
assert.equal(new Set(iconHashes).size,used.length,'Distinct subjects cannot reuse the same artwork.');
for(const [name,digest] of Object.entries(manifest.sourceFiles))assert.equal(textHash(read(name)),digest,'Changed poster renderer: '+name+'. Regenerate the posters.');
const grades=new Set();
for(const poster of manifest.posters){
 const index=config.classes.indexOf(poster.className);
 assert.ok(index>=0,'Unknown class in poster manifest');
 assert.equal(poster.grade,Number(config.classes[index].match(/\d+/)[0]));
 assert.ok(!grades.has(poster.grade),'Repeated class in poster manifest');grades.add(poster.grade);
 assert.equal(poster.path,'assets/print/class-'+poster.grade+'-week.png');
 assert.equal(poster.previewPath,'assets/print/class-'+poster.grade+'-preview.webp');
 const png=read(poster.path),preview=read(poster.previewPath);
 assert.equal(png.subarray(1,4).toString(),'PNG');
 assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[3508,2480]);
 assert.equal(hash(png),poster.sha256,'PNG differs from the verified render');
 assert.equal(hash(preview),poster.previewSha256,'Preview differs from the verified render');
 assert.equal(hash(read(poster.backgroundPath)),poster.backgroundSha256,'Changed background: regenerate the posters');
 assert.deepEqual([poster.width,poster.height,poster.dpi],[3508,2480,300]);
 assert.equal(poster.cellCount,35);assert.equal(poster.cells.length,35);
 const seen=new Set();
 for(const cell of poster.cells){
  const day=config.dayOrder.find(item=>item.id===cell.dayId);
  assert.equal(cell.day,day?.label);
  const key=cell.dayId+'/'+cell.lesson;assert.ok(!seen.has(key));seen.add(key);
  const bell=config.bellSchedule.find(item=>item.lesson===cell.lesson);
  assert.deepEqual([cell.start,cell.end],[bell?.start,bell?.end]);
  const row=config.scheduleRows.find(item=>item.day===cell.day&&item.lesson===cell.lesson);
  assert.equal(cell.value,row?.classes[index],'Wrong subject at '+poster.className+' / '+key);
  assert.deepEqual(cell.entries.map(entry=>entry.name),subjectsInLesson(cell.value));
 }
 assert.equal(poster.filledCount,config.scheduleRows.filter(row=>row.classes[index]).length);
}
console.log('Verified 7 class PNGs: 245 timetable cells, 300 dpi, 24 distinct subject icons.');
