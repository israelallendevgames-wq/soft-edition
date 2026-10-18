(() => {
  'use strict';

  const STORAGE_KEY = 'frame-studio-project-v1';
  const providers = [
    { name: 'ChatGPT', mark: 'G', category: 'writing', label: 'Roteiro e ideias', url: 'https://chatgpt.com/' },
    { name: 'Claude', mark: 'C', category: 'writing', label: 'Roteiro e revisão', url: 'https://claude.ai/' },
    { name: 'Gemini', mark: '✦', category: 'writing', label: 'Roteiro e pesquisa', url: 'https://gemini.google.com/' },
    { name: 'Kling AI', mark: 'K', category: 'video', label: 'Geração de vídeo', url: 'https://klingai.com/' },
    { name: 'Runway', mark: 'R', category: 'video', label: 'Vídeo e efeitos', url: 'https://runwayml.com/' },
    { name: 'Luma Dream Machine', mark: 'L', category: 'video', label: 'Geração de cenas', url: 'https://lumalabs.ai/dream-machine' },
    { name: 'Google Veo', mark: 'V', category: 'video', label: 'Vídeo generativo', url: 'https://deepmind.google/models/veo/' },
    { name: 'Higgsfield', mark: 'H', category: 'video', label: 'Vídeo cinematográfico', url: 'https://higgsfield.ai/' },
    { name: 'CapCut', mark: 'C', category: 'editing', label: 'Edição e pós-produção', url: 'https://www.capcut.com/' },
    { name: 'Suno', mark: 'S', category: 'audio', label: 'Música e trilha sonora', url: 'https://suno.com/' },
    { name: 'Moises', mark: 'M', category: 'audio', label: 'Separação e ferramentas de áudio', url: 'https://moises.ai/' },
    { name: 'Gemini · imagem', mark: '✦', category: 'image', label: 'Geração de imagens', url: 'https://gemini.google.com/' },
    { name: 'Nano Banana', mark: 'N', category: 'image', label: 'Imagens com IA do Google', url: 'https://gemini.google.com/' },
  ];
  const categories = [
    { id: 'writing', title: 'Roteiro & ideias', description: 'Desenvolvimento de histórias, pesquisa e revisão.', icon: 'i-script', color: 'icon-lavender' },
    { id: 'video', title: 'Vídeo & cenas', description: 'Geração de cenas e movimento cinematográfico.', icon: 'i-clapper', color: 'icon-orange' },
    { id: 'editing', title: 'Edição & pós-produção', description: 'Continue a edição em um editor externo.', icon: 'i-scissors', color: 'icon-blue' },
    { id: 'audio', title: 'Música & áudio', description: 'Trilhas sonoras, música e edição de áudio.', icon: 'i-wave', color: 'icon-blue' },
    { id: 'image', title: 'Imagem & thumbnail', description: 'Conceitos visuais e capas para o YouTube.', icon: 'i-image', color: 'icon-green' },
  ];

  const blankProject = () => ({
    title: 'A próxima grande ideia',
    idea: '',
    tone: 'Inspirador',
    duration: '8',
    audience: '',
    script: '',
    audioIdea: '',
    thumbnailConcept: '',
    thumbnailText: 'SUA PRÓXIMA GRANDE IDEIA',
    thumbnailPalette: 'gold',
    sceneFormat: '16:9 · YouTube',
    scenes: [],
    media: [],
    updatedAt: '',
  });

  let project = loadProject();
  let toastTimer;
  let previewTimer;
  let previewSeconds = 0;
  let zoom = 100;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function loadProject() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return blankProject();
      const parsed = JSON.parse(saved);
      return { ...blankProject(), ...parsed, scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [], media: [] };
    } catch (error) {
      console.error('Não foi possível carregar o projeto local.', error);
      return blankProject();
    }
  }

  function saveProject() {
    const status = $('#save-status');
    try {
      project.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...project, media: [] }));
      status.textContent = 'Salvo neste dispositivo';
      $('#project-updated').textContent = `Atualizado às ${new Date(project.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      $('#project-scene-count').textContent = `${project.scenes.length} ${project.scenes.length === 1 ? 'cena' : 'cenas'}`;
    } catch (error) {
      status.textContent = 'Não foi possível salvar';
      showToast('O armazenamento local falhou. Exporte uma cópia do projeto para não perder as alterações.', true);
      console.error('Não foi possível salvar o projeto local.', error);
    }
  }

  function showToast(message, isError = false) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.toggle('error', isError);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3400);
  }

  function navigate(view) {
    const panel = $(`[data-panel="${view}"]`);
    if (!panel) return;
    $$('.view-panel').forEach((item) => item.classList.toggle('active', item === panel));
    $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
    const activeNav = $(`.nav-item[data-view="${view}"]`);
    $('#breadcrumb-current').textContent = activeNav?.querySelector('span')?.textContent || (view === 'overview' ? 'Visão geral' : view);
    $('#sidebar').classList.remove('open');
    if (view === 'editor') renderTimeline();
    if (view === 'scenes') renderScenes();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderProviderLinks(target, categoryIds, compact = false) {
    const root = $(target);
    if (!root) return;
    root.replaceChildren();
    providers.filter((provider) => categoryIds.includes(provider.category)).forEach((provider) => {
      const card = document.createElement('article');
      card.className = compact ? 'tool-card' : 'provider-card';
      const logo = document.createElement('span');
      logo.className = 'tool-logo';
      logo.textContent = provider.mark;
      const copy = document.createElement('span');
      copy.className = 'tool-copy';
      const name = document.createElement('strong');
      name.textContent = provider.name;
      const description = document.createElement('small');
      description.textContent = provider.label;
      copy.append(name, description);
      const action = compact ? document.createElement('button') : document.createElement('button');
      action.className = compact ? 'tool-action' : 'button';
      action.type = 'button';
      action.setAttribute('aria-label', `Abrir ${provider.name}`);
      action.title = `Abrir ${provider.name}`;
      if (compact) action.innerHTML = '<svg><use href="#i-link"></use></svg>';
      else action.textContent = 'Abrir ↗';
      action.addEventListener('click', () => openProvider(provider));
      card.append(logo, copy, action);
      root.append(card);
    });
  }

  function openProvider(provider) {
    try {
      window.open(provider.url, '_blank', 'noopener,noreferrer');
      showToast(`Abrindo ${provider.name} no navegador. Seus dados não foram enviados.`);
    } catch (error) {
      console.error(`Não foi possível abrir ${provider.name}.`, error);
      showToast(`Não foi possível abrir ${provider.name}. Verifique as permissões de pop-up do aplicativo.`, true);
    }
  }

  function renderCategories() {
    const root = $('#provider-categories');
    root.replaceChildren();
    categories.forEach((category) => {
      const section = document.createElement('section');
      section.className = 'provider-category';
      const heading = document.createElement('div');
      heading.className = 'provider-category-heading';
      const icon = document.createElement('span');
      icon.className = `small-icon ${category.color}`;
      icon.innerHTML = `<svg><use href="#${category.icon}"></use></svg>`;
      const text = document.createElement('div');
      const title = document.createElement('h2');
      title.textContent = category.title;
      const description = document.createElement('p');
      description.textContent = category.description;
      text.append(title, description);
      heading.append(icon, text);
      const grid = document.createElement('div');
      grid.className = 'provider-grid';
      providers.filter((provider) => provider.category === category.id).forEach((provider) => {
        const card = document.createElement('article');
        card.className = 'provider-card';
        const logo = document.createElement('span');
        logo.className = 'tool-logo';
        logo.textContent = provider.mark;
        const copy = document.createElement('span');
        copy.className = 'tool-copy';
        const name = document.createElement('strong');
        name.textContent = provider.name;
        const sub = document.createElement('small');
        sub.textContent = provider.label;
        copy.append(name, sub);
        const open = document.createElement('button');
        open.className = 'button';
        open.type = 'button';
        open.textContent = 'Abrir ↗';
        open.addEventListener('click', () => openProvider(provider));
        card.append(logo, copy, open);
        grid.append(card);
      });
      section.append(heading, grid);
      root.append(section);
    });
  }

  function setFormValues() {
    $('#project-title').value = project.title;
    $('#video-idea').value = project.idea;
    $('#video-tone').value = project.tone;
    $('#video-duration').value = project.duration;
    $('#target-audience').value = project.audience;
    $('#script-content').value = project.script;
    $('#audio-idea').value = project.audioIdea;
    $('#thumbnail-concept').value = project.thumbnailConcept;
    $('#thumbnail-text').value = project.thumbnailText;
    $('#thumbnail-color').value = project.thumbnailPalette;
    $('#scene-format').value = project.sceneFormat;
    updateScriptCount();
    updateThumbnail();
    saveProject();
  }

  function bindProjectField(id, key, eventName = 'input') {
    $(id).addEventListener(eventName, (event) => {
      project[key] = event.target.value;
      if (key === 'thumbnailText') updateThumbnail();
      if (key === 'thumbnailPalette') updateThumbnail();
      if (key === 'script') updateScriptCount();
      if (key === 'title') $('#preview-caption').textContent = event.target.value.trim().toLocaleUpperCase('pt-BR') || 'SUA PRÓXIMA GRANDE IDEIA';
      saveProject();
    });
  }

  function updateScriptCount() {
    const count = project.script.trim() ? project.script.trim().split(/\s+/u).length : 0;
    $('#script-word-count').textContent = `${count} ${count === 1 ? 'palavra' : 'palavras'}`;
  }

  function buildOutline() {
    const idea = project.idea.trim();
    if (!idea) {
      $('#script-feedback').textContent = 'Escreva uma ideia antes de montar a estrutura.';
      showToast('Conte sua ideia para montar a estrutura do roteiro.', true);
      $('#video-idea').focus();
      return;
    }
    const duration = Number(project.duration) || 8;
    const audience = project.audience.trim() || 'público geral do YouTube';
    const outline = [
      `TÍTULO PROVISÓRIO\n${project.title}`,
      `\nIDEIA CENTRAL\n${idea}`,
      `\nPÚBLICO\n${audience}`,
      `\nTOM E DURAÇÃO\n${project.tone} · aproximadamente ${duration} minutos`,
      '\nABERTURA (0:00–0:30)\nComece com uma pergunta, imagem ou afirmação que desperte curiosidade. Apresente a promessa do vídeo sem revelar a conclusão.',
      '\nCONTEXTO (0:30–2:00)\nExplique por que este assunto importa para quem está assistindo. Dê o contexto necessário e apresente a pergunta que conduz a história.',
      '\nDESENVOLVIMENTO (2:00–' + Math.max(3, duration - 1) + ':00)\nConstrua a narrativa em três movimentos: uma descoberta, um exemplo concreto e um novo ponto de vista. Use cenas e detalhes visuais para dar ritmo.',
      '\nDESFECHO (' + Math.max(3, duration - 1) + ':00–' + duration + ':00)\nRetome a promessa da abertura, ofereça uma conclusão memorável e convide o público a continuar a conversa.',
    ].join('\n');
    project.script = outline;
    $('#script-content').value = outline;
    updateScriptCount();
    $('#script-feedback').textContent = 'Estrutura inicial criada localmente. Revise o texto ou copie o briefing para gerar uma versão com IA.';
    saveProject();
    showToast('Estrutura do roteiro criada no projeto.');
  }

  function makePrompt(kind) {
    const audience = project.audience.trim() || 'público geral do YouTube';
    if (kind === 'script') {
      return `Escreva um roteiro original em português do Brasil para um vídeo de YouTube com cerca de ${project.duration} minutos.\n\nIDEIA: ${project.idea || '[descreva sua ideia]'}\nTOM: ${project.tone}\nPÚBLICO: ${audience}\nTÍTULO PROVISÓRIO: ${project.title}\n\nInclua uma abertura que prenda a atenção sem clickbait, progressão narrativa clara, sugestões de imagens/B-roll entre colchetes e um encerramento natural. Não invente dados ou citações. Entregue o roteiro pronto para revisão humana.`;
    }
    if (kind === 'scene') {
      return `Crie um prompt original para um vídeo cinematográfico. Projeto: ${project.title}. Formato: ${project.sceneFormat}. Direção: ${project.tone}. Ideia: ${project.idea || '[descreva a ideia do vídeo]'}.\nDescreva sujeito, ação, cenário, luz, movimento de câmera, composição, paleta e duração. Evite texto na imagem, logos e marcas.`;
    }
    if (kind === 'audio') {
      return `Crie uma proposta original de trilha sonora para o vídeo "${project.title}".\nIdeia e atmosfera: ${project.audioIdea || project.idea || '[descreva a atmosfera sonora]'}. Tom: ${project.tone}.\nDescreva instrumentação, ritmo, dinâmica, progressão e finalização. Não use melodias existentes nem imite artistas vivos.`;
    }
    return `Crie uma imagem original para thumbnail de YouTube (16:9) para o vídeo "${project.title}".\nConceito: ${project.thumbnailConcept || project.idea || '[descreva o conceito visual]'}.\nPaleta: ${paletteLabel(project.thumbnailPalette)}. Composição ${$('#thumbnail-layout').value.toLocaleLowerCase('pt-BR')}. Texto curto sugerido: "${project.thumbnailText || 'sem texto'}". Alto contraste, leitura clara em tamanho pequeno, foco visual forte. Não inclua logos ou marcas.`;
  }

  function paletteLabel(value) {
    return ({ gold: 'dourado e azul', violet: 'violeta e rosa', green: 'verde e âmbar', monochrome: 'preto e branco' })[value] || 'dourado e azul';
  }

  async function copyText(text, successMessage) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.append(helper);
        helper.select();
        const copied = document.execCommand('copy');
        helper.remove();
        if (!copied) throw new Error('O navegador não permitiu copiar o texto.');
      }
      showToast(successMessage);
    } catch (error) {
      console.error('Não foi possível copiar o prompt.', error);
      showToast('Não foi possível copiar automaticamente. Selecione e copie o texto manualmente.', true);
    }
  }

  function scriptToScenes() {
    const metadataHeading = /^(?:TÍTULO PROVISÓRIO|IDEIA CENTRAL|PÚBLICO|TOM E DURAÇÃO)\s*\n/iu;
    const sectionHeading = /^(?:ABERTURA(?:\s*\([^)]*\))?|CONTEXTO(?:\s*\([^)]*\))?|DESENVOLVIMENTO(?:\s*\([^)]*\))?|DESFECHO(?:\s*\([^)]*\))|CENA\s*\d*[:.-]?)\s*\n/iu;
    const paragraphs = project.script.split(/\n{2,}/u).map((value) => {
      if (metadataHeading.test(value)) return '';
      return value.trim().replace(sectionHeading, '').trim();
    }).filter(Boolean);
    if (!paragraphs.length) {
      showToast('Escreva ou monte um roteiro antes de organizar as cenas.', true);
      navigate('script');
      $('#script-content').focus();
      return;
    }
    const labelPattern = /^(?:CENA\s*\d*[:.-]?\s*)/iu;
    const pieces = paragraphs.flatMap((paragraph) => paragraph.split(/\n(?=CENA\s*\d*[:.-])/iu).map((item) => item.trim()).filter(Boolean));
    const proposed = pieces.slice(0, 12).map((text, index) => ({
      id: createId(),
      title: text.replace(labelPattern, '').split(/[.!?]/u)[0].slice(0, 48).trim() || `Cena ${index + 1}`,
      prompt: `Plano cinematográfico para: ${text.slice(0, 300)}. Luz ${project.tone.toLocaleLowerCase('pt-BR')}, movimento de câmera suave, composição 16:9. Sem texto ou logos.`,
      duration: 5,
    }));
    if (!proposed.length) {
      showToast('Não foi possível identificar trechos de cena no roteiro. Adicione uma cena manualmente.', true);
      return;
    }
    project.scenes = proposed;
    saveProject();
    renderScenes();
    showToast(`${proposed.length} ${proposed.length === 1 ? 'cena organizada' : 'cenas organizadas'} no storyboard.`);
    navigate('scenes');
  }

  function createId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function addScene() {
    project.scenes.push({ id: createId(), title: `Cena ${project.scenes.length + 1}`, prompt: '', duration: 5 });
    saveProject();
    renderScenes();
  }

  function renderScenes() {
    const root = $('#scenes-list');
    if (!root) return;
    root.replaceChildren();
    $('#scene-toolbar-count').textContent = `${project.scenes.length} ${project.scenes.length === 1 ? 'cena' : 'cenas'} no storyboard`;
    $('#project-scene-count').textContent = `${project.scenes.length} ${project.scenes.length === 1 ? 'cena' : 'cenas'}`;
    if (!project.scenes.length) {
      const empty = document.createElement('div');
      empty.className = 'surface-card empty-scenes';
      empty.innerHTML = '<span class="small-icon icon-orange"><svg><use href="#i-clapper"></use></svg></span><strong>Seu storyboard está esperando pela primeira cena.</strong><p>Organize o roteiro em cenas ou comece com uma cena em branco.</p>';
      root.append(empty);
      return;
    }
    project.scenes.forEach((scene, index) => {
      const card = document.createElement('article');
      card.className = 'scene-card';
      const art = document.createElement('div');
      art.className = 'scene-art';
      const number = document.createElement('span');
      number.className = 'scene-index';
      number.textContent = `CENA ${String(index + 1).padStart(2, '0')}`;
      art.append(number);
      const details = document.createElement('div');
      details.className = 'scene-details';
      const top = document.createElement('div');
      top.className = 'scene-card-top';
      const sceneNumber = document.createElement('span');
      sceneNumber.className = 'scene-number';
      sceneNumber.textContent = String(index + 1).padStart(2, '0');
      const title = document.createElement('input');
      title.className = 'scene-title';
      title.maxLength = 60;
      title.value = scene.title;
      title.setAttribute('aria-label', `Título da cena ${index + 1}`);
      title.addEventListener('input', () => {
        scene.title = title.value;
        saveProject();
        renderTimeline();
      });
      const duration = document.createElement('select');
      duration.className = 'scene-duration-select';
      duration.setAttribute('aria-label', `Duração da cena ${index + 1}`);
      [3, 5, 8, 10].forEach((seconds) => {
        const option = document.createElement('option');
        option.value = String(seconds);
        option.textContent = `${seconds}s`;
        option.selected = Number(scene.duration) === seconds;
        duration.append(option);
      });
      duration.addEventListener('change', () => {
        scene.duration = Number(duration.value);
        saveProject();
        renderScenes();
        renderTimeline();
      });
      const remove = document.createElement('button');
      remove.className = 'scene-remove';
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remover cena ${index + 1}`);
      remove.innerHTML = '<svg><use href="#i-x"></use></svg>';
      remove.addEventListener('click', () => {
        project.scenes = project.scenes.filter((item) => item.id !== scene.id);
        saveProject();
        renderScenes();
        renderTimeline();
      });
      top.append(sceneNumber, title, duration, remove);
      const prompt = document.createElement('textarea');
      prompt.className = 'scene-prompt';
      prompt.value = scene.prompt;
      prompt.placeholder = 'Descreva o enquadramento, a ação, a luz e o movimento de câmera…';
      prompt.setAttribute('aria-label', `Prompt de vídeo da cena ${index + 1}`);
      prompt.addEventListener('input', () => {
        scene.prompt = prompt.value;
        saveProject();
      });
      const footer = document.createElement('div');
      footer.className = 'scene-card-footer';
      const style = document.createElement('span');
      style.className = 'scene-style';
      style.textContent = project.tone;
      const moveUp = document.createElement('button');
      moveUp.className = 'scene-move';
      moveUp.type = 'button';
      moveUp.textContent = '↑';
      moveUp.title = 'Mover cena para cima';
      moveUp.setAttribute('aria-label', `Mover cena ${index + 1} para cima`);
      moveUp.disabled = index === 0;
      moveUp.addEventListener('click', () => moveScene(index, -1));
      const moveDown = document.createElement('button');
      moveDown.className = 'scene-move';
      moveDown.type = 'button';
      moveDown.textContent = '↓';
      moveDown.title = 'Mover cena para baixo';
      moveDown.setAttribute('aria-label', `Mover cena ${index + 1} para baixo`);
      moveDown.disabled = index === project.scenes.length - 1;
      moveDown.addEventListener('click', () => moveScene(index, 1));
      const copy = document.createElement('button');
      copy.className = 'text-button';
      copy.type = 'button';
      copy.textContent = 'Copiar prompt ↗';
      copy.addEventListener('click', () => copyText(scene.prompt || makePrompt('scene'), 'Prompt copiado. Escolha um serviço de vídeo para continuar.'));
      footer.append(style, moveUp, moveDown, copy);
      details.append(top, prompt, footer);
      card.append(art, details);
      root.append(card);
    });
  }

  function moveScene(index, offset) {
    const target = index + offset;
    if (target < 0 || target >= project.scenes.length) return;
    [project.scenes[index], project.scenes[target]] = [project.scenes[target], project.scenes[index]];
    saveProject();
    renderScenes();
    renderTimeline();
  }

  function updateThumbnail() {
    const text = project.thumbnailText.trim() || 'SUA PRÓXIMA GRANDE IDEIA';
    $('#thumbnail-preview-text').innerHTML = escapeHtml(text).replace(/\n/gu, '<br>');
    $('#thumbnail-canvas').className = `thumbnail-canvas palette-${project.thumbnailPalette}`;
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/gu, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  function renderTimeline() {
    const video = $('#video-track');
    if (!video) return;
    video.replaceChildren();
    if (!project.scenes.length) {
      const placeholder = document.createElement('span');
      placeholder.className = 'track-placeholder';
      placeholder.textContent = 'Organize cenas para preencher a linha do tempo';
      video.append(placeholder);
    } else {
      project.scenes.forEach((scene, index) => {
        const clip = document.createElement('div');
        clip.className = 'timeline-clip';
        clip.style.flexGrow = String(Math.max(1, Number(scene.duration) || 5));
        const title = document.createElement('strong');
        title.textContent = scene.title || `Cena ${index + 1}`;
        const length = document.createElement('small');
        length.textContent = `${scene.duration}s`;
        clip.append(title, length);
        video.append(clip);
      });
    }
    const audio = $('#audio-track');
    const audioFile = project.media.find((item) => item.type === 'audio');
    audio.replaceChildren();
    if (audioFile) {
      const clip = document.createElement('span');
      clip.className = 'track-placeholder audio-clip';
      clip.textContent = `♫  ${audioFile.name}`;
      audio.append(clip);
    } else {
      const placeholder = document.createElement('span');
      placeholder.className = 'track-placeholder';
      placeholder.textContent = 'Importe uma trilha de áudio para adicionar à sequência';
      audio.append(placeholder);
    }
  }

  function formatSeconds(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function setPreviewPlaying() {
    if (previewTimer) {
      clearInterval(previewTimer);
      previewTimer = null;
      return false;
    }
    const duration = Math.max(10, project.scenes.reduce((total, scene) => total + (Number(scene.duration) || 5), 0));
    previewTimer = setInterval(() => {
      previewSeconds = (previewSeconds + 1) % duration;
      $('#preview-scrubber').value = String(Math.round((previewSeconds / duration) * 100));
      $('#preview-clock').textContent = formatSeconds(previewSeconds);
      $('#preview-time').textContent = `${formatSeconds(previewSeconds)} / ${formatSeconds(duration)}`;
    }, 1000);
    return true;
  }

  function addMedia(files) {
    [...files].forEach((file) => {
      const type = file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'file';
      if (type === 'file') {
        showToast(`Formato não reconhecido: ${file.name}`, true);
        return;
      }
      const item = { id: createId(), name: file.name, type, size: file.size };
      project.media.push(item);
    });
    saveProject();
    renderMedia();
    renderTimeline();
    if (files.length) showToast(`${files.length} ${files.length === 1 ? 'arquivo adicionado' : 'arquivos adicionados'} à biblioteca do projeto.`);
  }

  function formatBytes(size) {
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderMedia() {
    const root = $('#media-list');
    root.replaceChildren();
    if (!project.media.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-media';
      empty.textContent = 'Sua biblioteca aparecerá aqui.';
      root.append(empty);
      return;
    }
    project.media.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'media-item';
      const icon = document.createElement('span');
      icon.className = 'media-type';
      icon.textContent = item.type === 'audio' ? '♫' : item.type === 'video' ? '▶' : '▧';
      const name = document.createElement('span');
      name.className = 'media-name';
      name.textContent = item.name;
      const size = document.createElement('span');
      size.className = 'media-size';
      size.textContent = formatBytes(item.size);
      row.append(icon, name, size);
      root.append(row);
    });
  }

  function exportProject() {
    try {
      const payload = { format: 'frame-studio-project', version: 1, exportedAt: new Date().toISOString(), project };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeFilename(project.title)}.frame.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast('Cópia do projeto baixada. Arquivos de mídia precisam ser importados separadamente.');
    } catch (error) {
      console.error('Não foi possível exportar o projeto.', error);
      showToast('Falha ao exportar o projeto. Tente novamente.', true);
    }
  }

  function safeFilename(name) {
    return name.normalize('NFKD').replace(/[\u0300-\u036f]/gu, '').replace(/[^a-zA-Z0-9_-]+/gu, '-').replace(/^-|-$/gu, '').toLocaleLowerCase('en') || 'projeto-frame';
  }

  function bindEvents() {
    $$('.nav-item').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.view)));
    $$('[data-view-link]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); navigate(link.dataset.viewLink); }));
    $$('[data-go]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.go)));
    $('#menu-toggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    bindProjectField('#project-title', 'title');
    bindProjectField('#video-idea', 'idea');
    bindProjectField('#video-tone', 'tone', 'change');
    bindProjectField('#video-duration', 'duration', 'change');
    bindProjectField('#target-audience', 'audience');
    bindProjectField('#script-content', 'script');
    bindProjectField('#audio-idea', 'audioIdea');
    bindProjectField('#thumbnail-concept', 'thumbnailConcept');
    bindProjectField('#thumbnail-text', 'thumbnailText');
    bindProjectField('#thumbnail-color', 'thumbnailPalette', 'change');
    $('#scene-format').addEventListener('change', (event) => { project.sceneFormat = event.target.value; saveProject(); });
    $('#build-outline').addEventListener('click', buildOutline);
    $('#copy-script-prompt').addEventListener('click', () => copyText(makePrompt('script'), 'Briefing de roteiro copiado. Abra o serviço de escrita escolhido.'));
    $('#script-to-scenes').addEventListener('click', scriptToScenes);
    $('#split-script').addEventListener('click', scriptToScenes);
    $('#add-scene').addEventListener('click', addScene);
    $('#copy-audio-prompt').addEventListener('click', () => copyText(makePrompt('audio'), 'Briefing de áudio copiado. Agora abra o Suno ou Moises.'));
    $('#audio-import').addEventListener('click', () => $('#audio-input').click());
    $('#audio-input').addEventListener('change', (event) => addMedia(event.target.files));
    $('#copy-thumbnail-prompt').addEventListener('click', () => copyText(makePrompt('thumbnail'), 'Prompt de thumbnail copiado. Abra o gerador de imagem escolhido.'));
    $('#thumbnail-layout').addEventListener('change', updateThumbnail);
    $('#preview-play').addEventListener('click', togglePreview);
    $('#preview-play-small').addEventListener('click', togglePreview);
    $('#preview-scrubber').addEventListener('input', (event) => {
      const duration = Math.max(10, project.scenes.reduce((total, scene) => total + (Number(scene.duration) || 5), 0));
      previewSeconds = Math.round((Number(event.target.value) / 100) * duration);
      $('#preview-clock').textContent = formatSeconds(previewSeconds);
      $('#preview-time').textContent = `${formatSeconds(previewSeconds)} / ${formatSeconds(duration)}`;
    });
    $('#fit-preview').addEventListener('click', () => {
      project.sceneFormat = $('#scene-format').value;
      $('#preview-aspect').textContent = project.sceneFormat.startsWith('9:16') ? '9:16' : project.sceneFormat.startsWith('1:1') ? '1:1' : '16:9';
      $('#video-preview').style.aspectRatio = project.sceneFormat.startsWith('9:16') ? '9/12' : project.sceneFormat.startsWith('1:1') ? '1/1' : '16/9';
      showToast(`Prévia ajustada para ${$('#preview-aspect').textContent}.`);
    });
    $('#timeline-zoom').addEventListener('click', () => changeZoom(-10));
    $('#timeline-zoom-in').addEventListener('click', () => changeZoom(10));
    $('#upload-media').addEventListener('click', () => $('#media-input').click());
    $('#media-input').addEventListener('change', (event) => { addMedia(event.target.files); event.target.value = ''; });
    $('#media-drop').addEventListener('click', () => $('#media-input').click());
    $('#media-drop').addEventListener('dragover', (event) => { event.preventDefault(); $('#media-drop').classList.add('dragover'); });
    $('#media-drop').addEventListener('dragleave', () => $('#media-drop').classList.remove('dragover'));
    $('#media-drop').addEventListener('drop', (event) => { event.preventDefault(); $('#media-drop').classList.remove('dragover'); addMedia(event.dataTransfer.files); });
    $('#export-project').addEventListener('click', exportProject);
    $('#export-editing').addEventListener('click', exportProject);
    $('#download-backup').addEventListener('click', exportProject);
    $('#clear-project').addEventListener('click', clearProject);
  }

  function changeZoom(amount) {
    zoom = Math.min(150, Math.max(50, zoom + amount));
    $('#zoom-level').textContent = `${zoom}%`;
    $('#video-track').style.transform = `scaleX(${zoom / 100})`;
    $('#video-track').style.transformOrigin = 'left center';
  }

  function clearProject() {
    if (!window.confirm('Apagar o rascunho salvo neste navegador? Esta ação não pode ser desfeita.')) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      project = blankProject();
      setFormValues();
      renderScenes();
      renderMedia();
      renderTimeline();
      showToast('Dados do projeto removidos deste navegador.');
      navigate('overview');
    } catch (error) {
      console.error('Não foi possível limpar os dados locais.', error);
      showToast('Não foi possível limpar os dados locais.', true);
    }
  }

  function togglePreview() {
    const playing = setPreviewPlaying();
    const symbol = playing ? '#i-pause' : '#i-play';
    $('#preview-play').querySelector('use').setAttribute('href', symbol);
    $('#preview-play-small').querySelector('use').setAttribute('href', symbol);
    $('#preview-play').setAttribute('aria-label', playing ? 'Pausar prévia' : 'Reproduzir prévia');
  }

  function init() {
    renderProviderLinks('#writing-tools', ['writing'], true);
    renderProviderLinks('#audio-tools', ['audio'], true);
    renderProviderLinks('#image-tools', ['image'], true);
    renderCategories();
    setFormValues();
    renderScenes();
    renderMedia();
    renderTimeline();
    bindEvents();
    $('#preview-caption').textContent = project.title.trim().toLocaleUpperCase('pt-BR') || 'SUA PRÓXIMA GRANDE IDEIA';
  }

  init();
})();
