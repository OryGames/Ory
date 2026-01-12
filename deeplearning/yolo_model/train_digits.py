import os
import glob
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import random
from PIL import Image

def augment_image(img_array):
    # Simple manual augmentation using TF/NumPy
    # Rotate
    k = np.random.randint(0, 4)
    img_aug = np.rot90(img_array, k)
    
    # Noise
    noise = np.random.normal(0, 0.05, img_aug.shape)
    img_aug = img_aug + noise
    img_aug = np.clip(img_aug, 0, 1)
    
    return img_aug

def load_data(base_path):
    print("Loading data...")
    # Classes are 2, 3, 4, 5, 6, 7, 8, 9
    class_names = [str(i) for i in range(2, 10)]
    class_map = {name: i for i, name in enumerate(class_names)}
    
    images = []
    labels = []
    
    block_dirs = glob.glob(os.path.join(base_path, 'img_blocks*'))
    
    for d in block_dirs:
        for cls_name in class_names:
            img_path = os.path.join(d, f'{cls_name}.png')
            if os.path.exists(img_path):
                try:
                    img = Image.open(img_path).convert('RGB')
                    img = img.resize((64, 64))
                    img_array = np.array(img).astype('float32') / 255.0
                    
                    # Add original
                    images.append(img_array)
                    labels.append(class_map[cls_name])
                    
                    # Add augmented versions (expand dataset size)
                    for _ in range(5): # Generate 5 variants per image
                         images.append(augment_image(img_array))
                         labels.append(class_map[cls_name])
                         
                except Exception as e:
                    print(f"Error loading {img_path}: {e}")
                    
    print(f"Loaded {len(images)} images (with augmentation).")
    return np.array(images).astype('float32'), np.array(labels), class_names

def create_model(num_classes):
    model = keras.Sequential(name='digit_classifier')
    model.add(keras.layers.InputLayer(input_shape=(64, 64, 3), name='input_1'))
    
    # No augmentation layers in model!
    
    # Layers with explicit names
    model.add(layers.Conv2D(32, kernel_size=(3, 3), activation="relu", name='conv1'))
    model.add(layers.MaxPooling2D(pool_size=(2, 2), name='pool1'))
    model.add(layers.Conv2D(64, kernel_size=(3, 3), activation="relu", name='conv2'))
    model.add(layers.MaxPooling2D(pool_size=(2, 2), name='pool2'))
    model.add(layers.Flatten(name='flatten'))
    model.add(layers.Dropout(0.5, name='dropout'))
    model.add(layers.Dense(num_classes, activation="softmax", name='output'))
    
    return model

def train_and_export():
    dataset_path = '/data/src/Ory/deeplearning/dataset_generator'
    X, y, class_names = load_data(dataset_path)
    
    if len(X) == 0:
        print("No data found!")
        return

    # Convert labels to categorical
    y_cat = keras.utils.to_categorical(y, num_classes=len(class_names))
    
    model = create_model(len(class_names))
    model.compile(loss="categorical_crossentropy", optimizer="adam", metrics=["accuracy"])
    
    print("Starting training...")
    # Train for many epochs because dataset is tiny and augmentation is random
    model.fit(X, y_cat, batch_size=8, epochs=100, verbose=1)
    
    # Save as .h5 (Legacy format) to force simplified structure
    save_path = '/data/src/Ory/deeplearning/yolo_model/digit_classifier.h5'
    model.save(save_path) # Keras 3 supports .h5
    print(f"Saved model to {save_path}")
    
    # Reload from .h5 to ensure we are exporting what was saved
    # This helps strip any Keras-3 specificisms that might confuse TF.js
    model_loaded = keras.models.load_model(save_path)
    
    # Export to TF.js
    import tensorflowjs as tfjs
    output_dir = '/data/src/Ory/deeplearning/yolo_model/web_demo/digit_model_js'
    tfjs.converters.save_keras_model(model_loaded, output_dir)
    print(f"Exported TF.js model to {output_dir}")
    
    # Write class map for JS
    with open(os.path.join(output_dir, 'classes.json'), 'w') as f:
        import json
        json.dump(class_names, f)

if __name__ == "__main__":
    train_and_export()
