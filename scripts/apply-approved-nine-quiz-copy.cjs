const fs=require('fs'),ts=require('typescript');
const specs=[['petty','PETTY_QUIZ_LOCKED_REVIEW_2026-10-22.md'],['crisis','CRISIS_QUIZ_LOCKED_REVIEW_2026-10-22.md'],['dating','DATING_QUIZ_LOCKED_REVIEW_2026-10-23.md'],['friendship','FRIENDSHIP_QUIZ_LOCKED_REVIEW_2026-10-23.md'],['food-order','FOOD_ORDER_QUIZ_LOCKED_REVIEW_2026-10-23.md'],['spending','SPENDING_QUIZ_LOCKED_REVIEW_2026-10-23.md'],['era','ERA_QUIZ_LOCKED_REVIEW_2026-10-24.md'],['ick','ICK_QUIZ_LOCKED_REVIEW_2026-10-26.md'],['group-chat','GROUP_CHAT_QUIZ_LOCKED_REVIEW_2026-10-26.md']];
const norm=s=>s.replace(/\*\*/g,'').trim();
function prop(o,k){return o.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText().replace(/['"]/g,'')===k);}
function find(n,pred){if(ts.isObjectLiteralExpression(n)&&pred(n))return n;return ts.forEachChild(n,c=>find(c,pred));}
const q=s=>JSON.stringify(s);
let editsByQuiz={};
for(const [slug,file] of specs){const doc=fs.readFileSync('docs/quiz-reviews/'+file,'utf8'),section=doc.split(/## Round 1[^\n]*/)[1].split(/\n## Round 2/)[0],blocks=[...section.matchAll(/### Q(\d+)(?:[.:])?[^\n]*\n([\s\S]*?)(?=\n### Q\d+|$)/g)];
let source=fs.readFileSync('src/data/quizzes/'+slug+'.ts','utf8'),ast=ts.createSourceFile('x.ts',source,ts.ScriptTarget.Latest,true),root=find(ast,o=>prop(o,'id')?.initializer?.text===slug),questions=prop(root,'questions').initializer.elements,archetypes=prop(root,'archetypes')?.initializer?.elements||[],ids={};
for(const a of archetypes){let title=prop(a,'title')?.initializer.text,id=prop(a,'id')?.initializer.text;if(title)ids[title.replace(/^THE /,'').toLowerCase()]=id;}
const edits=[],change=(node,val)=>edits.push({start:node.getStart(ast),end:node.end,val});
for(let i=0;i<blocks.length;i++){let lines=blocks[i][2].split('\n'),opts=[];for(let k=0;k<lines.length;k++){const m=lines[k].match(/^-\s*(?:\*\*)?([ABCD])(?:\*\*)?[.:]?\s*(.*)$/)||(slug==='petty'?lines[k].match(/^([ABCD])\s+(.*)$/):null);if(!m)continue;let raw=m[2],label=raw,tail=lines.slice(k+1,k+5).join('\n'),vote,score;
if(slug==='petty'){label=raw.split(' → ')[0];score=Number((raw.match(/petty\s+(\d)/)||[])[1]);}
else if(slug==='crisis'){label=raw.replace(/^\[([^\]]+)\]\s*/,'');vote=(raw.match(/^\[([^\]]+)\]/)||[])[1];label=label.split(' | ')[0];}
else if(slug==='spending'||slug==='era'){label=raw.split(' | ')[0];vote=(slug==='spending'?(raw.match(/\|\s*(.*?)\s*\+1\s*\|/)||[])[1]:(tail.match(/\*\*Era:\*\*\s*(.*?)\s*\(\+1 vote\)/)||[])[1]);}
else if(slug==='dating'){label=raw.replace(/^\(dating difficulty \*\*(\d)\*\*\):\s*/,'');score=Number((raw.match(/dating difficulty \*\*(\d)\*\*/)||[])[1]);}
else if(slug==='ick'){score=Number((tail.match(/\*\*Ick Meter:\*\*\s*\+(\d)/)||[])[1]);}
else if(slug==='friendship'){vote=(tail.match(/Archetype:\s*\*\*(.*?)\s*\+1 vote\*\*/)||[])[1];}
else if(slug==='food-order'){vote=(tail.match(/Archetype:\s*\*\*(.*?)\s*\+1 vote\*\*/)||[])[1];}
else if(slug==='group-chat'){vote=(tail.match(/\*\*Archetype vote:\*\*\s*(.*?)\s*\(\+1\)/)||[])[1];}
label=norm(label);
if(slug==='petty'&&i===3&&m[1]==='A')label='Let it go. I have somewhere to be.';
if(slug==='petty'&&i===4&&m[1]==='D')label='Suddenly my next story needs better lighting.';
opts.push({letter:m[1].toLowerCase(),label,vote,score});}
if(opts.length!==4)throw Error(slug+' Q'+(i+1)+' opts '+opts.length);
const question=questions[i],choices=prop(question,'choices').initializer.elements;
for(let j=0;j<4;j++){const o=opts[j],c=choices[j];if(prop(c,'id').initializer.text!==o.letter)throw Error('Letter mismatch '+slug+i+j);
const p=prop(c,'label');if(p.initializer.text!==o.label)change(p.initializer,q(o.label));
if(o.vote){const key=o.vote.toLowerCase().replace(/^the /,'').replace(/ era$/,' era');let id=ids[key]||ids[key.replace(/ era$/,'')+' era']||(slug==='food-order'&&key==="i'll have my usual"?'ill-have-my-usual':null);if(!id)throw Error('Vote not resolved '+slug+' '+o.vote+' '+JSON.stringify(ids));const weight=prop(c,'resultWeights');if(!weight)throw Error('No weights '+slug);change(weight.initializer,'{ '+q(id)+': 1 }');}
if(Number.isInteger(o.score)){const sp=prop(c,'score');if(sp&&sp.initializer.text!==String(o.score))change(sp.initializer,String(o.score));}
}
if(slug!=='petty'&&slug!=='spending'){const h=(blocks[i][0].match(/### Q\d+[.:]?\s*([^\n]+)/)||[])[1];if(h){const p=prop(question,'prompt');if(p&&p.initializer.text!==h)change(p.initializer,q(h));}}
if(slug==='spending'){const header=(blocks[i][2].match(/^\*\*(.*?)\*\*/m)||[])[1];if(header){const p=prop(question,'prompt');if(p.initializer.text!==header)change(p.initializer,q(header));}}
}
edits.sort((a,b)=>b.start-a.start);for(const e of edits)source=source.slice(0,e.start)+e.val+source.slice(e.end);
fs.writeFileSync('src/data/quizzes/'+slug+'.ts',source);editsByQuiz[slug]=edits.length;console.log(slug,edits.length);
}
fs.writeFileSync('docs/quiz-reviews/QUESTION_COPY_UPDATE_COUNTS_2026-10-26.json',JSON.stringify(editsByQuiz,null,2)+'\n');
