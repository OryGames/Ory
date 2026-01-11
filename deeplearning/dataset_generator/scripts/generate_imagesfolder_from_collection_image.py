
import os
import json
import argparse
from PIL import Image

def generate_images_folder(input_file, output_dir, json_file=None, magenta_threshold=100):
    """
    Extracts images from a collection PNG based on embedded metadata or external JSON.
    """
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' does not exist.")
        return

    metadata = None

    # Priority 1: External JSON
    if json_file:
        if os.path.exists(json_file):
            try:
                with open(json_file, 'r') as f:
                    metadata = json.load(f)
                print(f"Loaded metadata from {json_file}")
            except Exception as e:
                print(f"Error loading JSON {json_file}: {e}")
                return
        else:
            print(f"Error: Specified JSON file '{json_file}' not found.")
            return

    try:
        with Image.open(input_file) as img:
            # Priority 2: Embedded Metadata (only if not loaded yet)
            if metadata is None:
                metadata_str = img.info.get("collection_metadata")
                if metadata_str:
                    try:
                        metadata = json.loads(metadata_str)
                        print("Loaded metadata from PNG chunks.")
                    except json.JSONDecodeError as e:
                        print(f"Error parsing PNG metadata: {e}")
                else:
                    print("Warning: No 'collection_metadata' found in PNG.")

            if metadata is None:
                print("Error: No metadata available (neither external JSON nor embedded in PNG).")
                return
            
            # --- Handle Background Removal (Flood Fill) ---
            
            # --- Handle Background Removal (Flood Fill) ---
            # User request: "recorte o fundo" (cut out background)
            # We use floodfill from corner (0,0) to remove the connected background.
            # This is safer than global color replacement and works with the provided margin.
            
            from PIL import ImageDraw
            
            img = img.convert("RGBA")
            
            # Get background color sample from top-right corner
            # User request: "precisa ser no canto superior direito"
            start_point = (img.width - 1, 0)
            bg_sample = img.getpixel(start_point)
            
            print(f"Detected background color: {bg_sample} at {start_point}")
            print(f"Flood filling background from {start_point} with tolerance {magenta_threshold}...")
            
            # Floodfill with transparency (0, 0, 0, 0)
            # 'thresh' parameter determines how similar the color must be to be filled.
            try:
                ImageDraw.floodfill(img, start_point, (0, 0, 0, 0), thresh=magenta_threshold)
            except Exception as e:
                print(f"Warning: Floodfill failed ({e}). Falling back to simple transparency is not implemented.")
            
            # -----------------------------------------

            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
                print(f"Created output directory: {output_dir}")

            print(f"Extracting {len(metadata)} images to {output_dir}...")
            
            img_w, img_h = img.size

            for item in metadata:
                filename = item.get("filename")
                
                # Support both new relative and old absolute for backward compatibility if needed,
                # but let's prioritize relative.
                rel_x = item.get("rel_x")
                rel_y = item.get("rel_y")
                rel_w = item.get("rel_width")
                rel_h = item.get("rel_height")
                
                if all(v is not None for v in [rel_x, rel_y, rel_w, rel_h]):
                    # Calculate absolute
                    x = int(rel_x * img_w)
                    y = int(rel_y * img_h)
                    width = int(rel_w * img_w)
                    height = int(rel_h * img_h)
                else:
                    # Fallback to absolute if relative not present (old format)
                    x = item.get("x")
                    y = item.get("y")
                    width = item.get("width")
                    height = item.get("height")

                if not all([filename, x is not None, y is not None, width, height]):
                    print(f"Skipping invalid metadata item: {item}")
                    continue

                # Crop
                try:
                    crop_box = (x, y, x + width, y + height)
                    cropped_img = img.crop(crop_box)
                    
                    # Resize back to original dimensions if specified and different
                    orig_w = item.get("original_width")
                    orig_h = item.get("original_height")
                    
                    if orig_w and orig_h:
                        if (cropped_img.width != orig_w) or (cropped_img.height != orig_h):
                            # Ensure we don't lose quality if downscaling, or keep quality if upscaling (though upscaling here means we are restoring from a smaller collection processing? unlikely based on user request)
                            # User likely has a HUGE AI upscale and wants to downsample back to original block size.
                            # Resampling.LANCZOS is good for high quality downsampling
                            cropped_img = cropped_img.resize((orig_w, orig_h), Image.Resampling.LANCZOS)

                    # Save
                    output_path = os.path.join(output_dir, filename)
                    cropped_img.save(output_path)
                    
                except Exception as e:
                    print(f"Error extracting {filename}: {e}")

            print("Extraction complete.")

    except Exception as e:
        print(f"Error processing file: {e}")

def main():
    parser = argparse.ArgumentParser(description="Unpack collection PNG into a directory of images.")
    parser.add_argument("--input", "-i", required=True, help="Input collection PNG file.")
    parser.add_argument("--output", "-o", default="restored_img_blocks", help="Output directory.")
    parser.add_argument("--json", "-j", help="Optional external JSON metadata file. Required if PNG does not contain metadata.")
    parser.add_argument("--magenta-threshold", "-t", type=int, default=100, help="Threshold for magenta transparency (0-255). Default 100.")
    
    args = parser.parse_args()
    
    generate_images_folder(args.input, args.output, args.json, args.magenta_threshold)

if __name__ == "__main__":
    main()
