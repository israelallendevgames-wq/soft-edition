# Frame Studio

Um protótipo local de estúdio para planejar vídeos de YouTube, reunir briefings de IA, organizar cenas e preparar materiais para edição.

## Executar no navegador

Abra `index.html` em um navegador moderno. Não há instalação de dependências, servidor ou conta necessária. Para testar o salvamento, permita armazenamento local para arquivos locais no navegador.

## Aplicativo Windows

Instale o Node.js LTS e execute `npm install` e `npm start` para abrir o Frame Studio em uma janela de desktop.

Para gerar o executável portátil Windows x64, execute `npm run dist:win`. O arquivo será criado em `release/Frame-Studio-1.0.0-Windows-x64.exe`. Não é necessário instalar o Node.js para executar o `.exe`.

## O que funciona

- Briefing de vídeo e estrutura inicial de roteiro gerada localmente.
- Editor de roteiro, contador de palavras e criação de storyboard a partir do texto.
- Edição de título, duração e prompts por cena, reordenação do storyboard e linha do tempo do projeto.
- Prévia visual conceitual, navegação simulada e controles de duração.
- Importação de mídia para a sessão atual, cartões de áudio e thumbnail conceitual.
- Prompts em português que podem ser copiados para serviços externos.
- Acesso aos sites de ChatGPT, Claude, Gemini, Kling, Runway, Luma Dream Machine, Veo, Higgsfield, CapCut, Suno, Moises e ferramentas de imagem.
- Salvamento local de textos e cenas e exportação de um arquivo `.frame.json`.

## Limites desta versão

Os provedores abrem em seus sites oficiais; não há integração direta com APIs, geração automática de mídia ou renderização/exportação de vídeo. O botão de estrutura monta um rascunho determinístico no navegador — não é geração por IA. A biblioteca de mídia mantém referências somente durante a sessão, e os arquivos precisam ser importados novamente depois de recarregar a página. O arquivo de projeto exportado contém os metadados e textos, não os arquivos de mídia.

Integrações diretas dependem de APIs disponibilizadas por cada provedor, acesso e credenciais. Elas precisam ser implementadas no servidor, mantendo segredos fora do navegador; não insira chaves de API neste protótipo.

## Pesquisa de produto

[REA (Reverse Engineer Anything)](https://github.com/morluto/rea) oferece ferramentas locais para inspecionar o comportamento de aplicativos, código JavaScript/Electron e binários, com evidências. Ele não fornece APIs de geração de vídeo. Este protótipo usa a ideia de separar fluxos por etapa criativa e de deixar explícito o que é uma ação local e o que pertence a um provedor externo; não copia código ou ativos dos serviços listados.
