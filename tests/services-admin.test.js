const fs=require('fs'),path=require('path');
const { JSDOM, VirtualConsole }=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','admin.html'),'utf8');
const cj=JSON.parse(fs.readFileSync(path.join(__dirname,'..','content.json'),'utf8'));
const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:new VirtualConsole(),beforeParse(w){
  w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(JSON.stringify(cj)))});
  w.URL.createObjectURL=()=>'blob:x'; w.URL.revokeObjectURL=()=>{};
}});
const d=dom.window.document; let fails=0;
const a=(c,m)=>{console.log((c?'PASS':'FAIL')+' — '+m);if(!c)fails++;};
setTimeout(()=>{
  const titles=[...d.querySelectorAll('details.sec summary')].map(s=>s.textContent);
  a(titles.some(t=>/Services/.test(t)),'admin has a Services section');
  const labels=[...d.querySelectorAll('details.sec label')].map(l=>l.textContent);
  a(labels.some(t=>/Service cards/.test(t)),'service cards list editor rendered');
  a(titles.some(t=>/About/.test(t)),'admin has an About section');
  a(labels.some(t=>/Premium amenities/.test(t)),'fleet amenities editor rendered');
  a(labels.some(t=>/Vehicle name/.test(t)),'fleet single-vehicle editor rendered');
  console.log('\n'+(fails?fails+' FAILURE(S)':'ALL CHECKS PASSED'));process.exit(fails?1:0);
},300);
