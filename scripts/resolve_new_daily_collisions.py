from pathlib import Path
import json
p=Path('/Users/edna/Documents/Github/apparently/docs/DAILY_BATCH2_NEW_ANSWER_PROPOSALS_2026-10-20.json')
j=json.loads(p.read_text())
old=j['free']['27']
assert 'Regina George' in old[1] and 'The Joker' in old[2] and 'Miranda Priestly' in old[3],old
j['free']['27'][1]='Dwight Schrute - The Office: He would schedule mandatory beet-farming chores.'
j['free']['27'][2]='Beetlejuice - Beetlejuice: Your apartment would become a supernatural hazard.'
j['free']['27'][3]='Monica Geller - Friends: She would inspect your cleaning technique.'
p.write_text(json.dumps(j,indent=2,ensure_ascii=False)+'\n')
print('Resolved three collisions involving NEW, unapproved Batch 2 options. Preserved owner-approved character revisions.')
