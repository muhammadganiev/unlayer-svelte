<script lang="ts">
  import UnlayerEditor from '../lib/UnlayerEditor.svelte'

  let editorRef: InstanceType<typeof UnlayerEditor> | null = null
  let previewOpen = $state(false)
  let previewHtml = $state('')
  let lastDesign: any = null
  let errorMsg = $state<string | null>(null)

  const options = { displayMode: 'email' }

  async function loadSample() {
    try {
      const res = await fetch('/welcome.json')
      const json = await res.json()
      lastDesign = json
      editorRef?.loadDesign(json)
    } catch (e) {
      errorMsg = 'Failed to load sample design'
      console.error(e)
    }
  }

  function doExport() {
    editorRef?.exportHtml()
  }

  function onExport(e: CustomEvent<{ html: string; design: unknown }>) {
    previewHtml = e.detail.html
    previewOpen = true
  }

  function onUpdated(e: CustomEvent<any>) {
    lastDesign = e.detail
  }

  function onError(e: CustomEvent<{ message: string }>) {
    errorMsg = e.detail.message
  }
</script>

<div class="page">
  <header class="toolbar">
    <a class="brand" href="https://unlayer.com" target="_blank" rel="noreferrer">
      <img src="https://unlayer.com/_next/image?url=%2Fimages%2Flogo.webp&w=384&q=75" alt="Unlayer" />
    </a>
    <div class="actions">
      <button class="btn" onclick={loadSample}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 3v10m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Load sample</span>
      </button>
      <button class="btn btn-outline" onclick={doExport}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M14 3h7v7m0-7L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 14v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Export HTML</span>
      </button>
    </div>
    {#if errorMsg}
      <span class="error">{errorMsg}</span>
    {/if}
  </header>

  <section class="editor">
    <UnlayerEditor
      bind:this={editorRef}
      {options}
      on:loaded
      on:export-html={onExport}
      on:design-updated={onUpdated}
      on:error={onError}
    />
  </section>

  {#if previewOpen}
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-content">
        <header class="modal-header">
          <h3 ><span style="font-family:Arial, Helvetica, sans-serif;">Preview</span> </h3>
          <button aria-label="Close" onclick={() => (previewOpen = false)}>✕</button>
        </header>
        <iframe srcdoc={previewHtml} title="preview"></iframe>
      </div>
      <button class="backdrop" aria-label="Close preview" onclick={() => (previewOpen = false)}></button>
    </div>
  {/if}
</div>

<style>
  .page { height: 100vh; display: flex; flex-direction: column; }
  .toolbar { padding: 8px; border-bottom: 1px solid #e5e7eb; display: flex; gap: 8px; align-items: center; }
  .brand img { height: 24px; display: block; }
  .actions { margin-left: auto; display: inline-flex; gap: 8px; align-items: center; }

  /* Unlayer-like buttons */
  .toolbar .btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; border: 1px solid #0f172a; background: #111827; color: #fff; font-weight: 500; line-height: 1; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
  .toolbar .btn:hover { background: #0f172a; }
  .toolbar .btn:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }

  .toolbar .btn.btn-outline { background: #ffffff; color: #111827; border-color: #e5e7eb; }
  .toolbar .btn.btn-outline:hover { background: #f8fafc; border-color: #d1d5db; }

  .editor { flex: 1; min-height: 0; }
  .editor :global(.unlayer-container) { height: calc(100vh - 49px); }
  .error { color: #b91c1c; margin-left: 8px; }

  .modal { position: fixed; inset: 0; display: grid; place-items: center; z-index: 50; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.5); border: 0; cursor: pointer; }
  .modal-content { position: relative; background: white; border-radius: 8px; width: min(1000px, 95vw); height: min(85vh, 900px); display: flex; flex-direction: column; overflow: hidden; z-index: 51; }
  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
  iframe { border: 0; width: 100%; height: 100%; }
</style>
