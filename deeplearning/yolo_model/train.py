from ultralytics import YOLO
import sys

def train_model(epochs=100):
    # Load a model
    model = YOLO("yolov8n.yaml")  # build a new model from scratch
    model = YOLO("yolov8n.pt")  # load a pretrained model (recommended for training)

    # Train the model
    results = model.train(data="dataset.yaml", epochs=epochs, imgsz=640, patience=100, degrees=10.0, shear=5.0, perspective=0.0003, fliplr=0.0, scale=0.7)
    
    # Evaluate performance
    metrics = model.val()
    print(metrics)
    
    # Export the model
    success = model.export(format="tfjs")
    print(f"Export successful: {success}")

if __name__ == "__main__":
    # Allow passing epochs as arg
    epochs = 3000
    if len(sys.argv) > 1:
        epochs = int(sys.argv[1])
        
    train_model(epochs)
