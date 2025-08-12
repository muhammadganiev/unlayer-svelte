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
    <button onclick={loadSample}>Load sample</button>
    <button onclick={doExport}>Export HTML</button>
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
          <h3>Preview</h3>
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
  .editor { flex: 1; min-height: 0; }
  .editor :global(.unlayer-container) { height: calc(100vh - 49px); }
  .error { color: #b91c1c; margin-left: auto; }

  .modal { position: fixed; inset: 0; display: grid; place-items: center; z-index: 50; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.5); border: 0; cursor: pointer; }
  .modal-content { position: relative; background: white; border-radius: 8px; width: min(1000px, 95vw); height: min(85vh, 900px); display: flex; flex-direction: column; overflow: hidden; z-index: 51; }
  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
  iframe { border: 0; width: 100%; height: 100%; }
</style>
