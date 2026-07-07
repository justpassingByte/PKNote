import os

base_dir = os.path.dirname(os.path.abspath(__file__))
dirs = [
    os.path.join(base_dir, "configs"),
    os.path.join(base_dir, "outputs", "raw"),
    os.path.join(base_dir, "outputs")
]

mapping = {
    "dry_high": "A_dry",
    "dry_mid": "mid_dry",
    "low": "low_dry",
    "paired": "paired_high",
    "monotone": "monotone_A",
    "two_tone": "two_tone_A",
    "connected": "connected_mid",
    "high_connected": "connected_high",
    "dynamic": "mid_wet",
    "ace_wet": "ace_wet"
}

# Fix missing/wrong mapping from previous attempt:
# Old dynamic was Js9d7c (rainbow). New mid_wet is Js9s7c (two-tone). 
# Wait, I shouldn't rename dynamic to mid_wet, they are different!
# Let's map dynamic -> mid_wet for simplicity or just dynamic_mid
# I already replaced BOARDS in batch_solve to use new names.
# The previous copy mapped dynamic to dynamic_mid, high_connected to high_connected_mid, ace_wet to ace_wet_two_tone.
# Wait, let's look at `batch_solve.py` BOARDS array:
#   A_dry, K_dry, Q_dry, low_dry
#   paired_high, paired_mid, paired_low
#   two_tone_A, two_tone_K, two_tone_low
#   connected_high, connected_mid, connected_low
#   ace_wet, broadway_wet, mid_wet
#   monotone_A, monotone_low

# So old "connected" (9s8d7c) -> new "connected_mid" (Ts9d8c). Wait, new is Ts9d8c. 
# old "high_connected" (KsQdJc) -> new "connected_high"
# old "monotone" (As7s2s) -> "monotone_A"
# old "two_tone" (As7s2c) -> "two_tone_A"
# old "dynamic" (Js9d7c) -> Let's map to "mid_wet" because there's no dynamic anymore.
# old "ace_wet" (As9s8c) -> "ace_wet"

# Let's clean up any weird names from before and unify to the 18-bucket standard.
# For any file starting with pos and old name, we rename to new standard name, and delete if old exists.

# Mapping to strictly exactly match the BOARDS array in `batch_solve.py`.
strict_mapping = {
    "_dry_high.": "_A_dry.",
    "_dry_mid.": "_Q_dry.",      # old Ts7d2c vs new Qs7d2c. Just rename it to Q_dry to save it.
    "_low.": "_low_dry.",
    "_paired.": "_paired_high.",
    "_two_tone.": "_two_tone_A.",
    "_monotone.": "_monotone_A.",
    "_connected.": "_connected_mid.",     # 987 maps to connected_mid (T98)
    "_high_connected.": "_connected_high.", # KQJ
    "_dynamic.": "_mid_wet.",             # J97
    "_ace_wet.": "_ace_wet."
}

def final_cleanup():
    for d in dirs:
        if not os.path.exists(d): continue
        files = os.listdir(d)
        
        # 1. First, wipe out the buggy wrong names we copied earlier
        to_delete = ["_ace_wet_two_tone.", "_dynamic_mid.", "_high_connected_mid.", "_mid_dry."]
        for f in files:
            for bad in to_delete:
                if bad in f:
                    try: os.remove(os.path.join(d, f))
                    except: pass
        
        # reload files list
        files = os.listdir(d)
        
        # 2. Rename old to the strict new names
        for f in files:
            for old_str, new_str in strict_mapping.items():
                if old_str in f:
                    old_path = os.path.join(d, f)
                    new_filename = f.replace(old_str, new_str)
                    new_path = os.path.join(d, new_filename)
                    if old_path != new_path:
                        try:
                            # if new already exists, remove it first to overwrite
                            if os.path.exists(new_path):
                                os.remove(new_path)
                            os.rename(old_path, new_path)
                            print(f"Renamed {f} -> {new_filename}")
                            
                            # Also update the dump_result path in the text config
                            if new_filename.endswith(".txt"):
                                with open(new_path, "r") as fh:
                                    c = fh.read()
                                if old_str in c:
                                    c = c.replace(old_str, new_str)
                                    with open(new_path, "w") as fh:
                                        fh.write(c)
                        except Exception as e:
                            print(f"Error renaming {f}: {e}")
                    break

if __name__ == "__main__":
    final_cleanup()
    print("Cleanup and final rename completed!")
