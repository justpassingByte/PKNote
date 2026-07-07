import os
import glob
import json

def clean_dict(d):
    cleaned = {}
    for k, v in d.items():
        if v < 0.05:
            cleaned[k] = 0.0
        elif v > 0.95:
            cleaned[k] = 1.0
        else:
            cleaned[k] = round(v, 4)
            
    total = sum(cleaned.values())
    if total > 0:
        return {k: round(v/total, 4) for k, v in cleaned.items()}
    else:
        return {"check": 1.0, "bet_small": 0.0, "bet_big": 0.0}

def fix_file(path):
    with open(path, "r") as f:
        try:
            data = json.load(f)
        except:
            return
            
    # fix strategy overall
    for player in ["oop", "ip"]:
        if player in data.get("strategy", {}):
            data["strategy"][player] = clean_dict(data["strategy"][player])
            
    # fix per_hand
    for player in ["oop", "ip"]:
        if player in data.get("per_hand", {}):
            for hand, freqs in data["per_hand"][player].items():
                data["per_hand"][player][hand] = clean_dict(freqs)
                
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def main():
    base = r"c:\Users\Admin\Desktop\projects\PoNotes\gto_pipeline\outputs"
    count = 0
    
    # find all json files in outputs, outputs/turn, outputs/river
    patterns = [
        os.path.join(base, "*.json"),
        os.path.join(base, "turn", "*.json"),
        os.path.join(base, "river", "*.json")
    ]
    
    for pat in patterns:
        for p in glob.glob(pat):
            fix_file(p)
            count += 1
            
    print(f"Fixed garbage decimals in {count} files!")

if __name__ == "__main__":
    main()
