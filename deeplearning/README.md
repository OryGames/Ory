# DeepLearning - Detector das pecinhas

Uma parte essencial do projeto Ory é a capacidade de reconhecer através de uma imagem a programação realizada com as peças do kit.
Para isso, vamos utilizar o Darknet/Yolo, conhecido hoje como o 'Estado da arte' em algoritmos de detecção de objetos em imagens. E nesse primeiro momento, vamos utilizar um dataset gerado artificialmente através do nosso script gerador.

## Requisitos:
* Python 3.6
* Pillow >-5.1
* [AlexeyAB/darknet](https://github.com/AlexeyAB/darknet)
* [Yolo_mark](https://github.com/AlexeyAB/Yolo_mark)

## Gerando o dataset artificial

Acesse o diretório `dataset_generator` e execute o script python `generate_artificial_dataset.py` (sem nenhum parâmetro mesmo).

```
git clone https://github.com/OryGames/Ory.git
cd dataset_generator
python3 generate_artificial_dataset.py
```

> Observação: Ao término da execução do script um novo dataset com imagens produzidas aleatóriamente através da mesclagem das imagens de pecinhas localizada no diretório `img_blocks`e imagens de fundo do diretório `bg`) terá sido gerado no diretório `yolo_model`. Dentro do diretório `yolo_model/data/obj`

