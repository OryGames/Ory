import os
import glob
import random
import yaml
from pathlib import Path

def prepare_dataset(base_path):
    print(f"Preparing dataset in {base_path}")
    
    # Paths
    data_dir = os.path.join(base_path, 'data')
    obj_dir = os.path.join(data_dir, 'obj')
    names_file = os.path.join(data_dir, 'obj.names')
    
    # 1. Read class names
    with open(names_file, 'r') as f:
        class_names = [line.strip() for line in f.readlines() if line.strip()]
    
    print(f"Found {len(class_names)} classes: {class_names}")
    
    # 2. Scan for images and labels
    # Supported image extensions
    img_exts = ['.png', '.jpg', '.jpeg']
    
    image_files = []
    for ext in img_exts:
        image_files.extend(glob.glob(os.path.join(obj_dir, f'*{ext}')))
    
    valid_pairs = []
    
    for img_path in image_files:
        p = Path(img_path)
        txt_path = p.with_suffix('.txt')
        
        if txt_path.exists():
            valid_pairs.append(str(p))
        else:
            print(f"Warning: No label file for {p.name}")
            
    print(f"Found {len(valid_pairs)} valid image/label pairs.")
    
    if not valid_pairs:
        raise ValueError("No valid data found!")

    # 3. verify labels are within range
    # check a few random files to ensure class IDs are < len(class_names)
    print("Verifying random samples...")
    for _ in range(min(5, len(valid_pairs))):
        sample_img = random.choice(valid_pairs)
        sample_txt = str(Path(sample_img).with_suffix('.txt'))
        with open(sample_txt, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if not parts: continue
                class_id = int(parts[0])
                if class_id >= len(class_names):
                    print(f"ERROR: Class ID {class_id} found in {sample_txt}, but only {len(class_names)} classes defined!")

    # 4. Split into train/val
    random.shuffle(valid_pairs)
    split_idx = int(len(valid_pairs) * 0.8)
    train_files = valid_pairs[:split_idx]
    val_files = valid_pairs[split_idx:]
    
    print(f"Training set: {len(train_files)} images")
    print(f"Validation set: {len(val_files)} images")
    
    # Write train.txt and val.txt (YOLO expects absolute paths usually, or relative to where command is run)
    # We will use absolute paths to be safe
    with open(os.path.join(data_dir, 'train.txt'), 'w') as f:
        f.write('\n'.join(train_files))
        
    with open(os.path.join(data_dir, 'val.txt'), 'w') as f:
        f.write('\n'.join(val_files))
        
    # 5. Generate dataset.yaml
    # YOLOv8 expects a yaml file pointing to train/val path (dir or txt file list)
    # and names dictionary
    
    dataset_yaml = {
        'path': data_dir, # root
        'train': 'train.txt',
        'val': 'val.txt',
        'names': {i: name for i, name in enumerate(class_names)}
    }
    
    yaml_path = os.path.join(base_path, 'dataset.yaml')
    with open(yaml_path, 'w') as f:
        yaml.dump(dataset_yaml, f, sort_keys=False)
        
    print(f"Generated {yaml_path}")
    return yaml_path

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    prepare_dataset(base_dir)
