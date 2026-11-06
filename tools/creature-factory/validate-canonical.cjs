#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'), m=JSON.parse(fs.readFileSync(path.join(root,'assets/creatures-canonical/manifest.json'),'utf8'));
const slots=m.slots, errs=[], warns=[]; let present=0;
if(m.traits.length!==40) errs.push('manifest must contain exactly 40 Core poles');
if(new Set(m.traits.map(t=>t.slug)).size!==40) errs.push('trait slugs must be unique');
const fileName=(t,s)=>t+'-'+s+'-canonical-'+m.canonicalVersion+'.svg';
for(const t of m.traits) for(const s of slots){
  const p=path.join(root,'assets/creatures-canonical',m.canonicalVersion,t.slug,fileName(t.slug,s));
  if(!fs.existsSync(p)){ if(t.slots[s]!=='missing'&&t.slots[s]!=='body-only-v0') errs.push('manifest says present but missing: '+p); continue; }
  present++; const x=fs.readFileSync(p,'utf8');
  if(!/<svg\b/i.test(x)||!/<\/svg>/i.test(x)) errs.push('invalid SVG: '+p);
  const vb=(x.match(/viewBox=["']([^"']+)["']/i)||[])[1];
  if(vb!==m.canvas.viewBox) errs.push('wrong viewBox '+(vb||'none')+': '+p);
  if(/<rect\b[^>]*(?:width=["'](?:1600|100%)["'])[^>]*(?:height=["'](?:1800|100%)["'])[^>]*(?:fill=["'](?:#fff(?:fff)?|white)["'])/i.test(x)) errs.push('white matte detected: '+p);
}
if(present===280) console.log('PASS complete canonical count: 280/280'); else console.log('INFO canonical count: '+present+'/280');
const ind=path.join(root,'assets/creatures-canonical',m.canonicalVersion,'independent');
for(const s of slots) if(!fs.existsSync(path.join(ind,fileName('independent',s)))) errs.push('gold-standard Independent missing '+s);
console.log('Core poles:',m.traits.length,' Slots:',slots.length,' Errors:',errs.length,' Warnings:',warns.length);
for(const e of errs) console.error('ERROR',e); for(const w of warns) console.warn('WARN',w);
process.exitCode=errs.length?1:0;
