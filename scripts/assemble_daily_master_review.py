from pathlib import Path
import re, datetime
root=Path('/Users/edna/Documents/Github/apparently/docs')
out=root/'DAILY_MASTER_ONE_PASS_REVIEW_2026-10-19.md'
sources=[root/'DAILY_BATCH1_EDITORIAL_REVIEW_2026-10-19.md',root/'DAILY_BATCH2_EDITORIAL_REVIEW_2026-10-19.md',root/'DAILY_BATCH3_FULL_COPY_AND_EDITORIAL_REVIEW_2026-10-19.md']
records={}
for batch,path in enumerate(sources,1):
    s=path.read_text()
    if batch<3:
        for m in re.finditer(r'^\| (free|private):(\d+) \| (KEEP|REVISE|CUT) \| ([^\n|]+) \|',s,re.M):
            typ,n,status,q=m.groups()
            records[(typ,int(n))]=dict(q=q.strip(),status=status,answers=[],batch=batch)
    else:
        typ=None
        for line in s.splitlines():
            if line=='## Free Daily':typ='free'
            if line=='## Private Daily':typ='private'
            m=re.match(r'^### (free|private):(\d+) \| (KEEP|REVISE|CUT)',line)
            if m:
                typ,n,status=m.groups()
                records[(typ,int(n))]=dict(q='',status=status,answers=[],batch=batch)
                current=records[(typ,int(n))]
            q=re.match(r'^\*\*Question:\*\* (.+)',line)
            if q and typ and 'current' in locals():current['q']=q.group(1)
            a=re.match(r'^([A-F])\. (.+)',line)
            if a and typ and 'current' in locals():current['answers'].append((a.group(1),a.group(2)))
# Owner-approved answer/reveal copy is immutable.
approved={}
for filename in ['DAILY_REVEAL_FREE34_APPROVED_2026-10-19.md','DAILY_REVEAL_FREE31_EDITORIAL_REVIEW_2026-10-19.md','DAILY_REVEAL_FREE30_OPTION_E_FINAL_APPROVAL_2026-10-19.md']:
    s=(root/filename).read_text()
    num=int(re.search(r'FREE(\d+)',filename).group(1))
    for block in re.split(r'(?=^## [A-F]\b)',s,flags=re.M):
        m=re.match(r'## ([A-F])\b',block)
        if not m:continue
        a=m.group(1)
        title=re.search(r'(?:Reveal title|Title):\s*(.+)',block)
        body=re.search(r'(?:Reveal body|Body):\s*(.+)',block)
        if title and body:approved[(num,a)]=(title.group(1).strip(),body.group(1).strip())
# Corrected exact Free 31 and 34 approvals where files use different heading labels.
approved.update({(34,'A'):('Available in Theory.','Your phone works. Your willingness to interact is currently out of service.'),(34,'B'):('Selective Hearing, Premium Edition.','You heard every syllable. You simply declined the invitation.'),(34,'C'):('The Receipt Department.','Forgiveness has been issued. The documentation remains permanently available.'),(34,'D'):("Breaking News: It's You.","Other people are still talking, but apparently your thought has a press conference."),(34,'E'):('Unsolicited Life Coach.','Nobody booked a session, but here you are with a six-step plan.'),(34,'F'):('The Complaint Committee.',"You've identified the problem, held a meeting, and voted against taking action.")})
approved.update({(31,'A'):('The Chewing Tribunal.',"One loud bite and you've mentally filed for divorce. From a person you're not even dating."),(31,'B'):('Joy Has a Sound Limit.','They were having a wonderful time. Unfortunately, you could hear it.'),(31,'C'):('The Grammar Grudge.',"Apparently, they're the grammar police, and you're a repeat offender. Nobody asked them to patrol your sentences."),(31,'D'):('Congratulations, I Guess',"We're all so proud of you. We were proud the first six times you mentioned it, too."),(31,'E'):('Originality Enforcement Officer.','Inspiration is flattering. Watching somebody take credit? Straight to court.')})
approved[(30,'E')]=('The Scab Has Filed a Restraining Order.','Your skin is trying to heal, and you keep showing up to disturb the peace. LEAVE HER ALONE!')
# Explicit owner-approved removal.
for k,a in [(('free',30),'D'),(('free',31),'F')]:
    if k in records:records[k]['answers']=[x for x in records[k]['answers'] if x[0]!=a]
if ('free',39) in records:
    records[('free',39)]['answers']=[(a,("Just because we're related doesn't mean I have to like you." if a=='E' else txt)) for a,txt in records[('free',39)]['answers']]
# Canonical labels for evidence mapping: the model will not invent trait ids.
personality=(root.parent/'src/data/personality.ts').read_text()
pole_labels=re.findall(r"(?:positiveLabel|negativeLabel): '([^']+)'",personality)
# Small, conservative suggested mappings, NOT an arbitrary fixed count.
rules=[
('Planner',r'plan|schedule|early|organized|meeting|prepare'),
('Spontaneous',r'sudden|spontaneous|immediately|first move|impulse'),
('Direct',r'tell|say|correct|confront|honest|admit|apolog'),
('Indirect',r'pretend|avoid|anonymous|secret|quiet|hint|ignore'),
('Vibe checker',r'vibe|suspic|instinct|intent|feel|notice|read'),
('Protective',r'protect|child|family|friend|safe'),
('Adventurous',r'disappear|city|outrage|new|dream|risk'),
('Comfort-seeking',r'comfort|sleep|home|peace|rest|leftover'),
('Independent',r'myself|alone|nobody|independent|without'),
('Collaborative',r'together|friend|people|everyone|help'),
('Control',r'control|guarantee|proof|know|exactly|fix'),
('Let it play out',r'wait|let|hope|eventually'),
('Practical',r'money|cash|bills|work|income|bank'),
('Idealistic',r'dream|world|future|extraordinary'),
('Sentimental',r'love|memory|remember|miss|friend'),
('Thick-skinned',r'wrong|insult|judge|humiliat'),
('Rule-oriented',r'illegal|rule|return|correct'),
('Rule-bending',r'keep a little|take it|lie|break|steal'),
('Conflict-forward',r'fight|argue|confront|correct|louder'),
('Peacekeeping',r'peace|let them|pretend|forgive'),
('Trust first',r'trust|believe|friend'),
('Verify first',r'proof|look up|count|check|receipts'),
('Forgiving',r'forgive|apology|apologize'),
('Holds the Receipt',r'receipts|keep score|wronged|betray|resent'),
('Playful',r'laugh|ridiculous|funny|joke|cartoon'),
('Serious',r'truth|fear|die|death|regret'),
('Competitive',r'win|better|envy|ranking|succeed'),
('Cooperative',r'help|support|together|friend'),
('Curious',r'why|discover|find out|question|investigat'),
('Decisive',r'immediately|first|never|straight'),
('Private',r'secret|anonymous|nobody|hidden|private'),
('Open',r'tell|share|speak|projected'),
('Patient',r'wait|let them|finish'),
('Urgent',r'first|immediately|speed|louder'),
('Ambitious',r'career|success|win|dream|capable'),
('Content',r'peace|happy|enough'),
('Accountability',r'wrong|admit|apology|responsib'),
('Defensiveness',r'explain|blame|prove|defend'),
('Reflective',r'realiz|think|question|regret|why'),
('Reactive',r'angry|rage|louder|fight|jealous'),
('Self-secure',r'without|nobody|independent'),
('Reassurance-seeking',r'approval|envy|attractive|replace'),
('Boundary-holding',r'no|stop|leave|never'),
('Approval-seeking',r'please people|approval|admire|envy'),
('Vulnerable',r'admit|love|afraid|fear|apolog'),
('Armored',r'pretend|secret|avoid|never'),
('Repair-oriented',r'forgive|apology|apologize|return'),
('Punishing',r'revenge|wronged|betray|punish'),
('Tactful',r'quiet|pretend|careful'),
('Blunt',r'tell|correct|say|truth'),
('Duty-first',r'child|family|responsib|work'),
('Self-preserving',r'myself|escape|peace|disappear'),
('Supportive',r'help|fund|friend|support'),
('Challenging',r'correct|confront|prove|challenge'),
('Gives freely',r'give|fund|help|return'),
('Keeps score',r'keep score|owe|receipt|envy'),
('Perspective-taking',r'understand|their|someone|people'),
('Self-referencing',r'my|me|myself'),
('Initiating',r'first|start|send|do'),
('Responsive',r'wait|respond|answer')]
lines=['# Apparently You | Dailies One-Pass Master Review','',f'Assembled: 2026-10-19 | Source: existing Mac editorial records | {len(records)} indexed questions','',
'**IMPORTANT:** This is a source-grounded working compilation, NOT a fully written/approved 90-question release package. Batches 1–2 source review files preserve prompts but not answer copy. Those answers and reveals are NOT invented as if approved. Generated mappings are rough candidates requiring editorial review; none are locked.','',
'## How to review','Scan by Free/Private ID. KEEP/REVISE/CUT refers to the prior question-concept decision only. An answer reveal is marked OWNER APPROVED only where separately confirmed. All mapping candidates are unapproved. The application currently enforces a three-effect ceiling; this file does not impose that ceiling.','',
'## Coverage','- Batch 1 and 2: 60 prompts from saved editorial records, original answer text missing from these records; needs source recovery before complete one-pass review.','- Batch 3: 30 prompts with answer text (subject to approved cuts and replacements).','- Previously approved reveals are copied exactly when independently verified. Other reveals are **NOT YET DRAFTED** rather than filled with low-quality placeholders.','',
'## FREE DAILY','']
for typ in ('free','private'):
    if typ=='private':lines+=['','## APPARENTLY PRIVATE DAILY','']
    for n in range(45):
        r=records.get((typ,n))
        if not r:
            lines += [f'### {typ}:{n:02d} | SOURCE NOT FOUND','Question, answers, reveals, and mapping: NEED SOURCE RECOVERY.','']
            continue
        lines += [f'### {typ}:{n:02d} | {r["status"]} concept | Batch {r["batch"]}',f'**Question:** {r["q"]}','']
        if r['status']=='CUT':
            lines += ['**CUT by owner. Archive only. No publishing or scoring.**','']
            continue
        if not r['answers']:
            lines += ['**Answer choices:** SOURCE RECOVERY REQUIRED. The saved editorial record contains only the question.','**Reveals:** NOT DRAFTED.','**Mapping:** NOT DRAFTED, because source answers are unavailable.','']
            continue
        for letter,answer in r['answers']:
            lines += [f'#### {letter}. {answer}']
            a=approved.get((n,letter)) if typ=='free' else None
            if a:lines += [f'**Reveal [OWNER APPROVED]:** {a[0]} | {a[1]}']
            else:lines += ['**Reveal [TO DRAFT]:** Not yet written or approved.']
            # Candidate signals require clear lexical evidence, not arbitrary slot filling.
            matches=[]
            for label,pat in rules:
                if label in pole_labels and re.search(pat,answer,re.I):
                    matches.append(label)
            # Limit confidence rather than signals: candidates explicitly provisional, may be zero.
            if matches:
                lines += ['**Mapping [ROUGH CANDIDATES, NOT APPROVED]:** '+ '; '.join(f'{x} +1 (keyword-level evidence only)' for x in matches)+'.']
            else:
                lines += ['**Mapping [NEEDS HUMAN EDITORIAL JUDGMENT]:** No reliable evidence inferred from short answer alone.']
            lines += ['']
lines+=['','## Editorial integrity and next steps','1. Recover exact answer sets for batches 1 and 2 from conversation or a verified saved source, never fabricate original copy.','2. Author distinct, high-quality reveal titles and bodies for every remaining answer, then revise proposed mappings with genuine answer-specific reasoning.','3. Validate pole IDs, contradictions, answer-level mapping breadth, and no repeated song/character.','4. Owner scans ONE finished full package and flags exceptions. No production change until separately authorized.']
out.write_text('\n'.join(lines)+'\n')
print('WROTE',out,'LINES',len(lines),'BYTES',out.stat().st_size,'RECORDS',len(records),'WITH ANSWERS',sum(bool(x['answers']) for x in records.values()))
