// Loads the legacy single-file site and dumps fully-resolved, normalized data.
const {chromium}=require('playwright');
const fs=require('fs');
// Usage: node scripts/extract-legacy.cjs <legacy index.html> <output dir>
const SRC=require('path').resolve(process.argv[2]);
const OUT=process.argv[3];
(async()=>{
const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+SRC);await p.waitForTimeout(500);
const data=await p.evaluate(()=>{
  const slugOf=i=>photoFiles13[i].replace(/^\d+-/,'').replace(/\.jpg$/,'');
  const SPECIAL={2:'Princeton: SAT/ACT необязателен для поступления осенью 2027; для осени 2028 тест снова обязателен. Письменная школьная работа с оценкой обязательна, предпочтительно по английскому или истории.',85:'HSG: иностранные кандидаты с признанными дипломами могут проходить отдельный отбор; обучение начинается с Assessment Year.',29:'Для Georgetown проверь маршрут заявки по выбранной школе, особенно School of Foreign Service; требования разных школ не одинаковы.',10:'ETH: основная часть бакалавриата на немецком; проверь экзамен по иностранному аттестату.',11:'EPFL: основная часть бакалавриата на французском; проверь актуальные правила отбора и признания диплома.',81:'École Polytechnique Bachelor of Science — отдельный маршрут после школы, не цикл Ingénieur Polytechnicien.',66:'Université de Montréal: основной язык французский; проверь подготовительный год и эквивалентность диплома.',86:'University of Copenhagen: большинство бакалаврских курсов требуют датский.'};
  const SPECIAL_LINK={2:['Официальный список документов','https://admission.princeton.edu/apply/application-checklist'],85:['Правила отбора','https://www.unisg.ch/en/studying/admission/']};
  const UC='Для University of California действует отдельная UC Application; SAT/ACT не учитываются в решении о поступлении. Для отдельных кампусов и majors действуют собственные условия.';
  const ALIASES={1:['гарвард'],2:['принстон','принстонский'],5:['оксфорд'],6:['кембридж']};
  const universities=U.map((u,i)=>{
    const r=worldRanks[u[0]]||[];const c=cost12(i);
    const note=SPECIAL[i]||(i>=31&&i<=33?UC:null);
    return {
      id:slugOf(i),order:i,name:u[0],country:u[1],website:u[2],
      wikiTitle:pages[i],founded:info13[i][0],city:info13[i][1],history:info13[i][2],
      academicProfile:profiles[i][1],admissionOverview:profiles[i][2],
      admissionNote:note?{text:note,link:SPECIAL_LINK[i]?{label:SPECIAL_LINK[i][0],url:SPECIAL_LINK[i][1]}:null}:null,
      admissionsUrl:profiles[i][5],strengths:strengths[i],
      alumni:profiles[i][4].split(', ').filter(Boolean),
      ranks:{qs:r[0]||null,the:r[1]||null,usNews:r[2]||null,national:r[3]||null},
      extraRanks:(extraRank13[i]||[]).map(([label,rank,url])=>({label,rank,url})),
      aliases:ALIASES[i]||[],
      photo:photoFiles13[i],
      catalog:{official:!!ga14.catalogs[i],note:ga14.catalogs[i]?ga14.notes[i]:null,url:ga14.links[i]||null},
      budget:{tuition:c.tuition,total:c.total,year:c.year,type:c.type,note:c.note,source:c.source},
    };
  });
  const countries=Object.fromEntries(Object.entries(ga12Country).map(([k,v])=>[k,{currency:v[0],costGuideUrl:v[1],rulesUrl:v[2],certificateNote:v[3]}]));
  const programs=atlas.map((x,k)=>{const c=fee14(x.i,x.d),q=req14(x.i,x.d);const d=norm(x.d);
    return {id:slugOf(x.i)+'--'+k,university:slugOf(x.i),name:x.d,kind:x.kind,area:x.area,areaRank:x.rank,
      keywords:[...new Set([...synonyms.filter(g=>g.some(t=>d.includes(t))).flat(),...alias14(x.d).split(/\s+/)].filter(Boolean))].join(' '),
      cost:{tuition:c.tuition,total:c.total,year:c.year,type:c.type,note:c.note,source:c.source},
      requirements:{text:q.text,type:q.type,link:q.link}};});
  const slugE=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const exams=E.map((e,i)=>({id:slugE(e[0]),order:i,name:e[0],category:e[1],region:e[2],duration:e[3],scale:e[4],structure:e[5],notes:e[6],officialUrl:e[7],components:expanded[i][0],otherComponents:expanded[i][1],practiceUrl:expanded[i][2]}));
  return {universities,countries,programs,exams,areas,criteria};
});
fs.mkdirSync(OUT,{recursive:true});
for(const k of ['universities','programs','exams'])fs.writeFileSync(`${OUT}/${k}.json`,JSON.stringify(data[k],null,1)+'\n');
fs.writeFileSync(`${OUT}/countries.json`,JSON.stringify(data.countries,null,1)+'\n');
fs.writeFileSync(`${OUT}/meta.json`,JSON.stringify({areas:data.areas,ratingCriteria:data.criteria},null,1)+'\n');
console.log(data.universities.length,data.programs.length,data.exams.length,Object.keys(data.countries).length);
console.log(JSON.stringify(data.universities[5]).slice(0,900));
console.log(JSON.stringify(data.programs[0]));
console.log(new Set(data.universities.map(u=>u.id)).size, new Set(data.exams.map(u=>u.id)).size);
await b.close();})();
