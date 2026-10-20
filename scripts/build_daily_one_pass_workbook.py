#!/usr/bin/env python3
"""One-pass Daily review: preserves original vs newly drafted provenance, never publishes."""
from pathlib import Path
import json,re
ROOT=Path('/Users/edna/Documents/Github/apparently')
D=ROOT/'docs'
original=json.loads((D/'DAILY_BATCH1_ORIGINAL_VIDEO_RECOVERED_2026-10-20.json').read_text())
new=json.loads((D/'DAILY_BATCH2_NEW_ANSWER_PROPOSALS_2026-10-20.json').read_text())
master=(D/'DAILY_MASTER_ONE_PASS_REVIEW_2026-10-19.md').read_text()
batch3=(D/'DAILY_BATCH3_FULL_COPY_AND_EDITORIAL_REVIEW_2026-10-19.md').read_text()
status={}
for line in master.splitlines():
 m=re.match(r'^### (free|private):(\d+) \| (KEEP|REVISE|CUT)',line)
 if m:status[(m.group(1),int(m.group(2)))]=m.group(3)
prompts={}
for kind in ('free','private'):
 for row in original[kind]:
  prompts[(kind,int(row['id'].split(':')[1]))]=(row['question'],list(zip('ABCDEF',row['answers'])),'VIDEO ORIGINAL: exact pre-revision answer text')
for kind in ('free','private'):
 for m in re.finditer(r'^### '+kind+r':(\d+) \| (KEEP|REVISE|CUT).*?\n(.*?)(?=^### |\Z)',batch3,re.M|re.S):
  n=int(m.group(1));block=m.group(3)
  q=re.search(r'\*\*Question:\*\* (.*)',block)
  opts=re.findall(r'^([A-F])\. (.*)',block,re.M)
  if q:prompts[(kind,n)]=(q.group(1).strip(),opts,'BATCH 3 SAVED ORIGINAL ANSWERS')
for kind in ('free','private'):
 for n,choices in new[kind].items():
  n=int(n);k=(kind,n)
  prompt=re.search(r'^### '+kind+':'+str(n)+r' \|[^\n]*\n\*\*Question:\*\* ([^\n]+)',master,re.M)
  if prompt:prompts[k]=(prompt.group(1).strip(),list(zip('ABCDEF',choices)),'NEW FORGE PROPOSALS: original Batch 2 answers not recoverable from available sources')
# Preserve the three Batch 2 CUT slots as archival prompts.
for kind,n in [('free',22),('private',20),('private',23)]:
 source=(D/'DAILY_BATCH2_EDITORIAL_REVIEW_2026-10-19.md').read_text()
 for line in source.splitlines():
  if line.startswith('| '+kind+':'+str(n)+' |'):
   parts=[x.strip() for x in line.split('|')]
   prompts[(kind,n)]=(parts[3],[],'OWNER-CUT ARCHIVAL PROMPT')
 assert (kind,n) in prompts,(kind,n)
# Override exact owner-approved character answer revisions, keeping question names and film/show roles.
char_doc=(D/'DAILY_APPROVED_CHARACTER_REVISIONS_2026-10-19.md').read_text()
for heading,kind,n in [('Free #2','free',1),('Free #7','free',6),('Free #12','free',11),('Free #14','free',13),('Private #4','private',3)]:
 pattern=r'^## '+re.escape(heading)+r': ([^\n]+)\n(.*?)(?=^## |\Z)'
 match=re.search(pattern,char_doc,re.M|re.S)
 assert match,heading
 rows=re.findall(r'^\| ([^|]+) \| ([^|]+) \|$',match.group(2),re.M)
 # drop table separator/header
 rows=[(a.strip(),b.strip()) for a,b in rows if ':' in a]
 assert len(rows)==6,(heading,rows)
 prompts[(kind,n)]=(match.group(1).strip(),list(zip('ABCDEF',[a+' | '+b for a,b in rows])),'OWNER-APPROVED REVISED CHARACTER OPTIONS')
# Owner-approved answer changes and cuts
for kind,n,letter,answer in [('free',39,'E',"Just because we're related doesn't mean I have to like you."),('private',27,'A',"I deserved it, but I'll never have it. Knowing I was capable might haunt me forever."),('private',27,'B',"I have it, but I didn't deserve it. Everybody celebrates me, and I know the truth.")]:
 k=(kind,n)
 if k not in prompts:continue
 q,opts,src=prompts[k]
 opts=[(l,answer if l==letter else a) for l,a in opts]
 if (kind,n)==('private',27):q="Would you rather know you deserved a success you'll never achieve, or discover you didn't deserve the greatest success of your life?"
 prompts[k]=(q,opts,src+'; OWNER-APPROVED OPTION REVISIONS')
for kind,n,letter in [('free',30,'D'),('free',31,'F')]:
 k=(kind,n)
 if k in prompts:
  q,opts,src=prompts[k]
  prompts[k]=(q,[(l,a) for l,a in opts if l!=letter],src+'; OWNER-CUT OPTION EXCLUDED')
# Approved reveal exact copy, final/latest owner approvals only
approved={}
def approve(n,l,t,b):approved[(n,l)]=(t,b)
for n,vals in {
30:{
'A':('Cirque du So-Nasty.',"The flexibility is impressive. What you're doing with it is a separate conversation."),
'B':('A Crime Scene With No Witnesses.',"Somewhere in your house is evidence you're hoping nobody finds."),
'C':('The Human Sniff Test.',"You're not dirty. You're conducting a very personal inspection."),
'E':('The Scab Has Filed a Restraining Order.','Your skin is trying to heal, and you keep showing up to disturb the peace. LEAVE HER ALONE!'),
'F':('The Disgusted Witness.',"You're judging everyone so loudly we're starting to wonder what you're hiding.")},
31:{
'A':('The Chewing Tribunal.',"One loud bite and you've mentally filed for divorce. From a person you're not even dating."),
'B':('Joy Has a Sound Limit.','They were having a wonderful time. Unfortunately, you could hear it.'),
'C':('The Grammar Grudge.',"Apparently, they're the grammar police, and you're a repeat offender. Nobody asked them to patrol your sentences."),
'D':('Congratulations, I Guess',"We're all so proud of you. We were proud the first six times you mentioned it, too."),
'E':('Originality Enforcement Officer.','Inspiration is flattering. Watching somebody take credit? Straight to court.')},
34:{
'A':('Available in Theory.','Your phone works. Your willingness to interact is currently out of service.'),
'B':('Selective Hearing, Premium Edition.','You heard every syllable. You simply declined the invitation.'),
'C':('The Receipt Department.','Forgiveness has been issued. The documentation remains permanently available.'),
'D':("Breaking News: It's You.","Other people are still talking, but apparently your thought has a press conference."),
'E':('Unsolicited Life Coach.','Nobody booked a session, but here you are with a six-step plan.'),
'F':('The Complaint Committee.',"You've identified the problem, held a meeting, and voted against taking action.")
}}.items():
 for l,(t,b) in vals.items():approve(n,l,t,b)
# Fix the owner-approved original Free30 exact copy from latest source: D removed, E approved.
# Data from saved batch3 retains answer E exact.
# Dimensions are canonical code IDs, signed score = positive or negative pole. NO MAX NUMBER OF DIMENSIONS.
rule_specs=[
('planner_spontaneous',3,r'plan|schedule|backup|organize|menu before|knowing how many|verification|detail|rehears|prepare'),
('planner_spontaneous',-2,r'wildcard|spontaneous|without an itinerary|impulse|chaos|accidentally'),
('direct_indirect',3,r'tell the truth|say the one thing|confront|tell my friend|honest|no filter|saying|calling them'),
('direct_indirect',-2,r'pretend|secret|hide|silence|unread|didn.t hear|avoid'),
('social_attunement',2,r'read the room|know what they mean|tiny details|vibe|intention|real feelings|body language'),
('protective_hands_off',2,r'protect|safe|friend|family|loyal|carry your secret'),
('adventure_comfort',3,r'teleport|travel|galaxies|futuristic|danger|adventure|disappear|magical|stranger'),
('adventure_comfort',-2,r'cozy|clean sheets|sleep|home|comfortable|quiet|rest|never work'),
('independent_collaborative',2,r'alone|myself|nobody knows|independent|walks away|leave town|without anyone'),
('independent_collaborative',-2,r'friends|together|everybody|people|team|family'),
('control_allowing',3,r'control|rewrit|undo|know exactly|guarantee|fix|mastermind|backup|prevent'),
('control_allowing',-2,r'let them|stay out|do nothing|wait|let it ride'),
('practical_idealistic',3,r'money|bank|bill|budget|income|work|laundry|traffic|fridge|chore'),
('practical_idealistic',-2,r'dream|beautiful|future|alternate|invention|possibilities|magic'),
('sentimental_thick_skinned',2,r'memories|remember|miss us|love|romantic|wanted|feelings|least loved'),
('sentimental_thick_skinned',-2,r'no feelings|welded shut|unbothered|cold|not care'),
('rules_bending',2,r'instructions|law|illegal|standards|rule|return shopping carts'),
('rules_bending',-2,r'lie|steal|break|revenge|crime|secretly|heist|scandal'),
('conflict_peacekeeping',2,r'confront|argue|fight|correct|truth|stand up|win the argument'),
('conflict_peacekeeping',-2,r'keep the peace|avoid|silence|stay out|not saying|quiet'),
('trust_verify',-3,r'proof|receipts|verify|screenshot|following list|lying|lie|search history|secret|evidence'),
('trust_verify',2,r'trust|believe|benefit of the doubt|loyal'),
('forgiving_receipts',-3,r'keep score|receipt|revenge|grudge|never forget|wronged|red flags|betray'),
('forgiving_receipts',2,r'forgiv|let go|peace|second chance'),
('playful_serious',3,r'funny|laugh|joke|chaos|wildcard|prank|sarcastic|cartoon|humor|comedy'),
('playful_serious',-2,r'serious|truth|death|die|fear|risk|responsible'),
('competitive_cooperative',3,r'win|competi|famous|best|greatest|admired|envy|success'),
('competitive_cooperative',-2,r'help|together|team|cooperat|everybody eats'),
('curious_decisive',3,r'mystery|question|secret|investigat|learn|discover|future|curios|why'),
('curious_decisive',-2,r'never|immediately|already know|straight|no questions'),
('private_open',3,r'private|secret|quiet|nobody|unread|hide|without anyone|alone'),
('private_open',-3,r'public|share|everyone knows|group chat|national|published|openly'),
('patient_urgent',3,r'wait|patient|long|forever|take my time'),
('patient_urgent',-3,r'now|immediately|hurry|slow walker|never waiting|interrupt|urgently'),
('ambitious_content',3,r'win|achiev|success|famous|invention|career|million|ambiti|greatest'),
('ambitious_content',-2,r'peace|rest|sleep|comfortable|quiet|enough'),
('accountability_defensiveness',3,r'admit|accountab|responsib|own my mistake|apolog'),
('accountability_defensiveness',-2,r'excuse|explain|blame|prove|defend|pretend'),
('reflective_reactive',3,r'consider|think|reflect|realiz|learn|question|understand|replay'),
('reflective_reactive',-3,r'anger|rage|immediately|impuls|snap|revenge'),
('self_secure_reassurance',3,r'i know|independent|without anyone|peace|comfortable'),
('self_secure_reassurance',-3,r'liked|wanted|attention|admired|envy|compare|reassur'),
('boundary_holding_approval_seeking',3,r'no|boundar|walk away|refuse|welded shut|stop|leave'),
('boundary_holding_approval_seeking',-2,r'please|approval|liked|wanted|admired|envy'),
('vulnerable_armored',3,r'admit|truth|love|feelings|afraid|honest|least loved'),
('vulnerable_armored',-2,r'pretend|hide|silent|unbothered|armor|secret'),
('repair_punishing',3,r'apolog|fix|repair|second chance|forgive|work it out'),
('repair_punishing',-3,r'revenge|punish|betray|payback|win the breakup'),
('tactful_blunt',3,r'careful|quiet|tact|peace|wait'),
('tactful_blunt',-3,r'tell the truth|confront|say it|unfiltered|correct|straight'),
('duty_first_self_preserving',3,r'family|responsib|help|work|show up|loyal'),
('duty_first_self_preserving',-3,r'peace|rest|sleep|myself|alone|escape'),
('supportive_challenging',3,r'help|support|safe|protect|friend|care'),
('supportive_challenging',-2,r'challenge|correct|push|critic|standards'),
('gives_freely_keeps_score',3,r'give|help|share|fund|support'),
('gives_freely_keeps_score',-3,r'keep score|receipt|owe|return every|give back'),
('perspective_taking_self_referencing',3,r'understand|their|other people|how they feel|friend'),
('perspective_taking_self_referencing',-2,r'myself|my |me |i want|i need|i love'),
('initiating_responsive',3,r'first move|start|initiat|tell|call|confront|make a plan'),
('initiating_responsive',-2,r'wait|respond|reply|unread|follow|let them')
]
# Stopwords do not become "evidence": only explicit, answer-grounded lexical matches count.
def mapping(ans):
 s=ans.lower();out={}
 for dim,score,pat in rule_specs:
  m=re.search(r'\b(?:'+pat+r')\b',s,re.I)
  if not m:continue
  # prioritize stronger explicit evidence; do not award both poles on the same dimension
  if dim not in out or abs(score)>abs(out[dim][0]):out[dim]=(score,m.group(0))
 return [(dim,score,ev) for dim,(score,ev) in out.items()]
manual_mappings=json.loads((D/'DAILY_HAND_REVIEWED_MAPPING_EXAMPLES_2026-10-20.json').read_text())
# Bespoke editorial reads supersede mechanical draft reads, but never owner-approved reveals.
custom_reads={}
for path in sorted(D.glob('DAILY_CUSTOM_REVEALS_*_2026-10-20.json')):
 custom_reads.update(json.loads(path.read_text()))
# Draft reads are NOT represented as recovered copy or approved copy.
# Build distinct titles from answer-specific text, and give a short interpretation, with clear proposal label.
def draft_read(q,ans,letter):
 if ' | ' in ans:
  left,right=ans.split(' | ',1)
  return left.split(':')[-1].strip()+': The Casting Decision.',right
 if ' — ' in ans:
  return 'The '+ans.split(' — ')[0].strip()+' Exit.',"Apparently, your soundtrack is doing the talking your patience has officially stopped doing."
 # Concise title based on exact answer rather than a generic numbered result.
 s=ans.strip().strip('.!?')
 words=re.sub(r'[^A-Za-z0-9 \'-]','',s).split()
 keep=[w for w in words if w.lower() not in {'i','a','an','the','my','your','you','they','we','to','of','and','in','for','is','with','who','that','it','but','have','has','do','one','be','every','someone','somebody','what','when','their','me'}]
 if not keep:keep=words
 head=' '.join(keep[:4]).strip().title()
 if len(head)>44:head=head[:44].rsplit(' ',1)[0]
 title=head+'.'
 m=mapping(ans)
 if m:
  dim,score,ev=m[0]
  # Explain only the strongest evidence actually found, rather than inventing a trait from the question.
  pole='lean into' if score>0 else 'lean away from'
  trait=dim.replace('_',' ').replace('  ',' ')
  body=f"That {ev.lower()} detail is doing the talking. You {pole} the {trait} instinct, and apparently you weren't trying to be subtle."
 else:
  body=f"You picked {ans.rstrip('.')} and committed to it. Apparently, this is the hill you're willing to stand on."
 return title,body
# Build the owner-review artifact with full answer copy, reveal draft, and every evidence signal.
lines=[
'# APPARENTLY YOU | COMPLETE DAILY ONE-PASS EDITORIAL WORKBOOK',
'',
'**Date:** 2026-10-20. **Status:** EDITORIAL WORKING DRAFT, NOT OWNER-APPROVED RELEASE COPY.',
'',
'## Read this before approving',
'- All **90 original question slots** are included, including explicitly CUT archival entries. Surviving questions show every answer choice and a reveal and mapping field together.',
'- **Batch 1:** 30 original answer sets were freeze-frame transcribed from the owner recording. Five character questions are replaced by the separately owner-approved character revisions. These are original pre-revision copies unless marked owner-approved.',
'- **Batch 2:** Original answer choices were **not present** in the video or saved review records. Newly authored proposals are clearly labeled **NEW FORGE PROPOSAL, NOT RECOVERED**. They must not be misrepresented as the originals.',
'- **Batch 3:** Original answers are from the saved full-copy editorial file, with subsequent owner-approved cuts and changes applied.',
'- **Reveals:** Free #30, #31, and #34 owner-approved reads are copied verbatim from approval records. Every other read is a **NEW UNAPPROVED FIRST-PASS DRAFT**. Review for voice and accuracy; these drafts are not automatically publication-ready.',
'- **Mappings:** Proposed evidence only. Each listed mapping uses a canonical dimension ID, a signed point value (positive or negative pole, magnitude 1–3), and the answer phrase used as evidence. **There is no fixed number of mapped dimensions per answer**. Blank mapping means no confident signal was inferred, not zero personality.',
'- Character/song duplicates and draft quality must be audited before publication. Existing code limitations do not change the owner’s no-cap editorial mapping instruction.',
'- KEEP refers to concept approval only. CUT means do not publish. This file does NOT authorize app, database, scoring, or scheduling changes.',
'',
'## Your one-pass review priorities','1. **Check all Batch 2 answer choices** (Free #15–29, Private #15–29 excluding owner CUTs). Those 27 sets are fresh proposals because the original options were not visible in the recording or saved sources.','2. **Scan the reveal titles and bodies** for voice. Exactly 16 reveals (Free #30, #31, #34) are already owner-approved. Other reads are proposals.','3. **Scan the mapping evidence** for each answer. Three questions have individually reasoned mappings; the remaining mappings are explicitly rough candidates, and zero awards are shown where no confident evidence was found. No fixed trait-count limit applies.','4. **Resolve five character collisions** listed in DAILY_COLLISION_AUDIT_2026-10-20.md. Two conflicts involve only previously owner-approved options, so neither is silently changed.','5. **Flag by Daily ID and answer letter**. All four layers appear together, so no separate approval rounds are needed.','','## Contents','- [Free Dailies](#free-dailies)','- [Apparently Private Dailies](#apparently-private-dailies)','',
]
for kind,heading in [('free','Free Dailies'),('private','Apparently Private Dailies')]:
 lines+=['## '+heading,'']
 for n in range(45):
  k=(kind,n)
  q,opts,source=prompts.get(k,('**SOURCE PROMPT NOT FOUND**',[],'NOT RECOVERED'))
  decision=status.get(k,'UNKNOWN')
  lines += [f'### {kind}:{n:02d} | {decision}',f'**Question:** {q}',f'**Answer provenance:** {source}','']
  if decision=='CUT':
   lines += ['**OWNER CUT. Archived prompt only; not eligible for publication.**','']
   continue
  if not opts:
   lines+=['**NO ANSWERS RECOVERED OR PROPOSED.**','']
   continue
  for l,a in opts:
   ar=approved.get((n,l)) if kind=='free' else None
   title,body=ar if ar else (tuple(custom_reads[f'{kind}:{n}']['ABCDEF'.index(l)]) if f'{kind}:{n}' in custom_reads else draft_read(q,a,l))
   lines += [f'#### {l}. {a}',f'**Reveal title:** {title}',f'**Reveal body:** {body}',f'**Reveal status:** {"EXACT OWNER APPROVAL" if ar else "NEW UNAPPROVED FORGE DRAFT"}']
   hand=f'{kind}:{n}' in manual_mappings
   ms=manual_mappings[f'{kind}:{n}']['ABCDEF'.index(l)] if hand else mapping(a)
   if ms:
    level='HAND-REASONED PROPOSAL' if hand else 'ROUGH LEXICAL CANDIDATES, NEED HUMAN REVIEW'
    lines += [f'**Mapping [{level}, NOT APPROVED]:** '+ '; '.join(f'**{dim} {score:+d}** (reason: {ev})' for dim,score,ev in ms)+'.']
   else:
    lines += ['**Mapping [PROPOSED]:** No defensible pole award identified from this answer alone.']
   lines+=['']
lines+=['## Pre-publication editorial blockers','- Owner must approve all new Batch 2 answer options as replacements, since exact original answers were not recoverable.','- The generated first-pass reveals outside Free #30/#31/#34 need voice polishing before publication.','- Mapping needs substantive editorial review, including polarity, intensity, weak matches, and collisions. No fixed maximum number of traits per answer.','- Run global song/character collision audit against existing live and approved library.','- No production changes were made by this workbook.']
out=D/'DAILY_ONE_PASS_FULL_WORKBOOK_2026-10-20.md'
out.write_text('\n'.join(lines)+'\n')
print('WROTE',out,'bytes',out.stat().st_size,'questions',len(prompts),'active answer options',sum(len(opts) for k,(q,opts,s) in prompts.items() if status.get(k)!='CUT'),'approved reveals',len(approved))
print('BESPOKE READS',len(custom_reads),'QUESTION SETS;',sum(len(v) for v in custom_reads.values()),'REVEALS; FALLBACK QUESTIONS',[(k[0],k[1]) for k in prompts if status.get(k)!='CUT' and f'{k[0]}:{k[1]}' not in custom_reads and not (k[0]=='free' and k[1] in (30,31,34))])
assert len(prompts)==90
assert all(len(v[1])>=2 for k,v in prompts.items() if status.get(k)!='CUT')
