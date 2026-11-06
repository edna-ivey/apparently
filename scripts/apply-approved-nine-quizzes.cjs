const fs=require('fs'),ts=require('typescript');
const specs=[['petty','PETTY_QUIZ_LOCKED_REVIEW_2026-10-22.md'],['crisis','CRISIS_QUIZ_LOCKED_REVIEW_2026-10-22.md'],['dating','DATING_QUIZ_LOCKED_REVIEW_2026-10-23.md'],['friendship','FRIENDSHIP_QUIZ_LOCKED_REVIEW_2026-10-23.md'],['food-order','FOOD_ORDER_QUIZ_LOCKED_REVIEW_2026-10-23.md'],['spending','SPENDING_QUIZ_LOCKED_REVIEW_2026-10-23.md'],['era','ERA_QUIZ_LOCKED_REVIEW_2026-10-24.md'],['ick','ICK_QUIZ_LOCKED_REVIEW_2026-10-26.md'],['group-chat','GROUP_CHAT_QUIZ_LOCKED_REVIEW_2026-10-26.md']];
const names={
'Planner':'planner_spontaneous:positive','Spontaneous':'planner_spontaneous:negative','Emotionally Intense':'emotional_intensity:positive','Even-Keeled':'emotional_intensity:negative','Direct':'direct_indirect:positive','Indirect':'direct_indirect:negative','Vibe Checker':'social_attunement:positive','Face Value':'social_attunement:negative','Protective':'protective_hands_off:positive','Hands-Off':'protective_hands_off:negative','Adventurous':'adventure_comfort:positive','Comfort-Seeking':'adventure_comfort:negative','Independent':'independent_collaborative:positive','Collaborative':'independent_collaborative:negative','Control':'control_allowing:positive','Let It Play Out':'control_allowing:negative','Practical':'practical_idealistic:positive','Idealistic':'practical_idealistic:negative','Sentimental':'sentimental_thick_skinned:positive','Thick-Skinned':'sentimental_thick_skinned:negative','Rule-Oriented':'rules_bending:positive','Rule-Bending':'rules_bending:negative','Conflict-Forward':'conflict_peacekeeping:positive','Peacekeeping':'conflict_peacekeeping:negative','Trust First':'trust_verify:positive','Verify First':'trust_verify:negative','Forgiving':'forgiving_receipts:positive','Holds the Receipt':'forgiving_receipts:negative','Playful':'playful_serious:positive','Serious':'playful_serious:negative','Competitive':'competitive_cooperative:positive','Cooperative':'competitive_cooperative:negative','Curious':'curious_decisive:positive','Decisive':'curious_decisive:negative','Private':'private_open:positive','Open':'private_open:negative','Patient':'patient_urgent:positive','Urgent':'patient_urgent:negative','Ambitious':'ambitious_content:positive','Content':'ambitious_content:negative'};
function poleList(s){let out=[];for(const m of s.matchAll(/(Emotionally Intense|Let It Play Out|Holds the Receipt|Comfort-Seeking|Conflict-Forward|Rule-Oriented|Rule-Bending|Thick-Skinned|Even-Keeled|Vibe Checker|Verify First|Trust First|Face Value|Hands-Off|[A-Za-z]+(?:-[A-Za-z]+)?)\s*\+([123])/g)){if(names[m[1]])out.push({pole:names[m[1]],points:+m[2],name:m[1]});else throw Error('Unrecognized '+m[1]);}return out;}
function getSection(doc){return doc.split(/## Round 1[^\n]*|## Approved revised Core mappings[^\n]*/)[1].split(/\n## Round 2|\n## Approved|\n## Locked/)[0];}
function extract(slug,doc){const sec=getSection(doc);if(!sec)throw Error('Missing round 1 '+slug);const blocks=[...sec.matchAll(/### Q(\d+)(?:[.:])?[^\n]*\n([\s\S]*?)(?=\n### Q\d+|$)/g)];if(blocks.length!==(slug==='dating'?10:8))throw Error(slug+' question blocks '+blocks.length);
return blocks.map((b,i)=>{const lines=b[2].split('\n');let choices=[];for(let k=0;k<lines.length;k++){let l=lines[k];let m=l.match(/^-\s*(?:\*\*)?([ABCD])(?:\*\*)?[.:]?\s*(.*)$/)|| (slug==='petty'?l.match(/^([ABCD])\s+(.*)$/):null);if(!m)continue;let raw=m[2],next=lines.slice(k+1,k+5).join('\n'),core;
if(slug==='petty')core=raw.split('→')[1]?.split('; petty')[0]?.split('; original')[0];
else if(slug==='crisis')core=raw.split(' | ')[1];
else if(slug==='spending')core=raw.split(' | ').slice(-1)[0];
else if(slug==='dating')core=(next.match(/Core awards:\s*([^\n]+)/)||[])[1];
else core=(next.match(/(?:Core awards|\*\*Core:\*\*|\*\*Core\*\*|Core):\s*([^\n]+)/)||[])[1];
if(slug==='ick')core=(next.match(/\*\*Core:\*\*\s*([^\n]+)/)||[])[1];
if(slug==='era')core=(next.match(/\*\*Core:\*\*\s*([^\n]+)/)||[])[1];
if(slug==='group-chat')core=(next.match(/- \*\*Core:\*\*\s*([^\n]+)/)||[])[1];
if(slug==='petty'&&i===3&&m[1]==='A')core='Even-Keeled +3; Cooperative +1; Patient +1; Peacekeeping +2';
if(slug==='petty'&&i===4&&m[1]==='D')core='Competitive +2; Control +2';
if(!core)throw Error(slug+' Q'+(i+1)+m[1]+' core missing: '+raw+' '+next.slice(0,90));
const a=poleList(core);if(!a.length)throw Error(slug+' Q'+(i+1)+m[1]+' no awards: '+core);
choices.push({letter:m[1].toLowerCase(),awards:a,raw,core});}
if(choices.length!==4||choices.map(c=>c.letter).join('')!=='abcd')throw Error(slug+' Q'+(i+1)+' choices '+choices.map(c=>c.letter));return choices;});}
function parse(s){return ts.createSourceFile('x.ts',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);}
function findObj(n,pred){if(ts.isObjectLiteralExpression(n)&&pred(n))return n;return ts.forEachChild(n,c=>findObj(c,pred));}
function prop(o,k){return o.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText().replace(/['"]/g,'')===k);}
function array(o,k){const p=prop(o,k);if(!p||!ts.isArrayLiteralExpression(p.initializer))throw Error('No '+k);return p.initializer.elements;}
function value(o,k){return prop(o,k)?.initializer?.text;}
function writeEdits(src,edits){edits.sort((a,b)=>b.start-a.start);for(const e of edits)src=src.slice(0,e.start)+e.v+src.slice(e.end);return src;}
const report={};
for(const [slug,file] of specs){const doc=fs.readFileSync('docs/quiz-reviews/'+file,'utf8'),matrix=extract(slug,doc);const qp='src/data/quizzes/'+slug+'.ts',ap='src/data/quiz-pole-awards/'+slug+'.ts';let src=fs.readFileSync(qp,'utf8'),ast=parse(src),root=findObj(ast,o=>value(o,'id')===slug);if(!root)throw Error('Missing quiz '+slug);const questions=array(root,'questions');if(questions.length!==matrix.length)throw Error(slug+' question count mismatch '+questions.length+' vs '+matrix.length);let edits=[],out=[];
for(let i=0;i<questions.length;i++){const choices=array(questions[i],'choices');if(choices.length!==4)throw Error('choice count '+slug+i);let row=[];for(let j=0;j<4;j++){const c=choices[j],d=matrix[i][j];if(value(c,'id')!==d.letter)throw Error('answer order '+slug+i+j);let label=value(c,'label');if(!label)throw Error('missing label '+slug+i+j);row.push({wording:label,awards:d.awards});if(slug==='petty'){const overrides={ '1a':'I ask why they\'re suddenly seeking my fashion expertise.','1b':'I finally have a chance to be honest about those shoes.','4b':"I'm happy over here. They can watch whatever they want.",'4c':'Oh, you came to LOOK? Let me post something worth watching.','6b':"I tell them it's damaged and ask how we're fixing it."};let newLabel=overrides[i+''+d.letter];if(newLabel&&newLabel!==label){const p=prop(c,'label').initializer;edits.push({start:p.getStart(ast),end:p.end,v:JSON.stringify(newLabel)});row[j].wording=newLabel;}}
}
out.push(row);}
if(edits.length)fs.writeFileSync(qp,writeEdits(src,edits));
const symbol=slug.replace(/-/g,'_').toUpperCase()+'_POLE_AWARDS';
const body="import type { QuizPoleAwardMap } from './types';\n\n// Exact approved Core awards from docs/quiz-reviews/"+file+".\nexport const "+symbol+": QuizPoleAwardMap = {\n"+out.map((row,i)=>'  q'+(i+1)+': {\n'+row.map((c,j)=>'    '+ 'abcd'[j]+': {\n      wording: '+JSON.stringify(c.wording)+',\n      awards: ['+c.awards.map(a=>"{ pole: '"+a.pole+"', points: "+a.points+' }').join(', ')+"],\n      rationale: 'Owner-approved mapping',\n      status: 'corrected',\n      scoringVersion: 'v2.0',\n    },").join('\n')+'\n  },').join('\n')+'\n};\n';
fs.writeFileSync(ap,body);
report[slug]={answers:out.flat().length,awards:out.flat().reduce((n,c)=>n+c.awards.length,0),points:out.flat().reduce((n,c)=>n+c.awards.reduce((s,a)=>s+a.points,0),0)};
console.log('DONE',slug,JSON.stringify(report[slug]));
}
fs.writeFileSync('docs/quiz-reviews/IMPLEMENTATION_COUNTS_2026-10-26.json',JSON.stringify(report,null,2)+'\n');
