# Unlayer Svelte

Svelte 5 + TypeScript SDK wrapper for the Unlayer Email Editor, plus a minimal demo.

## Quick start

- Install
  - npm: `npm i`
- Run demo
  - `npm run dev:demo` then open http://localhost:5173
- Build library
  - `npm run build` (outputs `dist/`)
- Build demo (static)
  - `npm run build:demo` (outputs `dist-demo/`)

## Local development

- `npm run dev` will also run the demo by default. Edit files under `src/lib` and `src/demo`.

## Usage (library)

Install the package (locally, this repo exports the Svelte component).

Example:

```svelte
<script lang="ts">
  import UnlayerEditor from 'unlayer-svelte'

  let editor: InstanceType<typeof UnlayerEditor>

  const options = { displayMode: 'email' }

  function exportHtml() {
    editor.exportHtml()
  }

  function onExport(e: CustomEvent<{ html: string; design: unknown }>) {
    console.log('HTML:', e.detail.html)
  }
</script>

<UnlayerEditor bind:this={editor} {options} on:export-html={onExport} />
```

Props:

- `design?: object` initial JSON design
- `options?: Record<string, any>` Unlayer init options (e.g. `{ displayMode: 'email' }`)
- `tools?: { whitelist?: string[]; blacklist?: string[] }` simple tools enable/disable helper

Events:

- `loaded` – editor ready
- `design-updated` – emits updated JSON design
- `export-html` – emits `{ html, design }`
- `error` – when initialization or actions fail

Public methods via `bind:this`:

- `exportHtml()`
- `loadDesign(design)`

## Demo app

Located under `src/demo/`. The main page renders the editor with controls to load `public/welcome.json`, export HTML, and preview it in a modal.

Commands:

- `npm run dev:demo` – start dev server for demo
- `npm run build:demo` – build static demo to `dist-demo/`

## Architecture notes

- The wrapper lazily loads Unlayer via the official CDN `https://editor.unlayer.com/embed.js` as a fallback, avoiding direct npm bundling issues and keeping bundle small.
- Initialization occurs in `onMount`; `destroy()` is called in `onDestroy` to prevent leaks.
- Events are re-emitted as Svelte component events. Design updates are read via `getDesign`.
- Tools whitelist/blacklist is transformed into Unlayer `tools` config (`{ toolName: { enabled: boolean } }`).
- The container fills available space; the demo sets full-height layout for convenience.

## Possible improvements

- Add full TypeScript type definitions for Unlayer API.
- Expose more helpers (save image, merge tags, custom tools).
- Configurable CDN and script loading strategy.
- SSR guards for environments without `window`.

## Deploying the demo

- Vercel: set Build Command to `npm run build:demo`, Output Directory to `dist-demo`.
- Alternatively, run `npm run build:demo` and deploy `dist-demo/` to any static host.
