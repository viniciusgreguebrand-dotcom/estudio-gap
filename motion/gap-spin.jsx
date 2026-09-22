/**
 * GAP · giro dos aneis (teste de pipeline: codigo -> composicao pronta no After Effects)
 *
 * Monta sozinho: comp, fundo, 3 aneis com letra dentro, um eixo de giro para cada
 * anel e um controle de zoom. Reproduz a animacao do site: cada anel da UMA volta
 * no proprio eixo, comecando quando o anterior ja girou 10% da volta dele, enquanto
 * o conjunto inteiro cresce.
 *
 * Como usar: After Effects > Arquivo > Scripts > Executar arquivo de script... > este arquivo.
 *
 * Todos os numeros que importam estao em AJUSTES, logo abaixo.
 */

(function () {
  // ----------------------------------------------------------------- AJUSTES
  var CFG = {
    nome: 'GAP · giro',
    largura: 1080,
    altura: 1080,
    fps: 30,
    duracao: 6,          // segundos

    fundo: [0, 0, 0],    // preto
    traco: [1, 1, 1],    // aneis e letras em branco

    diametro: 300,       // diametro de cada anel, em pixels
    espessura: 26,       // espessura do traco do anel
    sobreposicao: 0.82,  // 1 = aneis encostando; menor = mais sobrepostos
    corpoLetra: 150,     // tamanho da letra dentro do anel
    fonte: 'Inter-Bold', // se nao existir na maquina, cai na fonte padrao

    giroInicio: 0.6,     // quando o primeiro anel comeca a girar (segundos)
    giroDuracao: 2.0,    // quanto dura UMA volta completa (segundos)
    atraso: 0.10,        // atraso entre um anel e o outro, em fracao da volta (0.10 = 10%)

    zoomDe: 100,         // escala no inicio (%)
    zoomAte: 420,        // escala no fim (%)
    zoomInicio: 0.6,     // quando o zoom comeca (segundos)
    zoomFim: 6.0         // quando o zoom termina (segundos)
  };
  // --------------------------------------------------------------------------

  var LETRAS = ['G', 'A', 'P'];

  function suavizar(prop, velocidadeEntrada, velocidadeSaida) {
    // curva suave em todos os keyframes da propriedade
    var dim = prop.value instanceof Array ? prop.value.length : 1;
    for (var k = 1; k <= prop.numKeys; k++) {
      var entra = [], sai = [];
      for (var d = 0; d < dim; d++) {
        entra.push(new KeyframeEase(0, velocidadeEntrada));
        sai.push(new KeyframeEase(0, velocidadeSaida));
      }
      prop.setTemporalEaseAtKey(k, entra, sai);
    }
  }

  function criarAnel(comp, centroX, centroY, nome) {
    var l = comp.layers.addShape();
    l.name = nome;
    var grupo = l.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group');
    var conteudo = grupo.property('ADBE Vectors Group');
    var elipse = conteudo.addProperty('ADBE Vector Shape - Ellipse');
    elipse.property('ADBE Vector Ellipse Size').setValue([CFG.diametro, CFG.diametro]);
    var traco = conteudo.addProperty('ADBE Vector Graphic - Stroke');
    traco.property('ADBE Vector Stroke Color').setValue([CFG.traco[0], CFG.traco[1], CFG.traco[2], 1]);
    traco.property('ADBE Vector Stroke Width').setValue(CFG.espessura);
    l.threeDLayer = true;
    l.property('ADBE Transform Group').property('ADBE Position').setValue([centroX, centroY, 0]);
    return l;
  }

  function criarLetra(comp, texto, centroX, centroY, nome) {
    var l = comp.layers.addText(texto);
    l.name = nome;
    var src = l.property('ADBE Text Properties').property('ADBE Text Document');
    var doc = src.value;
    doc.fontSize = CFG.corpoLetra;
    doc.fillColor = CFG.traco;
    doc.applyFill = true;
    doc.applyStroke = false;
    doc.justification = ParagraphJustification.CENTER_JUSTIFY;
    try { doc.font = CFG.fonte; } catch (e) { /* fonte ausente: mantem a padrao */ }
    src.setValue(doc);
    l.threeDLayer = true;
    // o texto nasce apoiado na linha de base: desce um pouco para centralizar no anel
    l.property('ADBE Transform Group').property('ADBE Position')
      .setValue([centroX, centroY + CFG.corpoLetra * 0.36, 0]);
    return l;
  }

  function criarEixo(comp, centroX, centroY, nome) {
    var n = comp.layers.addNull(CFG.duracao);
    n.name = nome;
    n.threeDLayer = true;
    n.property('ADBE Transform Group').property('ADBE Position').setValue([centroX, centroY, 0]);
    return n;
  }

  // ------------------------------------------------------------------ montagem
  app.beginUndoGroup('Montar ' + CFG.nome);

  var comp = app.project.items.addComp(CFG.nome, CFG.largura, CFG.altura, 1, CFG.duracao, CFG.fps);
  comp.bgColor = CFG.fundo;
  try { comp.renderer = 'ADBE Advanced 3D'; } catch (e) { /* versoes antigas: 3D classico */ }
  comp.openInViewer();

  var fundo = comp.layers.addSolid(CFG.fundo, 'FUNDO', CFG.largura, CFG.altura, 1);
  fundo.locked = true;

  var meioX = CFG.largura / 2;
  var meioY = CFG.altura / 2;

  // controle de zoom: tudo pendurado nele
  var zoom = criarEixo(comp, meioX, meioY, 'ZOOM (controle)');
  var escala = zoom.property('ADBE Transform Group').property('ADBE Scale');
  escala.setValueAtTime(CFG.zoomInicio, [CFG.zoomDe, CFG.zoomDe, CFG.zoomDe]);
  escala.setValueAtTime(CFG.zoomFim, [CFG.zoomAte, CFG.zoomAte, CFG.zoomAte]);
  suavizar(escala, 85, 20); // sai devagar, ganha corpo, chega desacelerando

  var passo = CFG.diametro * CFG.sobreposicao;
  var primeiroX = meioX - passo;

  for (var i = 0; i < LETRAS.length; i++) {
    var cx = primeiroX + passo * i;
    var letra = LETRAS[i];

    var eixo = criarEixo(comp, cx, meioY, 'EIXO ' + letra);
    var anel = criarAnel(comp, cx, meioY, 'ANEL ' + letra);
    var txt = criarLetra(comp, letra, cx, meioY, 'LETRA ' + letra);

    // uma volta completa no proprio eixo, cada um entrando 10% depois do anterior
    var comeca = CFG.giroInicio + CFG.giroDuracao * CFG.atraso * i;
    var giro = eixo.property('ADBE Transform Group').property('ADBE Rotate Y');
    giro.setValueAtTime(comeca, 0);
    giro.setValueAtTime(comeca + CFG.giroDuracao, 360);
    suavizar(giro, 60, 60);

    anel.parent = eixo;
    txt.parent = eixo;
    eixo.parent = zoom;
  }

  app.endUndoGroup();
  alert('Pronto: composicao "' + CFG.nome + '" montada.\n\n' +
        'Aperte a barra de espaco para ver.\n' +
        'Para mudar o ritmo, edite o bloco AJUSTES no topo do arquivo e rode o script de novo.');
})();
