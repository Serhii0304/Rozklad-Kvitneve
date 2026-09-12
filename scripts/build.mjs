import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const root=process.cwd(),out=path.join(root,'build');
const files=['index.html','class.html','Розклад дзвінків.html','site.css','enhancements.css','highlights.css','responsive.css','ukraine.css','print.css','print-layout.mjs','theme-init.js','effects.mjs','schedule-view.mjs','subject-icons.mjs','app.mjs','lesson-content.mjs','table-navigation.mjs','kvitneve.css','schedule-config.js','time-core.mjs','kyiv-clock.mjs','minute-of-silence.mjs','school-bell.mjs','favicon.svg','school-background-2026.png','THIRD_PARTY_NOTICES.md','Хвилина мовчання.mp3','Звук шкільного дзвінка.mp3'];
files.push(...fs.readdirSync('assets/subjects').filter(x=>x.endsWith('.svg')).map(x=>'assets/subjects/'+x),'assets/ui/school-building.png','assets/ui/school-bell-refined.png','assets/ui/ukraine-coat-of-arms.svg');
for(const name of files){if(!fs.existsSync(name))throw new Error('Missing '+name);if(/\.(mjs|js)$/.test(name))execFileSync(process.execPath,['--check',name]);}
const html=fs.readFileSync('index.html','utf8');for(const [,ref]of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(/^(?:https?:|#|\.\/)/.test(ref))continue;if(!fs.existsSync(ref))throw new Error('Broken reference '+ref);}
for(const name of files.filter(x=>x.endsWith('.mjs'))){for(const [,ref]of fs.readFileSync(name,'utf8').matchAll(/from ['"](\.\/[^'"]+)['"]/g))if(!fs.existsSync(path.resolve(root,ref)))throw new Error('Missing import '+ref);}
fs.mkdirSync(out,{recursive:true});for(const name of files){fs.mkdirSync(path.dirname(path.join(out,name)),{recursive:true});fs.copyFileSync(path.join(root,name),path.join(out,name));}
console.log('Static site built: '+files.length+' public files.');
