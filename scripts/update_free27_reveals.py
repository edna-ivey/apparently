from pathlib import Path
import json
p=Path('/Users/edna/Documents/Github/apparently/docs/DAILY_CUSTOM_REVEALS_FREE_BATCH2_PART3_2026-10-20.json')
j=json.loads(p.read_text())
j['free:27'][1]=['The Beet-Farm Lease','Dwight has a chore chart, a bathroom policy, and absolutely no interest in your objections.']
j['free:27'][2]=['The Haunted Deposit','Beetlejuice would turn your apartment into a paranormal insurance claim.']
j['free:27'][3]=['The Cleaning Inspection','Monica would judge your sponge before you even unpacked your boxes.']
p.write_text(json.dumps(j,indent=2,ensure_ascii=False)+'\n')
print('Aligned newly proposed Free27 reveals with collision-free characters')
