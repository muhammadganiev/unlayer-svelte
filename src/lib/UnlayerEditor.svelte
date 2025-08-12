<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'

  // Minimal Unlayer types
  type UnlayerHtmlExport = { html: string; design: unknown }
  type UnlayerEvent = 'editor:ready' | 'design:updated'
  interface Unlayer {
    init(options: Record<string, any>): void
    destroy(): void
    addEventListener(ev: UnlayerEvent, cb: (...args: any[]) => void): void
    removeEventListener?(ev: UnlayerEvent, cb: (...args: any[]) => void): void
    loadDesign(design: any): void
    getDesign(cb: (design: any) => void): void
    exportHtml(cb: (result: UnlayerHtmlExport) => void): void
    setDisplayMode?(mode: 'email' | 'web' | string): void
  }

  const { design, options, tools } = $props<{
    design?: Record<string, any>
    options?: Record<string, any>
    tools?: { whitelist?: string[]; blacklist?: string[] }
  }>()

  const dispatch = createEventDispatcher<{
    loaded: void
    'design-updated': any
    'export-html': UnlayerHtmlExport
    error: { message: string; error?: unknown }
  }>()

  let containerEl: HTMLDivElement | null = null
  const containerId = `unlayer-editor-${Math.random().toString(36).slice(2)}`
  let editorInitialized = false
  let lastLoadedDesignKey: string | null = null
  let pendingDesign: any | null = null

  /**
   * Compute a stable key for a design object to detect external changes
   * and avoid redundant loads/loops.
   */
  function hashDesign(d: any | undefined): string | null {
    try {
      return d ? JSON.stringify(d) : null
    } catch {
      return Math.random().toString(36)
    }
  }

  /**
   * Normalize incoming design objects to the shape expected by Unlayer.
   * Accepts either raw designs or an object with a `template` wrapper.
   */
  function normalizeDesign(d: any) {
    if (!d) return d
    if (d.template && typeof d.template === 'object') return d.template
    return d
  }

  /**
   * Ensure the Unlayer embed script is present and resolved to a usable instance.
   * Loads the CDN script once and reuses the global singleton on subsequent calls.
   */
  async function ensureUnlayerLoaded(): Promise<Unlayer> {
    const w = window as any
    if (w.unlayer) return w.unlayer as Unlayer
    // Load from CDN
    const src = 'https://editor.unlayer.com/embed.js'
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`)
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error('Failed to load Unlayer script')), { once: true })
        return
      }
      const s = document.createElement('script')
      s.src = src
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load Unlayer script'))
      document.head.appendChild(s)
    })
    const unlayer = (window as any).unlayer as Unlayer | undefined
    if (!unlayer) throw new Error('Unlayer failed to initialize')
    return unlayer
  }

  /**
   * Build a partial tools configuration enabling/disabling specific tools
   * based on provided whitelist/blacklist.
   */
  function buildToolsConfig() {
    const cfg: Record<string, any> = {}
    if (tools?.blacklist) {
      for (const t of tools.blacklist) cfg[t] = { enabled: false }
    }
    if (tools?.whitelist) {
      for (const t of tools.whitelist) cfg[t] = { enabled: true }
    }
    return cfg
  }

  let unlayerRef: Unlayer | null = null

  /**
   * Initialize the Unlayer editor, wire up core event listeners, and optionally
   * load a pending or initial design once the editor is ready.
   */
  async function initEditor() {
    try {
      const unlayer = await ensureUnlayerLoaded()
      unlayerRef = unlayer
      const initOptions: Record<string, any> = {
        id: containerId,
        displayMode: 'email',
        ...(options ?? {}),
      }
      const toolsConfig = buildToolsConfig()
      if (Object.keys(toolsConfig).length) {
        initOptions.tools = { ...(options?.tools || {}), ...toolsConfig }
      }

      unlayer.init(initOptions)

      const onReady = () => {
        editorInitialized = true
        // Apply displayMode if provided via options
        try { unlayer.setDisplayMode?.(options?.displayMode as any) } catch {}
        // Load initial design if provided or pending
        const toLoad = normalizeDesign(pendingDesign ?? design)
        if (toLoad) {
          lastLoadedDesignKey = hashDesign(toLoad)
          try { unlayer.loadDesign(toLoad) } catch {}
        }
        pendingDesign = null
        dispatch('loaded')
      }

      const onDesignUpdated = () => {
        try {
          unlayer.getDesign((d) => {
            dispatch('design-updated', d)
          })
        } catch {}
      }

      unlayer.addEventListener('editor:ready', onReady)
      unlayer.addEventListener('design:updated', onDesignUpdated)
    } catch (error) {
      dispatch('error', { message: 'Failed to initialize Unlayer editor', error })
    }
  }

  /**
   * Export the current design as HTML and emit the result via `export-html`.
   */
  export function exportHtml() {
    const unlayer = unlayerRef
    if (!unlayer) return
    try {
      unlayer.exportHtml((res) => {
        dispatch('export-html', res)
      })
    } catch (error) {
      dispatch('error', { message: 'Failed to export HTML', error })
    }
  }

  /**
   * Load a new design into the editor, or defer until initialization completes.
   */
  export function loadDesign(newDesign: any) {
    const unlayer = unlayerRef
    const normalized = normalizeDesign(newDesign)
    if (!unlayer || !editorInitialized) {
      pendingDesign = normalized
      return
    }
    try {
      lastLoadedDesignKey = hashDesign(normalized)
      unlayer.loadDesign(normalized)
    } catch (error) {
      dispatch('error', { message: 'Failed to load design', error })
    }
  }

  // Watch external `design` prop and load it when it changes (avoids reload loops)
  $effect(() => {
    if (!design) return
    const normalized = normalizeDesign(design)
    if (!normalized) return
    if (!editorInitialized) {
      pendingDesign = normalized
      return
    }
    const key = hashDesign(normalized)
    if (key && key !== lastLoadedDesignKey) {
      loadDesign(normalized)
    }
  })

  // Initialize editor lifecycle
  onMount(() => {
    initEditor()
  })

  // Cleanup editor lifecycle
  onDestroy(() => {
    try {
      unlayerRef?.destroy()
    } catch {
      // ignore
    }
    unlayerRef = null
    editorInitialized = false
  })
</script>

<div bind:this={containerEl} id={containerId} class="unlayer-container"></div>

<style>
  :global(html, body, #app) { height: 100%; }
  :global(#app) { display: contents; }
  .unlayer-container {
    width: 100%;
    height: 100%;
    min-height: 400px;
  }
</style>
