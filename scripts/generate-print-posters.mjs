import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {subjectsInLesson} from '../lesson-content.mjs';
import {createPosterOverlay,posterLessonEntries,posterSize} from './print-poster-layout.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha256=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const sourceHash=buffer=>sha256(buffer.toString('utf8').replace(/\r\n/g,'\n'));
const resolve=relative=>path.join(root,relative);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sharp;
try{sharp=(await import('sharp')).default;}
catch(error){
  if(!process.env.CODEX_NODE_MODULES)throw new Error('Install sharp, or set CODEX_NODE_MODULES to the bundled node_modules directory.',{cause:error});
  const require=createRequire(pathToFileURL(path.join(process.env.CODEX_NODE_MODULES,'package.json')));
  sharp=require('sharp');
}
const args=process.argv.slice(2);
let requestedGrade=null;
if(args.length){
  if(args.length!==2||args[0]!=='--grade'||!/^([5-9]|1[01])$/.test(args[1]))throw new Error('Usage: node scripts/generate-print-posters.mjs [--grade 5..11]');
  requestedGrade=Number(args[1]);
}
const configText=await fs.readFile(resolve('schedule-config.js'),'utf8');
const context={window:{}};
vm.runInNewContext(configText,context,{timeout:1000,filename:'schedule-config.js'});
const config=JSON.parse(JSON.stringify(context.window.SchoolScheduleConfig));
if(config.classes.length!==7||config.dayOrder.length!==5||config.bellSchedule.length!==7||config.scheduleRows.length!==35)throw new Error('Expected seven classes, five days, seven bells, and exactly 35 canonical rows.');
const rowKeys=new Set();
for(const row of config.scheduleRows){
  const key=`${row.day}/${row.lesson}`;
  if(rowKeys.has(key))throw new Error(`Duplicate schedule row: ${key}`);
  if(!config.dayOrder.some(day=>day.label===row.day)||!config.bellSchedule.some(bell=>bell.lesson===row.lesson)||row.classes.length!==7)throw new Error(`Malformed canonical schedule row: ${key}`);
  rowKeys.add(key);
}
const {printSubjectIcons}=await import(pathToFileURL(resolve('print-subject-icons.mjs')));
const usedSubjects=[...new Set(config.scheduleRows.flatMap(row=>row.classes.flatMap(subjectsInLesson)))].sort();
const iconData={};
const iconHashes={};
for(const subject of usedSubjects){
  const asset=printSubjectIcons[subject];
  if(typeof asset!=='string'||!/^assets\/print-subjects\/[a-z][a-z0-9-]*\.svg$/.test(asset))throw new Error(`Missing or invalid printSubjectIcons mapping for ${subject}`);
  const bytes=await fs.readFile(resolve(asset));
  iconData[subject]=`data:image/svg+xml;base64,${bytes.toString('base64')}`;
  iconHashes[asset]=sourceHash(bytes);
}
const configSha256=sha256(JSON.stringify(config));
const sourceFiles={};
for(const source of ['lesson-content.mjs','print-subject-icons.mjs','scripts/generate-print-posters.mjs','scripts/print-poster-layout.mjs'])sourceFiles[source]=sourceHash(await fs.readFile(resolve(source)));
const rendererSha256=sha256(JSON.stringify(sourceFiles));
const outputDirectory=resolve('assets/print');
await fs.mkdir(outputDirectory,{recursive:true});
const previous=await fs.readFile(path.join(outputDirectory,'manifest.json'),'utf8').then(JSON.parse).catch(()=>null);
const partialCompatible=previous?.configSha256===configSha256&&previous?.rendererSha256===rendererSha256&&JSON.stringify(previous?.iconSha256)===JSON.stringify(iconHashes);
const posters=requestedGrade&&partialCompatible?previous.posters.filter(poster=>poster.grade!==requestedGrade):[];
const measureCache=new Map();
async function measure(value,size){
  const key=`${size}:${value}`;
  if(!measureCache.has(key)){
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="180"><text x="12" y="110" font-family="Segoe UI,sans-serif" font-weight="600" font-size="${size}">${esc(value)}</text></svg>`;
    const measured=await sharp(Buffer.from(svg)).trim({threshold:0}).png().toBuffer({resolveWithObject:true});
    measureCache.set(key,measured.info.width+5);
  }
  return measureCache.get(key);
}
console.log(`Print renderer: sharp ${sharp.versions.sharp}; ${posterSize.width}×${posterSize.height}px / ${posterSize.dpi}dpi`);
for(let classIndex=0;classIndex<config.classes.length;classIndex++){
  const className=config.classes[classIndex];
  const grade=Number(className.match(/\d+/)?.[0]);
  if(requestedGrade&&requestedGrade!==grade)continue;
  const cells=[];
  for(const day of config.dayOrder)for(const bell of config.bellSchedule){
    const row=config.scheduleRows.find(row=>row.day===day.label&&row.lesson===bell.lesson);
    if(!row)throw new Error(`Canonical row missing: ${day.label} / ${bell.lesson}`);
    const value=row.classes[classIndex];
    cells.push({day:day.label,dayId:day.id,lesson:bell.lesson,start:bell.start,end:bell.end,value,entries:posterLessonEntries(value,subjectsInLesson)});
  }
  const backgroundPath=`assets/print-backgrounds/class-${grade}.png`;
  const background=await fs.readFile(resolve(backgroundPath)).catch(error=>{throw new Error(`Generate the class ${grade} artwork first: ${backgroundPath}`,{cause:error});});
  const {svg,layout,palette}=await createPosterOverlay({config,classIndex,cells,iconData,measure});
  const imagePath=`assets/print/class-${grade}-week.png`;
  const previewPath=`assets/print/class-${grade}-preview.webp`;
  const output=await sharp(background).resize(posterSize.width,posterSize.height,{fit:'cover',position:'centre'}).composite([{input:Buffer.from(svg)}]).withMetadata({density:posterSize.dpi}).png({compressionLevel:9,palette:false}).toBuffer();
  const metadata=await sharp(output).metadata();
  if(metadata.width!==posterSize.width||metadata.height!==posterSize.height||metadata.density!==posterSize.dpi)throw new Error(`Invalid print dimensions or density for ${className}`);
  await fs.writeFile(resolve(imagePath),output);
  const preview=await sharp(output).resize({width:1400}).webp({quality:90,effort:6}).toBuffer();
  await fs.writeFile(resolve(previewPath),preview);
  posters.push({grade,className,path:imagePath,previewPath,width:metadata.width,height:metadata.height,dpi:metadata.density,sha256:sha256(output),previewSha256:sha256(preview),backgroundPath,backgroundSha256:sha256(background),cellCount:cells.length,filledCount:cells.filter(cell=>cell.value.trim()).length,subjectEntryCount:cells.reduce((count,cell)=>count+cell.entries.length,0),minimumSubjectFontPx:Math.min(...layout.filter(cell=>cell.fontSize).map(cell=>cell.fontSize)),accent:palette.accent,cells});
  console.log(`${className}: ${cells.length} cells, ${cells.filter(cell=>cell.value.trim()).length} filled; ${(output.length/1024/1024).toFixed(2)} MiB → ${imagePath}`);
}
posters.sort((a,b)=>a.grade-b.grade);
const manifest={schemaVersion:1,format:'A4 landscape',...posterSize,configHashMethod:'sha256(JSON.stringify(parsed SchoolScheduleConfig))',configSha256,sourceHashMethod:'sha256 UTF-8 with LF line endings',rendererSha256,sourceFiles,iconSha256:iconHashes,renderer:{sharp:sharp.versions.sharp,fontFamily:'Segoe UI',minimumSubjectFontPx:42},complete:posters.length===7,posters};
await fs.writeFile(path.join(outputDirectory,'manifest.json'),`${JSON.stringify(manifest,null,2)}\n`,'utf8');
console.log(`Manifest saved (${posters.length}/7 posters).${manifest.complete?'':' Run without --grade to generate all seven.'}`);
