# Estúdio GAP — Design System (base: Hyer Aviation / Refero)

Fonte: https://styles.refero.design/style/f61cf515-ccd5-4494-bdd1-be9fe4d7258c

## Cores
| Token | Valor | Uso |
|---|---|---|
| --ink | #000d10 | Texto primário, botões preenchidos, footer |
| --white | #ffffff | Canvas, cards |
| --ash | #8e8e95 | Texto secundário, nav, labels |
| --pebble | #d5d3d4 | Hairlines, divisores |
| --midnight | #0f0f1c | Faixas escuras |
| --charcoal | #151623 | Painéis escuros elevados |
| --clay | #bc7155 | Acento único — 1 card em destaque por página |

## Tipografia
- Uma única família: Helvetica Now Display (substituto: Inter / Neue Haas Grotesk / Helvetica Neue)
- Pesos: 400 (corpo), 700 (títulos, de 23px pra cima — não usar light)
- Escala: 17 / 18 / 20 / 23 / 30 / 37 / 52 / 63 / 131 / 187px
- Line-height: 0.8 display → 1.0 headings → 1.61 corpo (18/29)
- Tracking negativo forte: -0.02em nos displays
- Títulos de hero terminam com ponto final. "Beyond Travel."

## Formas
- Botões e nav: pill (radius 1000px)
- Cards / painéis hero: 0px radius (hard-edged)
- Sem sombras — elevação só por mudança de cor de superfície
- Max-width 1200px · gap entre seções 80px · card padding 22px

## Componentes
- Botão primário: fundo #000d10, texto branco, pill, 15px 22px, 17px/700
- Botão ghost: transparente, borda 1px branca, pill (em fundos escuros)
- Botão ícone circular: #000d10, ícone branco
- Card destaque (clay): #bc7155, branco, 0px radius, padding 53px 59px — só 1 por página
- Feature block: hairline #d5d3d4 acima, título 23px/700, corpo 18px/400 em #8e8e95; grid 2 colunas
- Faixa escura: #0f0f1c ou #151623, título branco 30–37px, conteúdo alinhado à direita
- Footer: #000d10, wordmark grande, links #8e8e95 20px

## Layout
- Faixas full-bleed alternando branco → escuro; o contraste separa, não divisórias
- Hero assimétrico: wordmark gigante à esquerda, headline de 2 linhas à direita
- Seções de conteúdo com gravidade à direita (coluna única + grid 2x2)
