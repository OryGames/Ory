from ultralytics import YOLO
import os

def export_model():
    # Path to the best model from the training run
    # We assume 'runs/detect/train/weights/best.pt' exists
    # If multiple runs occurred, it might be train2, train3, etc.
    # We'll try to find the latest run.
    
    runs_dir = '/data/src/Ory/runs/detect'
    if not os.path.exists(runs_dir):
        print(f"Error: {runs_dir} does not exist.")
        return

    # Find the latest 'train' directory
    train_dirs = [d for d in os.listdir(runs_dir) if d.startswith('train')]
    train_dirs.sort(key=lambda x: os.path.getmtime(os.path.join(runs_dir, x)), reverse=True)
    
    if not train_dirs:
        print("Error: No training run found.")
        return
        
    latest_train_dir = os.path.join(runs_dir, train_dirs[0])
    weights_path = os.path.join(latest_train_dir, 'weights', 'best.pt')
    
    if not os.path.exists(weights_path):
        print(f"Error: Weights not found at {weights_path}")
        return
        
    print(f"Exporting model from {weights_path}...")
    
    model = YOLO(weights_path)
    success = model.export(format="tfjs")
    print(f"Export successful: {success}")

if __name__ == "__main__":
    export_model()
