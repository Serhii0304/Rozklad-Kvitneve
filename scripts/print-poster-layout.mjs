/** A4 landscape typesetting. All geometry is in 300-dpi pixels. */
export const posterSize = Object.freeze({width:3508,height:2480,dpi:300});
export const posterPalettes = Object.freeze({
  5:{accent:'#185f99',dark:'#163955',pale:'#e9f3fa',rule:'#b8d0e2'},
  6:{accent:'#247854',dark:'#214d3b',pale:'#eaf5ed',rule:'#b9d6c5'},
  7:{accent:'#7450a0',dark:'#46305e',pale:'#f1ecf8',rule:'#d0c2e0'},
  8:{accent:'#a56820',dark:'#604425',pale:'#fcf3e3',rule:'#dfccaa'},
  9:{accent:'#ab526b',dark:'#583b4a',pale:'#fbeef1',rule:'#e1c1ca'},
  10:{accent:'#087b93',dark:'#20505f',pale:'#e8f6f8',rule:'#afd1d9'},
  11:{accent:'#425590',dark:'#2b3559',pale:'#edf0f8',rule:'#c1cae0'},
});

const escapeXml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=n=>Math.round(n*100)/100;
const text=(x,y,value,size,fill,extra='')=>`<text x="${f(x)}" y="${f(y)}" font-size="${size}" fill="${fill}" ${extra}>${escapeXml(value)}</text>`;

/** Mirror lesson-content's subject grouping while retaining every subgroup qualifier. */
export function posterLessonEntries(value,subjectsInLesson){
  const entries=subjectsInLesson(value).map(name=>({name,groups:[]}));
  const key=name=>name.normalize('NFC').replace(/[’ʼ]/g,"'").toLocaleLowerCase('uk');
  for(const part of String(value||'').split(/\s*\/\s*/)){
    const name=part.replace(/\s*\(\d+\s+підгрупа\)/g,'').replace(/\s+/g,' ').trim();
    const target=entries.find(entry=>key(entry.name)===key(name));
    if(!target)continue;
    for(const qualifier of part.match(/\(\d+\s+підгрупа\)/g)||[]){
      if(!target.groups.includes(qualifier))target.groups.push(qualifier);
    }
  }
  return entries;
}

export async function createPosterOverlay({config,classIndex,cells,iconData,measure}){
  const grade=Number(config.classes[classIndex].match(/\d+/)?.[0]);
  const palette=posterPalettes[grade];
  if(!palette)throw new Error(`No print palette for class ${config.classes[classIndex]}`);
  const p=palette;
  const grid={x:190,y:520,width:3128,header:112,time:218,row:230};
  const dayWidth=(grid.width-grid.time)/config.dayOrder.length;
  const bottom=grid.y+grid.header+grid.row*config.bellSchedule.length;
  const elements=[];
  elements.push(`<svg xmlns="http://www.w3.org/2000/svg" width="3508" height="2480" viewBox="0 0 3508 2480"><style>text{font-family:'Segoe UI',sans-serif;font-weight:600;letter-spacing:0}</style>`);
  // The reading surface is almost opaque; original art remains at the paper's edges.
  elements.push(`<rect x="132" y="158" width="3244" height="2170" rx="42" fill="#fffefa" fill-opacity="0.965" stroke="${p.rule}" stroke-opacity="0.62" stroke-width="3"/>`);
  elements.push(`<path d="M212 223h104" stroke="${p.accent}" stroke-width="8" stroke-linecap="round"/>`);
  elements.push(text(343,237,config.school.name.toLocaleUpperCase('uk'),43,p.accent,'letter-spacing="4"'));
  elements.push(text(208,366,'РОЗКЛАД УРОКІВ',103,p.dark,'font-weight="700"'));
  elements.push(text(214,436,config.school.semesterLabel,43,p.dark,'font-weight="400"'));
  elements.push(`<rect x="2812" y="214" width="438" height="238" rx="34" fill="${p.pale}" stroke="${p.rule}" stroke-width="2"/>`);
  elements.push(text(3031,332,String(grade),126,p.accent,'font-weight="700" text-anchor="middle"'));
  elements.push(text(3031,404,'клас',57,p.dark,'text-anchor="middle"'));
  // Header caps are one rectangle, so weekday centres exactly match the columns below.
  elements.push(`<rect x="${grid.x}" y="${grid.y}" width="${grid.width}" height="${bottom-grid.y}" rx="24" fill="#ffffff" stroke="${p.rule}" stroke-width="3"/>`);
  elements.push(`<path d="M${grid.x+24} ${grid.y}H${grid.x+grid.width-24}Q${grid.x+grid.width} ${grid.y} ${grid.x+grid.width} ${grid.y+24}V${grid.y+grid.header}H${grid.x}V${grid.y+24}Q${grid.x} ${grid.y} ${grid.x+24} ${grid.y}Z" fill="${p.accent}"/>`);
  elements.push(text(grid.x+grid.time/2,grid.y+69,'Урок / час',37,'#ffffff','text-anchor="middle"'));
  config.dayOrder.forEach((day,index)=>elements.push(text(grid.x+grid.time+dayWidth*(index+.5),grid.y+74,day.label,53,'#ffffff','font-weight="700" text-anchor="middle"')));
  for(let r=0;r<config.bellSchedule.length;r++){
    const y=grid.y+grid.header+r*grid.row;
    if(r%2===1)elements.push(`<rect x="${grid.x+2}" y="${y}" width="${grid.width-4}" height="${grid.row}" fill="${p.pale}" fill-opacity="0.36"/>`);
    elements.push(`<rect x="${grid.x+2}" y="${y}" width="${grid.time-2}" height="${grid.row-1}" fill="${p.pale}" fill-opacity="0.85"/>`);
    const bell=config.bellSchedule[r];
    elements.push(text(grid.x+grid.time/2,y+83,String(bell.lesson),59,p.accent,'font-weight="700" text-anchor="middle"'));
    elements.push(text(grid.x+grid.time/2,y+141,bell.start,42,p.dark,'text-anchor="middle"'));
    elements.push(text(grid.x+grid.time/2,y+186,bell.end,42,p.dark,'font-weight="400" text-anchor="middle"'));
    if(r>0)elements.push(`<path d="M${grid.x} ${y}H${grid.x+grid.width}" stroke="${p.rule}" stroke-width="2"/>`);
  }
  for(let d=0;d<config.dayOrder.length;d++){
    const x=grid.x+grid.time+dayWidth*d;
    elements.push(`<path d="M${f(x)} ${grid.y+grid.header}V${bottom}" stroke="${p.rule}" stroke-width="2"/>`);
    if(d>0)elements.push(`<path d="M${f(x)} ${grid.y+24}V${grid.y+grid.header-24}" stroke="#ffffff" stroke-opacity="0.26" stroke-width="2"/>`);
  }
  const wrap=async(value,size,width)=>{
    const lines=[];
    for(const word of value.split(/\s+/)){
      if(await measure(word,size)>width)throw new Error(`Unbreakable print word: ${word}`);
      const line=lines.length?lines[lines.length-1]:'';
      if(line&&await measure(`${line} ${word}`,size)>width)lines.push(word);
      else if(lines.length)lines[lines.length-1]=line?`${line} ${word}`:word;
      else lines.push(word);
    }
    return lines;
  };
  const layout=[];
  for(const cell of cells){
    const d=config.dayOrder.findIndex(day=>day.label===cell.day);
    const r=config.bellSchedule.findIndex(bell=>bell.lesson===cell.lesson);
    const x=grid.x+grid.time+dayWidth*d;
    const y=grid.y+grid.header+grid.row*r;
    if(!cell.entries.length){
      elements.push(text(x+dayWidth/2,y+grid.row/2+15,'—',49,'#a4afbc','font-weight="400" text-anchor="middle"'));
      layout.push({...cell,lineCount:0,fontSize:null});
      continue;
    }
    const multi=cell.entries.length>1;
    const fontSize=multi?42:46;
    const lineHeight=multi?50:56;
    const iconSize=multi?86:108;
    const iconX=x+20;
    const textX=x+(multi?119:140);
    const textWidth=dayWidth-(textX-x)-22;
    const shaped=[];
    for(const entry of cell.entries){
      if(!iconData[entry.name])throw new Error(`Missing dedicated print icon: ${entry.name}`);
      const lines=await wrap(entry.name,fontSize,textWidth);
      const groupLines=entry.groups.length?await wrap(entry.groups.join(' · '),42,textWidth):[];
      const textHeight=lines.length*lineHeight+groupLines.length*46;
      shaped.push({...entry,lines,groupLines,height:Math.max(iconSize,textHeight)});
    }
    const gap=multi?16:0;
    const totalHeight=shaped.reduce((sum,entry)=>sum+entry.height,0)+(shaped.length-1)*gap;
    if(totalHeight>grid.row-22)throw new Error(`Print overflow (${totalHeight}px) in ${config.classes[classIndex]} / ${cell.day} / ${cell.lesson}: ${cell.value}`);
    let top=y+(grid.row-totalHeight)/2;
    for(let e=0;e<shaped.length;e++){
      const entry=shaped[e];
      const iconTop=top+(entry.height-iconSize)/2;
      elements.push(`<image x="${f(iconX)}" y="${f(iconTop)}" width="${iconSize}" height="${iconSize}" href="${iconData[entry.name]}"/>`);
      const textHeight=entry.lines.length*lineHeight+entry.groupLines.length*46;
      let baseline=top+(entry.height-textHeight)/2+fontSize;
      for(const line of entry.lines){elements.push(text(textX,baseline,line,fontSize,'#213849'));baseline+=lineHeight;}
      for(const group of entry.groupLines){elements.push(text(textX,baseline-3,group,42,p.accent,'font-weight="400"'));baseline+=46;}
      top+=entry.height;
      if(e<shaped.length-1){
        elements.push(`<path d="M${f(textX)} ${f(top+gap/2)}H${f(x+dayWidth-26)}" stroke="${p.rule}" stroke-width="1.5"/>`);
        top+=gap;
      }
    }
    layout.push({...cell,fontSize,lineCount:shaped.reduce((n,entry)=>n+entry.lines.length+entry.groupLines.length,0),contentHeight:totalHeight});
  }
  elements.push(text(212,2288,'Квітневий ліцей',34,p.accent,'font-weight="400"'));
  elements.push(text(3296,2288,'—  уроку немає',34,'#61747f','font-weight="400" text-anchor="end"'));
  elements.push('</svg>');
  return {svg:elements.join(''),layout,palette:p,grid};
}
