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

def generate_img_blocks(blocks,backGroundImageFile,OutputImageFile,OutputYoloFile):
    base_image = Image.open(backGroundImageFile)
    width, height = base_image.size
    transparent = Image.new('RGBA', (width, height), (0,0,0,0))
    transparent.paste(base_image, (0,0))
    blck_perc=550/width
    yolo_annotation=''

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

    for b in blocks:
        blck_image_path='img_blocks/'+b['name']+'.png'
        blckInicio = Image.open(blck_image_path)
        newwidth=round(blckInicio.size[0]*blck_perc)
        newheight=round(blckInicio.size[1]*blck_perc)
        blckInicio=blckInicio.resize((newwidth,newheight),Image.LANCZOS)
        transparent.paste(blckInicio, (b['x'],b['y']), mask=blckInicio)
        yolo_annotation+=str(dicObj[b['name']])+' '+str((b['x']/width)+((newwidth/width)/2))+' '+str((b['y']/height)+((newheight/height)/2))+' '+str(newwidth/width)+' '+str(newheight/height)+"\n"
        if 'direction' in b and (b['name']=='andar' or b['name']=='pegar' or b['name']=='pular'):
            blckArrow = Image.open('img_blocks/seta.png')
            bnewwidth=round(blckArrow.size[0]*blck_perc)
            bnewheight=round(blckArrow.size[1]*blck_perc)
            blckArrow=blckArrow.resize((bnewwidth,bnewheight),Image.LANCZOS)
            if b['direction']=='up':
                blckArrow=blckArrow.rotate(45*-1,expand=True,resample=Image.BICUBIC)
            if b['direction']=='down':
                blckArrow=blckArrow.rotate(45*3,expand=True,resample=Image.BICUBIC)
            if b['direction']=='left':
                blckArrow=blckArrow.rotate(45*1,expand=True,resample=Image.BICUBIC)
            if b['direction']=='right':
                blckArrow=blckArrow.rotate(45*5,expand=True,resample=Image.BICUBIC)
            arrowX=b['x']+64+(random.randint(-3,3))
            arrowY=b['y']+(random.randint(-3,3))
            transparent.paste(blckArrow,  (arrowX,arrowY), mask=blckArrow)
            yolo_annotation+=str(dicObj['seta'])+' '+str((arrowX/width)+((blckArrow.size[0]/width)/2))+' '+str((arrowY/height)+((blckArrow.size[1]/height)/2))+' '+str(blckArrow.size[0]/width)+' '+str(blckArrow.size[1]/height)+"\n"
        if 'steps' in b:
            blckMove={}
            if b['steps']>1 and b['steps']<10:
                blckMove = Image.open('img_blocks/'+str(b['steps'])+'.png')
                newwidth=round(blckMove.size[0]*blck_perc)
                newheight=round(blckMove.size[1]*blck_perc)
                blckMove=blckMove.resize((newwidth,newheight),Image.LANCZOS)
                stepX=b['x']+128-30+(random.randint(-3,3))
                stepY=b['y']+random.randint(-3,3)
                transparent.paste(blckMove, (stepX,stepY), mask=blckMove)
                yolo_annotation+=str(dicObj['numero'])+' '+str((stepX/width)+((blckMove.size[0]/width)/2))+' '+str((stepY/height)+((blckMove.size[1]/height)/2))+' '+str(blckMove.size[0]/width)+' '+str(blckMove.size[1]/height)+"\n"

    _traintxtfile = open(OutputYoloFile, "w+", newline="\n")
    _traintxtfile.write(yolo_annotation)
    _traintxtfile.close()

    #transparent.show()
    transparent.save(OutputImageFile)


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
    
    for x in range(loops):
        for bgFile in os.listdir(dirimg):
            for setFile in os.listdir(dirsets):
                if setFile.endswith(".txt"):
                    timestampStr = datetime.now().strftime("%Y%m%d%H%M%S%f")
                    tmpFile=timestampStr+"_"+ setFile.split('.')[0]
                    tmpBlocks=proc_txt_file('sets/'+setFile)
                    generate_img_blocks(tmpBlocks,dirimg+bgFile,diroutput+tmpFile+".png",diroutput+tmpFile+".txt")


    #_blocks=proc_txt_file('sets/setrnd.txt')
    #generate_img_blocks(_blocks,"bg/desk2.jpg","/data/datasets/ludico/data/obj/output1.png","/data/datasets/ludico/data/obj/output1.txt")
    #_blocks=proc_txt_file('sets/set4.txt')
    #generate_img_blocks(_blocks,"bg/desk.jpg","output2.png")

    #img = 'bg/desk.jpg'
    #add_with_transparency(img, 'out.png','img_blocks/inicio.png', position=(300,300))
