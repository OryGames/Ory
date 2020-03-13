# DeepLearning - Detector das pecinhas

Uma parte essencial do projeto Ory é a capacidade de reconhecer através de uma imagem a programação realizada com as peças do kit.
Para isso, vamos utilizar o Darknet/Yolo, conhecido hoje como o 'Estado da arte' em algoritmos de detecção de objetos em imagens. E nesse primeiro momento, vamos utilizar um dataset gerado artificialmente através do nosso script gerador.

## Requisitos:
* Python 3.6
* Pillow >-5.1
* [AlexeyAB/darknet](https://github.com/AlexeyAB/darknet)
* [Yolo_mark](https://github.com/AlexeyAB/Yolo_mark)

## Gerando o dataset artificial

Para que nosso modelo seja bem assertivo certamente precisaremos de um bom dataset. Enquanto ainda não possuímos imagens reais, para acelerar o desenvolvimento do projeto, produziremos um dataset com imagens sintéticas geradas a partir de um conjunto de imagens que representam as 'peças' sobrepostas aleatoriamente sobre uma imagem de fundo também aleatória.

Acesse o diretório `dataset_generator` e execute o script python `generate_artificial_dataset.py` (sem nenhum parâmetro mesmo).

```
git clone https://github.com/OryGames/Ory.git
cd dataset_generator
python3 generate_artificial_dataset.py
```

> Observação: Ao término da execução do script um novo dataset com imagens produzidas aleatóriamente através da mesclagem das imagens de pecinhas localizada no diretório `img_blocks`e imagens de fundo do diretório `bg`) terá sido gerado no diretório `yolo_model`. Dentro do diretório `yolo_model/data/obj`

## Verificando o dataset com Yolo_Mark

Quando estiver com o dataset pronto, utilize a ferramenta `yolo_mark` para verificar se está tudo certo com o DataSet.

```
./yolo_mark yolo_model/data/obj yolo_model/data/train.txt yolo_model/data/obj.names
```

## Treinando seu modelo

Depois de verificar seu dataset, usaremos `darknet` para treinar o modelo a partir de arquivo de pesos pré-treinados para as camadas convolucionais.

* Baixe o arquivo de pesos pré-treinados: https://pjreddie.com/media/files/darknet53.conv.74

Execute o comando abaixo para iniciar o treinamento:
```
/darknet/darknet detector train yolo_model/data/obj.data yolo_model/yolo-obj.cfg darknet53.conv.74
```

## Testando o novo modelo treinado
Execute o comando abaixo, substituindo `image_test.jpg` pelo caminho de uma imagem do seu dataset:
```
./darknet detector test yolo_model/data/obj.data yolo_model/yolo-obj.cfg yolo_model/backup/yolo-obj_last.weights image_test.jpg -i 0 -thresh 0.25
```
