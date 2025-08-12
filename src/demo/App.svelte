<script lang="ts">
  import UnlayerEditor from '../lib/UnlayerEditor.svelte'

  let editorRef: InstanceType<typeof UnlayerEditor> | null = null
  let previewOpen = $state(false)
  let previewHtml = $state('')
  let lastDesign: any = null
  let errorMsg = $state<string | null>(null)
  let editorReady = $state(false)
  let hasDesign = $state(false)
  let sampleLoaded = $state(false)

  const options = { displayMode: 'email' }

  const emptyTemplate = {
    type: 'template',
    version: '2.1.0',
    template: { body: { rows: [] }, counters: {}, values: { backgroundColor: '#ffffff' } },
  }

  function computeHasContent(d: any): boolean {
    const t = d?.template ?? d
    const rows = t?.body?.rows
    if (!Array.isArray(rows) || rows.length === 0) return false
    for (const r of rows) {
      const cols = r?.columns
      if (!Array.isArray(cols)) continue
      for (const c of cols) {
        const contents = c?.contents
        if (Array.isArray(contents) && contents.length > 0) return true
      }
    }
    return false
  }

  async function loadSample() {
    try {
      const res = await fetch('/welcome.json')
      const json = await res.json()
      lastDesign = json
      hasDesign = computeHasContent(json)
      sampleLoaded = true
      editorRef?.loadDesign(json)
    } catch (e) {
      errorMsg = 'Failed to load sample design'
      console.error(e)
    }
  }

  function clearSample() {
    if (!editorRef) return
    editorRef.loadDesign(emptyTemplate)
    lastDesign = emptyTemplate
    hasDesign = false
    sampleLoaded = false
    previewHtml = ''
  }

  function doExport() {
    if (!editorReady) return
    editorRef?.exportHtml()
  }

  function onExport(e: CustomEvent<{ html: string; design: unknown }>) {
    previewHtml = e.detail.html
    previewOpen = true
  }

  function onUpdated(e: CustomEvent<any>) {
    lastDesign = e.detail
    hasDesign = computeHasContent(e.detail)
  }

  function onLoaded() {
    editorReady = true
    hasDesign = computeHasContent(lastDesign)
  }

  function onError(e: CustomEvent<{ message: string }>) {
    errorMsg = e.detail.message
  }

  function downloadHtml() {
    const html = previewHtml || ''
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'design.html'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
</script>

<div class="page">
  <header class="toolbar">
    <a class="brand" href="https://unlayer.com" target="_blank" rel="noreferrer">
      <img src="https://unlayer.com/_next/image?url=%2Fimages%2Flogo.webp&w=384&q=75" alt="Unlayer" />
    </a>
    <div class="actions">
      {#if sampleLoaded && hasDesign}
        <button class="btn btn-danger btn-icon" onclick={clearSample} disabled={!editorReady} aria-label="Clear sample">
          <!-- updated clear icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
            <g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4">
              <path stroke-linecap="round" d="M20 5.914h8v8h15v8H5v-8h15z" clip-rule="evenodd"/>
              <path d="M8 40h32V22H8z"/>
              <path stroke-linecap="round" d="M16 39.898v-5.984m8 5.984v-6m8 6v-5.984M12 40h24"/>
            </g>
          </svg>
        </button>
      {/if}
      <button class="btn" onclick={loadSample} disabled={!editorReady} title={!editorReady ? 'Editor is loading…' : undefined}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 3v10m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Load sample</span>
      </button>
      <button class="btn btn-outline" onclick={doExport} disabled={!editorReady} title={!editorReady ? 'Editor is loading…' : undefined}>
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
      on:loaded={onLoaded}
      on:export-html={onExport}
      on:design-updated={onUpdated}
      on:error={onError}
    />
  </section>

  {#if previewOpen}
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-content">
        <header class="modal-header">
          <h3><span style="font-family: Arial, Helvetica, sans-serif;">Preview</span></h3>
          <div class="modal-actions">
            <button class="btn btn-outline" onclick={downloadHtml} aria-label="Download HTML">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 3v10m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Download</span>
            </button>
            <button aria-label="Close" onclick={() => (previewOpen = false)}>✕</button>
          </div>
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

  .toolbar .btn, .modal .btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; border: 1px solid #0f172a; background: #111827; color: #fff; font-weight: 500; line-height: 1; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
  .toolbar .btn:hover, .modal .btn:hover { background: #0f172a; }
  .toolbar .btn:focus-visible, .modal .btn:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }
  .toolbar .btn:disabled, .modal .btn:disabled { background: #f3f4f6; color: #9ca3af; border-color: #e5e7eb; cursor: not-allowed; pointer-events: none; box-shadow: none; }
  .toolbar .btn.btn-outline, .modal .btn.btn-outline { background: #ffffff; color: #111827; border-color: #e5e7eb; }
  .toolbar .btn.btn-outline:hover, .modal .btn.btn-outline:hover { background: #f8fafc; border-color: #d1d5db; }
  .toolbar .btn.btn-outline:disabled, .modal .btn.btn-outline:disabled { background: #f9fafb; color: #9ca3af; border-color: #e5e7eb; }
  .toolbar .btn.btn-danger { background: #dc2626; border-color: #b91c1c; color: #fff; }
  .toolbar .btn.btn-danger:hover { background: #b91c1c; }
  .toolbar .btn.btn-danger:disabled { background: #fef2f2; color: #fca5a5; border-color: #fecaca; }
  .toolbar .btn.btn-icon { padding: 8px; }

  .editor { flex: 1; min-height: 0; }
  .editor :global(.unlayer-container) { height: calc(100vh - 49px); }
  .error { color: #b91c1c; margin-left: 8px; }

  .modal { position: fixed; inset: 0; display: grid; place-items: center; z-index: 50; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.5); border: 0; cursor: pointer; }
  .modal-content { position: relative; background: white; border-radius: 8px; width: min(1000px, 95vw); height: min(85vh, 900px); display: flex; flex-direction: column; overflow: hidden; z-index: 51; }
  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
  .modal-actions { display: inline-flex; gap: 8px; align-items: center; }
  iframe { border: 0; width: 100%; height: 100%; }
</style>
