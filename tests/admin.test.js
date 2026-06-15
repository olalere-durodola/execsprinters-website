const fs=require('fs'),path=require('path');
const { JSDOM, VirtualConsole }=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'..','admin.html'),'utf8');
const cj=JSON.parse(fs.readFileSync(path.join(__dirname,'..','content.json'),'utf8'));
const vc=new VirtualConsole();
const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  w.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(JSON.stringify(cj)))});
  w.URL.createObjectURL=()=>'blob:x'; w.URL.revokeObjectURL=()=>{};
}});
const d=dom.window.document; let fails=0;
const a=(c,m)=>{console.log((c?'PASS':'FAIL')+' — '+m);if(!c)fails++;};
setTimeout(()=>{
  const titles=[...d.querySelectorAll('details.sec summary')].map(s=>s.textContent);
  a(titles.some(t=>/Booking form/.test(t)),'admin has Booking form section');
  a(!titles.some(t=>/Quote section text/.test(t)),'old Quote section removed');
  a(!!d.querySelector('details.sec'),'admin built sections');
  // the new list-string editor for serviceTypes actually rendered (catches schema typos)
  const labels=[...d.querySelectorAll('details.sec label')].map(l=>l.textContent);
  a(labels.some(t=>/Service types/.test(t)),'serviceTypes editor rendered');
  console.log('\n'+(fails?fails+' FAILURE(S)':'ALL CHECKS PASSED'));process.exit(fails?1:0);
},300);
