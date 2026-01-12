import json
import os

path = "web_demo/digit_model_js/model.json"
print(f"Patching {path}...")

with open(path, 'r') as f:
    data = json.load(f)

# 1. Fix Input Layer batch_shape -> batch_input_shape
layers = data['modelTopology']['model_config']['config']['layers']
if layers[0]['class_name'] == 'InputLayer':
    config = layers[0]['config']
    if 'batch_shape' in config:
        print("Renaming batch_shape to batch_input_shape")
        config['batch_input_shape'] = config.pop('batch_shape')

# 2. Fix Weight Names
# Keras 3 / H5 export often prepends the model name "digit_classifier/" to weights in the manifest,
# but the model topology layers are named "conv1", "conv2" etc.
# We strip the prefix.
for group in data['weightsManifest']:
    for weight in group['weights']:
        old_name = weight['name']
        new_name = old_name.replace('digit_classifier/', '')
        if old_name != new_name:
            print(f"Renaming weight: {old_name} -> {new_name}")
            weight['name'] = new_name

with open(path, 'w') as f:
    json.dump(data, f, indent=2)

print("Patch complete.")
