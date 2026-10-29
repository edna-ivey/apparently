from pathlib import Path
import re
p=Path('/Users/edna/Documents/Github/apparently/docs/DAILY_ONE_PASS_FULL_WORKBOOK_2026-10-20.md')
s=p.read_text()
blocks=re.findall(r'^### (free|private):(\d+) \| (KEEP|REVISE|CUT)\n(.*?)(?=^### |^## Pre-publication|\Z)',s,re.M|re.S)
assert len(blocks)==90, len(blocks)
assert len({(k,int(n)) for k,n,_,_ in blocks})==90
cuts=[];total=0;approved=0
for k,n,status,body in blocks:
 opts=re.findall(r'^#### ([A-F])\. (.+)$',body,re.M)
 if status=='CUT':
  cuts.append(f'{k}:{n}')
  assert not opts,(k,n,'cut has active answers')
  continue
 assert len(opts) in (2,5,6),(k,n,len(opts))
 assert len({letter for letter,_ in opts})==len(opts),(k,n,'duplicate option letter')
 assert body.count('**Reveal title:**')==len(opts),(k,n,'missing reveal title')
 assert body.count('**Reveal body:**')==len(opts),(k,n,'missing reveal body')
 assert body.count('**Mapping [')==len(opts),(k,n,'missing mapping field')
 total+=len(opts)
 approved+=body.count('**Reveal status:** EXACT OWNER APPROVAL')
assert total==428,total
assert approved==16,approved
assert len(cuts)==5,cuts
print('PASS 90 slots,',len(cuts),'cut questions,',total,'active answers,',approved,'owner-approved reveals; all active answers have reveal and mapping fields')
