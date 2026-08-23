# LP Quantum · Cavenaghi

Landing page da linha Quantum Rehab, distribuída pela Cavenaghi.

## Como publicar

Suba **todo o conteúdo desta pasta na raiz do repositório**, mantendo a
estrutura de diretórios. Não é preciso build nem instalar nada — é um site
estático.

```
index.html          página
support.js          runtime da página
chair3d.js          cena 3D da cadeira (three.js)
lib/                GSAP + ScrollTrigger
img/                logotipos, fotos e imagens do produto
```

Importante: as pastas `lib/` e `img/` precisam subir junto. Se o `index.html`
ficar sozinho, os logotipos e a cadeira 3D não carregam.

## Dependências externas

Carregadas por CDN, exigem internet:

- **three.js 0.184.0** (unpkg) — cena 3D da cadeira
- **Google Fonts** — Schibsted Grotesk, Poppins, DM Mono

## Identidade

| Uso | Cor |
| --- | --- |
| Azul institucional | `#172136` |
| Amarelo de destaque | `#FAAB2E` |
| Texto corrido | `#444444` |
| Amarelo escuro (textos pequenos, para contraste) | `#8A5E06` |
