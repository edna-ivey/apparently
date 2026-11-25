const fs=require('fs'),ts=require('typescript'),path=require('path');
const root=process.cwd();
const jobs=[
 ['one-bite','ONE_BITE_QUIZ_LOCKED_REVIEW_2026-10-26.md'],
 ['kid-you','KID_YOU_QUIZ_LOCKED_REVIEW_2026-10-26.md'],
 ['unexpected-money','UNEXPECTED_MONEY_QUIZ_LOCKED_REVIEW_2026-10-26.md']
];
const labels={
'Planner':'planner_spontaneous:positive','Spontaneous':'planner_spontaneous:negative',
'Emotionally Intense':'emotional_intensity:positive','Even-Keeled':'emotional_intensity:negative',
'Direct':'direct_indirect:positive','Indirect':'direct_indirect:negative',
'Vibe Checker':'social_attunement:positive','Face Value':'social_attunement:negative',
'Protective':'protective_hands_off:positive','Hands-Off':'protective_hands_off:negative',
'Adventurous':'adventure_comfort:positive','Comfort-Seeking':'adventure_comfort:negative',
'Independent':'independent_collaborative:positive','Collaborative':'independent_collaborative:negative',
'Control':'control_allowing:positive','Let It Play Out':'control_allowing:negative',
'Practical':'practical_idealistic:positive','Idealistic':'practical_idealistic:negative',
'Sentimental':'sentimental_thick_skinned:positive','Thick-Skinned':'sentimental_thick_skinned:negative',
'Rule-Oriented':'rules_bending:positive','Rule-Bending':'rules_bending:negative',
'Conflict-Forward':'conflict_peacekeeping:positive','Peacekeeping':'conflict_peacekeeping:negative',
'Trust First':'trust_verify:positive','Verify First':'trust_verify:negative',
'Forgiving':'forgiving_receipts:positive','Holds the Receipt':'forgiving_receipts:negative',
'Playful':'playful_serious:positive','Serious':'playful_serious:negative',
'Competitive':'competitive_cooperative:positive','Cooperative':'competitive_cooperative:negative',
'Curious':'curious_decisive:positive','Decisive':'curious_decisive:negative',
'Private':'private_open:positive','Open':'private_open:negative',
'Patient':'patient_urgent:positive','Urgent':'patient_urgent:negative',
'Ambitious':'ambitious_content:positive','Content':'ambitious_content:negative'};
const quote=s=>JSON.stringify(s);
function parse(tsText){return ts.createSourceFile('x.ts',tsText,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);}
function findObj(node,pred){if(ts.isObjectLiteralExpression(node)&&pred(node))return node;return ts.forEachChild(node,n=>findObj(n,pred));}
function prop(obj,name){return obj.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText().replace(/['"]/g,'')===name);}
function arr(obj,name){const p=prop(obj,name);if(!p||!ts.isArrayLiteralExpression(p.initializer))throw Error('Missing array '+name);return p.initializer.elements;}
function str(node){return node.text;}
function replace(source,edits){edits.sort((a,b)=>b.start-a.start);for(let i=0;i<edits.length-1;i++)if(edits[i].start<edits[i+1].end)throw Error('Overlapping edits');for(const e of edits)source=source.slice(0,e.start)+e.value+source.slice(e.end);return source;}
function parseReveals(doc){const out=[...doc.matchAll(/### (THE[^\n]+)\n\n\*\*Hero:\*\* ([^\n]+)\n\n([\s\S]*?)\n\n\*([^\n]*Apparently,[^\n]*)\*\n\n\*\*Trait tags:\*\* ([^\n]+)/g)].map(x=>({title:x[1],hero:x[2],body:x[3],kicker:x[4],tags:x[5]}));if(out.length!==4)throw Error('Expected four reveals, got '+out.length);return out;}
function parseMaps(doc){const section=doc.split('## Approved revised Core mappings')[1].split('## Locked expanded result reveals')[0];const blocks=[...section.matchAll(/### Q(\d+)\n([\s\S]*?)(?=\n### Q|$)/g)];if(blocks.length!==8)throw Error('Expected 8 map blocks');return blocks.map(b=>{const lines=[...b[2].matchAll(/- \*\*([ABCD]):\*\* ([^\n]+)/g)];if(lines.length!==4)throw Error('Expected four answers Q'+b[1]);return lines.map(x=>x[2]);});}
function awards(s){return s.split(';').map(part=>{const m=part.trim().match(/^(.+?) \+([123])$/);if(!m||!labels[m[1]])throw Error('Unknown award '+part);return {pole:labels[m[1]],points:Number(m[2])};});}
function moneyQuestions(doc){const section=doc.split('## Approved revamped questions, answer votes, and Core mappings')[1].split('**Balance:**')[0];const blocks=[...section.matchAll(/### Q(\d+)\. ([^\n]+)\n\n([\s\S]*?)(?=\n\n### Q|$)/g)];if(blocks.length!==8)throw Error('Money question count '+blocks.length);return blocks.map(b=>{const opts=[...b[3].matchAll(/- \*\*([ABCD])\.\*\* (.*?) \| \*\*(.*?) \+1\*\* \| Core: ([^\n]+)/g)];if(opts.length!==4)throw Error('Money answer count '+b[1]);return {prompt:b[2],options:opts.map(o=>({label:o[2],archetype:o[3],core:o[4]}))};});}
for(const [slug,filename] of jobs){
 const doc=fs.readFileSync('docs/quiz-reviews/'+filename,'utf8'),reveals=parseReveals(doc),money=slug==='unexpected-money',maps=money?moneyQuestions(doc).map(q=>q.options.map(o=>o.core)):parseMaps(doc);
 const quizPath='src/data/quizzes/'+slug+'.ts',awardPath='src/data/quiz-pole-awards/'+slug+'.ts';
 let source=fs.readFileSync(quizPath,'utf8'),ast=parse(source),rootObj=findObj(ast,o=>prop(o,'id')?.initializer?.text===slug);
 if(!rootObj)throw Error('quiz not found '+slug);
 const archetypes=arr(rootObj,'archetypes'),questions=arr(rootObj,'questions');if(archetypes.length!==4||questions.length!==8)throw Error('Quiz shape '+slug);
 let edits=[];const change=(node,value)=>edits.push({start:node.getStart(ast),end:node.end,value});
 const archIds={};
 archetypes.forEach((a,i)=>{const id=str(prop(a,'id').initializer),r=reveals[i];archIds[r.title]=id;const title=str(prop(a,'title').initializer);if(title!==r.title)throw Error('Reveal title mismatch '+title+' '+r.title);
 change(prop(a,'body').initializer,quote(r.body));change(prop(a,'kicker').initializer,quote(r.kicker));
 });
 if(money){
  const data=moneyQuestions(doc);
  change(prop(rootObj,'introSupport').initializer,JSON.stringify(['Your bank account just got an unexpected visitor.','Let\'s see how long the money survives.']));
  change(prop(rootObj,'introCta').initializer,quote('Follow the money →'));
  questions.forEach((q,i)=>{change(prop(q,'prompt').initializer,quote(data[i].prompt));const choices=arr(q,'choices');choices.forEach((c,j)=>{const o=data[i].options[j];const id=archIds['THE '+o.archetype.toUpperCase()];if(!id)throw Error('Archetype missing '+o.archetype);change(prop(c,'label').initializer,quote(o.label));change(prop(c,'resultWeights').initializer,'{ '+quote(id)+': 1 }');});});
 }
 source=replace(source,edits);fs.writeFileSync(quizPath,source);
 // Rebuild answer-level award table with source wording as audit reference.
 const latest=parse(source),quiz=findObj(latest,o=>prop(o,'id')?.initializer?.text===slug);
 const qdata=arr(quiz,'questions').map((q,i)=>arr(q,'choices').map((c,j)=>({wording:str(prop(c,'label').initializer),awards:awards(maps[i][j])})));
 const constName=slug.replace(/-/g,'_').toUpperCase()+'_POLE_AWARDS';
 const out="import type { QuizPoleAwardMap } from './types';\n\n// Approved 2026-10-26 creative/Core review. Each answer's evidence is independently mapped.\nexport const "+constName+": QuizPoleAwardMap = {\n"+qdata.map((q,i)=>"  q"+(i+1)+": {\n"+q.map((c,j)=>"    "+'abcd'[j]+": {\n      wording: "+quote(c.wording)+",\n      awards: ["+c.awards.map(a=>"{ pole: '"+a.pole+"', points: "+a.points+" }").join(', ')+ "],\n      rationale: 'Approved answer-level Core mapping in docs/quiz-reviews/"+filename+"',\n      status: 'corrected',\n      scoringVersion: 'v2.0',\n    },").join('\n')+"\n  },").join('\n')+"\n};\n";
 fs.writeFileSync(awardPath,out);
 console.log('Updated '+slug+': '+qdata.flatMap(x=>x).reduce((n,x)=>n+x.awards.length,0)+' awards');
}
