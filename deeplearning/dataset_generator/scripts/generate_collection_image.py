
import os
import json
import math
import argparse
from PIL import Image
from PIL.PngImagePlugin import PngInfo

def generate_collection(input_dir, output_file):
    """
    Generates a single collection image from all images in the input_dir.
    Embeds metadata about individual images into the PNG file.
    """
    if not os.path.exists(input_dir):
        print(f"Error: Input directory '{input_dir}' does not exist.")
        return

    images_data = []
    max_width = 0
    max_height = 0
    
    # specific to Ory img_blocks
    valid_extensions = {".png", ".jpg", ".jpeg", ".bmp"}

    file_list = sorted([f for f in os.listdir(input_dir) if os.path.splitext(f)[1].lower() in valid_extensions])

    if not file_list:
        print(f"No valid images found in '{input_dir}'.")
        return

    # Load all images to determine sizes
    for filename in file_list:
        file_path = os.path.join(input_dir, filename)
        try:
            with Image.open(file_path) as img:
                # We need to keep the image data or path. 
                # Since we want to paste them, let's keep the path and size.
                # If images are small, we could force RGBA
                w, h = img.size
                images_data.append({
                    "filename": filename,
                    "path": file_path,
                    "width": w,
                    "height": h
                })
                max_width = max(max_width, w)
                max_height = max(max_height, h)
        except Exception as e:
            print(f"Warning: Could not open {filename}: {e}")

    if not images_data:
        print("No processable images found.")
        return

    # Simple layout strategy: Square-ish grid
    total_images = len(images_data)
    grid_cols = math.ceil(math.sqrt(total_images))
    grid_rows = math.ceil(total_images / grid_cols)

    # Calculate canvas size
    # We add a small padding between images just in case, though not strictly necessary if coordinates are exact.
    padding = 2
    margin = 30
    
    # We need to compute exact positions. 
    # To keep it simple, let's just use the max dimensions for the cell size, 
    # but we can pack them tighter if we wanted. 
    # For now, uniform grid cell size based on max dimensions is safest and easiest implementation.
    cell_width = max_width + padding
    cell_height = max_height + padding
    
    canvas_width = grid_cols * cell_width + padding + (2 * margin)
    canvas_height = grid_rows * cell_height + padding + (2 * margin)

    print(f"Creating collection image: {canvas_width}x{canvas_height} for {total_images} images.")

    # Create Transparent Canvas
    collection_img = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))

    metadata = []

    for idx, img_info in enumerate(images_data):
        col = idx % grid_cols
        row = idx // grid_cols
        
        x = margin + col * cell_width + padding
        y = margin + row * cell_height + padding
        
        # Open and paste
        with Image.open(img_info["path"]) as src_img:
            # Maintain original mode if possible, but convert to RGBA for consistency on the canvas
            src_img_rgba = src_img.convert("RGBA")
            collection_img.paste(src_img_rgba, (x, y))
        
        # Store relative coordinates (0.0 - 1.0)
        metadata.append({
            "filename": img_info["filename"],
            "rel_x": x / canvas_width,
            "rel_y": y / canvas_height,
            "rel_width": img_info["width"] / canvas_width,
            "rel_height": img_info["height"] / canvas_height,
            "original_width": img_info["width"],
            "original_height": img_info["height"]
        })

    # Prepare Metadata
    metadata_json = json.dumps(metadata, indent=4)
    
    target_info = PngInfo()
    target_info.add_text("collection_metadata", metadata_json)

    # Save Image
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    collection_img.save(output_file, "PNG", pnginfo=target_info)
    
    # Save External JSON
    json_path = os.path.splitext(output_file)[0] + ".json"
    with open(json_path, 'w') as f:
        f.write(metadata_json)
        
    print(f"Successfully saved collection to {output_file}")
    print(f"Successfully saved metadata to {json_path}")


def main():
    parser = argparse.ArgumentParser(description="Pack directory of images into a single collection PNG.")
    parser.add_argument("--input", "-i", default="../img_blocks", help="Input directory containing images.")
    parser.add_argument("--output", "-o", default="collection.png", help="Output PNG file.")
    
    args = parser.parse_args()
    
    # Resolve paths relative to script location if called directly, or cwd
    # If the user runs python scripts/generate... from root, relative paths might be tricky.
    # Let's trust the user's input path or default relative to CWD.
    
    generate_collection(args.input, args.output)

if __name__ == "__main__":
    main()
