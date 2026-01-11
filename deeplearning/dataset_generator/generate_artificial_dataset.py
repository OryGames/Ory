from PIL import Image
import re
import random
import copy
import os
from datetime import datetime

def proc_txt_file(input_file):
    filetxt= open(input_file,'r')
    _blocks=[]
    _last={}
    print("Loading blocks:\n")
    i=0
    for line in filetxt:
        i+=1
        print("#"+str(i)+" - "+line)
        blockvalues=line.replace("\n","").split('=')[1].split(',')
        block={}
        block['name']=line.replace("\n","").split('=')[0]
        if block['name'].find('~[')>=0:
            arra=eval(block['name'][1:len(block['name'])])
            block['name']=arra[random.randint(0,len(arra)-1)]

        idx=0
        for t in blockvalues:
            _blockValue=t
            _values = re.findall(r'\(.*?\)',_blockValue)
            for _v in _values:
                if _v.find("~")>0:
                    strValue=_v[1:len(_v)-1]
                    _newValue=random.randint(int(strValue.split('~')[0]),int(strValue.split('~')[1]))
                    _blockValue=_blockValue.replace(strValue,str(_newValue))
            if idx==0:
                block['x']=eval(_blockValue,{"last":_last})
            if idx==1:
                block['y']=eval(_blockValue,{"last":_last})
            if idx==2:
                block['direction']=_blockValue
                if _blockValue=='random':
                    varr=['left','right','down','up']
                    block['direction']=varr[random.randint(0,3)]
            if idx==3:
                block['steps']=eval(_blockValue)
            
            idx+=1

                
        _blocks.append(block)
        _last=copy.deepcopy(block)
    return _blocks

def solve_system(matrix, result_vector):
    """
    Solves a system of linear equations Ax = B using Gaussian elimination.
    matrix: list of lists (A)
    result_vector: list (B)
    returns: list (x)
    """
    n = len(matrix)
    # Combine matrix and result_vector into an augmented matrix
    M = [row[:] + [result_vector[i]] for i, row in enumerate(matrix)]

    # Forward elimination
    for i in range(n):
        # Pivot
        pivot = M[i][i]
        if abs(pivot) < 1e-10:
            # Swap with a row below having non-zero pivot
            for k in range(i + 1, n):
                if abs(M[k][i]) > 1e-10:
                    M[i], M[k] = M[k], M[i]
                    pivot = M[i][i]
                    break
            else:
                raise ValueError("Singular matrix")

        # Normalize pivot row
        for j in range(i, n + 1):
            M[i][j] /= pivot

        # Eliminate entries below
        for k in range(i + 1, n):
            factor = M[k][i]
            for j in range(i, n + 1):
                M[k][j] -= factor * M[i][j]

    # Backward substitution
    x = [0] * n
    for i in range(n - 1, -1, -1):
        sum_ax = sum(M[i][j] * x[j] for j in range(i + 1, n))
        x[i] = M[i][n] - sum_ax

    return x

def find_coeffs(source_coords, target_coords):
    matrix = []
    # coefficients mapping source to target
    # x_dest = (a*x_src + b*y_src + c) / (g*x_src + h*y_src + 1)
    # y_dest = (d*x_src + e*y_src + f) / (g*x_src + h*y_src + 1)
    #
    # a*x_src + b*y_src + c - g*x_src*x_dest - h*y_src*x_dest = x_dest
    # d*x_src + e*y_src + f - g*x_src*y_dest - h*y_src*y_dest = y_dest
    
    # We want 8 coefficients: a, b, c, d, e, f, g, h
    
    b_vec = []
    
    for s, t in zip(source_coords, target_coords):
        # Equation for x
        # [x, y, 1, 0, 0, 0, -x*X, -y*X] * [coeffs] = X
        matrix.append([s[0], s[1], 1, 0, 0, 0, -s[0]*t[0], -s[1]*t[0]])
        b_vec.append(t[0])
        
        # Equation for y
        # [0, 0, 0, x, y, 1, -x*Y, -y*Y] * [coeffs] = Y
        matrix.append([0, 0, 0, s[0], s[1], 1, -s[0]*t[1], -s[1]*t[1]])
        b_vec.append(t[1])
        
    return solve_system(matrix, b_vec)

def transform_point(point, coeffs):
    """
    Transforms a point (x, y) using the perspective coefficients.
    """
    a, b, c, d, e, f, g, h = coeffs
    
    x, y = point
    denominator = g * x + h * y + 1
    if abs(denominator) < 1e-10: return x, y 
    
    new_x = (a * x + b * y + c) / denominator
    new_y = (d * x + e * y + f) / denominator
    return new_x, new_y

def generate_img_blocks(blocks,backGroundImageFile,OutputImageFile,OutputYoloFile, blocks_dir="img_blocks"):
    base_image = Image.open(backGroundImageFile).convert("RGBA")
    width, height = base_image.size
    
    # Create the transparent layer for blocks
    blocks_layer = Image.new('RGBA', (width, height), (0,0,0,0))
    
    blck_perc=550/width
    
    dicObj={}
    dicObj['numero']=0
    dicObj['andar']=1
    dicObj['circulo']=2
    dicObj['inicio']=3
    dicObj['looping']=4
    dicObj['pegar']=5
    dicObj['pular']=6
    dicObj['seta']=7
    dicObj['triangulo']=8
    dicObj['zzz']=9

    # Store objects to annotate: {'class_id': int, 'rect': [x, y, w, h]}
    # We will process/draw them all first on the transparent layer
    objects_to_transform = [] 

    # First pass: Check for bounds validity (Logic same as before)
    # We can reuse the loop or integrate it. 
    # For cleaner code, let's just do one pass to DRAW and COLLECT BBOXes.
    # If any fail bounds, we abort.
    
    # We need to buffer the draw operations because if one fails we must abort the whole image
    # But since we are writing to a temp blocks_layer, we can just return early and discard it.
    
    for b in blocks:
        blck_image_path=os.path.join(blocks_dir, b['name']+'.png')
        blckInicio = Image.open(blck_image_path)
        newwidth=round(blckInicio.size[0]*blck_perc)
        newheight=round(blckInicio.size[1]*blck_perc)
        
        # Check block bounds
        if b['x'] < 0 or b['y'] < 0 or (b['x'] + newwidth) > width or (b['y'] + newheight) > height:
            #print(f"Skipping image: Block {b['name']} out of bounds at ({b['x']}, {b['y']})")
            return

        blckInicio=blckInicio.resize((newwidth,newheight),Image.LANCZOS)
        blocks_layer.paste(blckInicio, (b['x'],b['y']), mask=blckInicio)
        
        objects_to_transform.append({
            'class': dicObj[b['name']],
            'rect': (b['x'], b['y'], newwidth, newheight)
        })

        if 'direction' in b and (b['name']=='andar' or b['name']=='pegar' or b['name']=='pular'):
            blckArrow = Image.open(os.path.join(blocks_dir, 'seta.png'))
            bnewwidth=round(blckArrow.size[0]*blck_perc)
            bnewheight=round(blckArrow.size[1]*blck_perc)
            
            arrowX=b['x']+64+(random.randint(-3,3))
            arrowY=b['y']+(random.randint(-3,3))
            
            if arrowX < 0 or arrowY < 0 or (arrowX + bnewwidth) > width or (arrowY + bnewheight) > height:
                return

            blckArrow=blckArrow.resize((bnewwidth,bnewheight),Image.LANCZOS)
            if b['direction']=='up':
                blckArrow=blckArrow.rotate(45*-1,expand=True,resample=Image.BICUBIC)
            if b['direction']=='down':
                blckArrow=blckArrow.rotate(45*3,expand=True,resample=Image.BICUBIC)
            if b['direction']=='left':
                blckArrow=blckArrow.rotate(45*1,expand=True,resample=Image.BICUBIC)
            if b['direction']=='right':
                blckArrow=blckArrow.rotate(45*5,expand=True,resample=Image.BICUBIC)
            
            blocks_layer.paste(blckArrow,  (arrowX,arrowY), mask=blckArrow)
            objects_to_transform.append({
                'class': dicObj['seta'],
                'rect': (arrowX, arrowY, blckArrow.size[0], blckArrow.size[1])
            })

        if 'steps' in b:
            if b['steps']>1 and b['steps']<10:
                blckMove = Image.open(os.path.join(blocks_dir, str(b['steps'])+'.png'))
                newwidth_move=round(blckMove.size[0]*blck_perc)
                newheight_move=round(blckMove.size[1]*blck_perc)
                stepX=b['x']+128-30+(random.randint(-3,3))
                stepY=b['y']+random.randint(-3,3)
                
                if stepX < 0 or stepY < 0 or (stepX + newwidth_move) > width or (stepY + newheight_move) > height:
                    return

                blckMove=blckMove.resize((newwidth_move,newheight_move),Image.LANCZOS)
                blocks_layer.paste(blckMove, (stepX,stepY), mask=blckMove)
                objects_to_transform.append({
                    'class': dicObj['numero'],
                    'rect': (stepX, stepY, blckMove.size[0], blckMove.size[1])
                })

    # --- Perspective Transformation Step ---
    
    # 1. Define Source Points (Original Corners)
    src_points = [(0, 0), (width, 0), (width, height), (0, height)]
    
    # 2. Define Destination Points (Randomized Corners) to simulate 3D/Perspective
    # We want "light" transformations.
    offset_range = width * 0.05 # 5% distortion max approx
    
    def rand_offset():
        return random.uniform(-offset_range, offset_range)
    
    dst_points = [
        (0 + rand_offset(), 0 + rand_offset()),           # Top-left
        (width + rand_offset(), 0 + rand_offset()),       # Top-right
        (width + rand_offset(), height + rand_offset()),  # Bottom-right
        (0 + rand_offset(), height + rand_offset())       # Bottom-left
    ]
    
    # 3. Calculate Coefficients for PIL (Backward Mapping: Dest -> Source)
    # PIL transform data expects coeffs to map (x_dest, y_dest) -> (x_src, y_src)
    pil_coeffs = find_coeffs(dst_points, src_points)
    
    # 4. Transform the blocks layer
    transformed_layer = blocks_layer.transform((width, height), Image.PERSPECTIVE, pil_coeffs, Image.BICUBIC)
    
    # 5. Composite onto background
    # Ensure background is RGBA for alpha composite, then convert back if needed, or just paste with mask
    # alpha_composite requires both to be RGBA
    final_image = Image.alpha_composite(base_image, transformed_layer)
    
    # 6. Transform Annotations (Box Coordinates)
    # We need Forward Mapping coefficients: Source -> Dest
    fwd_coeffs = find_coeffs(src_points, dst_points)
    
    yolo_annotation = ""
    
    for obj in objects_to_transform:
        x, y, w, h = obj['rect']
        # Get the 4 corners of the bbox
        corners = [
            (x, y),
            (x + w, y),
            (x + w, y + h),
            (x, y + h)
        ]
        
        # Transform all 4 corners
        tx_corners = [transform_point(p, fwd_coeffs) for p in corners]
        
        # Find new bounding box (AABB) enclosing the transformed corners
        xs = [p[0] for p in tx_corners]
        ys = [p[1] for p in tx_corners]
        
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        
        # Clip to image boundaries
        min_x = max(0, min_x)
        min_y = max(0, min_y)
        max_x = min(width, max_x)
        max_y = min(height, max_y)
        
        # Calculate YOLO format: center_x, center_y, width, height (normalized)
        bw = max_x - min_x
        bh = max_y - min_y
        
        if bw <= 0 or bh <= 0:
            continue
            
        cx = min_x + bw / 2.0
        cy = min_y + bh / 2.0
        
        yolo_annotation += f"{obj['class']} {cx/width:.6f} {cy/height:.6f} {bw/width:.6f} {bh/height:.6f}\n"

    _traintxtfile = open(OutputYoloFile, "w+", newline="\n")
    _traintxtfile.write(yolo_annotation)
    _traintxtfile.close()

    #transparent.show() # Disabled for headless run
    final_image.save(OutputImageFile)


def add_with_transparency(input_image_path,
                                output_image_path,
                                blck_image_path,
                                position):
    base_image = Image.open(input_image_path)
    width, height = base_image.size
    transparent = Image.new('RGBA', (width, height), (0,0,0,0))
    transparent.paste(base_image, (0,0))

    blck_perc=550/width


    blckInicio = Image.open(blck_image_path)
    newwidth=round(blckInicio.size[0]*blck_perc)
    newheight=round(blckInicio.size[1]*blck_perc)
    blckInicio=blckInicio.resize((newwidth,newheight),Image.LANCZOS)
    transparent.paste(blckInicio, position, mask=blckInicio)

    blckMove = Image.open('img_blocks/andar.png')
    newwidth=round(blckMove.size[0]*blck_perc)
    newheight=round(blckMove.size[1]*blck_perc)
    blckMove=blckMove.resize((newwidth,newheight),Image.LANCZOS)
    transparent.paste(blckMove, (position[0],round(position[1]+(newheight*0.9))), mask=blckMove)

    blckArrow = Image.open('img_blocks/seta.png')
    newwidth=round(blckArrow.size[0]*blck_perc)
    newheight=round(blckArrow.size[1]*blck_perc)
    blckArrow=blckArrow.resize((newwidth,newheight),Image.LANCZOS)
    blckArrow=blckArrow.rotate(45,expand=True,resample=Image.BICUBIC)
    
    transparent.paste(blckArrow, (position[0]+68,round(position[1]+(newheight*0.9)+30)), mask=blckArrow)

    

    
    
    

    transparent.show()
    transparent.save(output_image_path)

if __name__ == '__main__':

    dirimg="./bg/"
    dirsets="./sets/"
    diroutput="../yolo_model/data/obj/"
    loops=100
    
    available_block_dirs = ['img_blocks'] + [f'img_blocks_p{i}' for i in range(1, 9)]

    for x in range(loops):
        for bgFile in os.listdir(dirimg):
            # Pick a random block directory for this image
            current_blocks_dir = random.choice(available_block_dirs)
            print(f"Generating image {x}, using blocks from: {current_blocks_dir}")
            
            for setFile in os.listdir(dirsets):
                if setFile.endswith(".txt"):
                    timestampStr = datetime.now().strftime("%Y%m%d%H%M%S%f")
                    tmpFile=timestampStr+"_"+ setFile.split('.')[0]
                    tmpBlocks=proc_txt_file('sets/'+setFile)
                    generate_img_blocks(tmpBlocks,dirimg+bgFile,diroutput+tmpFile+".png",diroutput+tmpFile+".txt", blocks_dir=current_blocks_dir)


    #_blocks=proc_txt_file('sets/setrnd.txt')
    #generate_img_blocks(_blocks,"bg/desk2.jpg","/data/datasets/ludico/data/obj/output1.png","/data/datasets/ludico/data/obj/output1.txt")
    #_blocks=proc_txt_file('sets/set4.txt')
    #generate_img_blocks(_blocks,"bg/desk.jpg","output2.png")

    #img = 'bg/desk.jpg'
    #add_with_transparency(img, 'out.png','img_blocks/inicio.png', position=(300,300))
