# 🦟 Ory: Contra Dengue

> **Jogo educativo que combina programação tangível com inteligência artificial para ensinar lógica computacional e conscientização sobre a dengue**

![Phaser](https://img.shields.io/badge/Phaser-3.x-blue)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-YOLO-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## 📖 Sobre o Projeto

**Ory: Contra Dengue** é um jogo educativo inovador desenvolvido com Phaser.js que ensina conceitos de programação para crianças de forma lúdica e interativa. Os jogadores controlam o robô Ory usando **blocos de programação físicos**, que são escaneados pela câmera do dispositivo e interpretados por um modelo de **Inteligência Artificial YOLO** em tempo real.

O jogo une tecnologia de ponta com uma narrativa envolvente sobre a prevenção à dengue, tornando o aprendizado de programação acessível e divertido.

## 🎮 Mecânica do Jogo

- **Programação Tangível**: Use blocos físicos impressos para criar sequências de comandos (andar, pular, pegar, virar)
- **Visão Computacional**: A câmera detecta e interpreta os blocos automaticamente usando Deep Learning
- **Puzzles Progressivos**: Navegue por mapas temáticos coletando itens e eliminando criadouros do mosquito Aedes aegypti
- **Sistema de Loops**: Ensine conceitos de repetição com blocos de `looping`
- **Sistema de Estrelas**: Ganhe até 3 estrelas baseado no tempo e número de tentativas

## 🛠️ Tecnologias Utilizadas

| Componente | Tecnologia |
|------------|------------|
| Engine de Jogo | Phaser 3 |
| Detecção de Blocos | TensorFlow.js + YOLO |
| Linguagem | JavaScript (ES6+) |
| Build | HTML5 / PWA Ready |

## 🎯 Objetivos Educacionais

- ✅ Introdução ao pensamento computacional
- ✅ Sequenciamento lógico de instruções
- ✅ Conceitos de repetição (loops)
- ✅ Resolução de problemas
- ✅ Conscientização sobre prevenção à dengue

## 🚀 Como Jogar

1. **Imprima os blocos** de programação (disponíveis em [https://github.com/OryGames/Ory](https://github.com/OryGames/Ory))
2. **Monte sua sequência** de comandos na mesa
3. **Clique no robô** para abrir a câmera
4. **Aponte a câmera** para os blocos
5. **A IA detecta** os comandos e o Ory executa!

## 📦 Comandos Disponíveis

| Bloco | Ação |
|-------|------|
| `inicio` | Marca o início do programa |
| `andar` | Move o robô para frente |
| `pular` | Salta sobre obstáculos |
| `pegar` | Coleta o item na posição atual |
| `seta_up` ↑ | Vira para cima |
| `seta_down` ↓ | Vira para baixo |
| `seta_left` ← | Vira para esquerda |
| `seta_right` → | Vira para direita |
| `2` a `9` | Multiplicador de repetição |
| `looping` | Inicia um bloco de repetição |

## 🎨 Recursos

- 🎬 **Cutscenes** animadas com vídeos e narrações
- 🎵 **Trilha sonora** original e efeitos sonoros imersivos
- 🗺️ **Múltiplas fases** com dificuldade progressiva
- 📱 **Design responsivo** para desktop e dispositivos móveis
- 🏆 **Sistema de progresso** com estrelas e créditos finais

## 💻 Instalação e Execução

### Pré-requisitos
- Navegador moderno com suporte a WebGL
- Servidor HTTP local (para desenvolvimento)

### Executando localmente

```bash
# Clone o repositório
git clone https://github.com/OryGames/contradengue.github.io.git

# Entre na pasta do projeto
cd contradengue.github.io

# Inicie um servidor HTTP local (Python 3)
python3 -m http.server 8000

# Ou usando Node.js
npx serve .
```

Acesse `http://localhost:8000` no navegador.

## 📁 Estrutura do Projeto

```
├── assets/
│   ├── audio/          # Músicas e efeitos sonoros
│   ├── backgrounds/    # Imagens de fundo
│   ├── levels/         # Configurações das fases (JSON)
│   ├── model/          # Modelo YOLO para detecção
│   ├── sprites/        # Sprites e tilesets
│   └── video/          # Vídeos das cutscenes
├── css/
│   └── style.css       # Estilos globais
├── js/
│   ├── entities/       # Classes de entidades (Robot)
│   ├── logic/          # Interpretador de comandos
│   ├── scenes/         # Cenas do Phaser
│   └── vision/         # Handler de visão computacional
├── lib/                # Bibliotecas externas
├── index.html          # Página principal
└── editor.html         # Editor de fases
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença GPL-3.0. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Créditos

Desenvolvido com ❤️ pela equipe **Ory Games** para combater a dengue através da educação.

---

<p align="center">
  <strong>🎮 Aprenda a programar. 🦟 Combata a dengue.</strong>
</p>
