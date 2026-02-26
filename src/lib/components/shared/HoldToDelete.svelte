<script lang="ts">
  import { createEventDispatcher } from "svelte"

  let klass = "btn-ghost p-2 hover:text-red-400"
  export { klass as class }
  export let label = "Delete"
  export let iconSize = "w-4 h-4"

  const DURATION = 1000
  const dispatch = createEventDispatcher()

  let holding = false
  let progress = 0
  let animFrame: number | null = null
  let startTime: number | null = null

  function startHold(e: MouseEvent | TouchEvent) {
    e.preventDefault()
    holding = true
    startTime = Date.now()
    animFrame = requestAnimationFrame(tick)
  }

  function tick() {
    if (!holding || startTime === null) return
    const elapsed = Date.now() - startTime
    progress = Math.min(elapsed / DURATION, 1)
    if (progress >= 1) {
      finish()
    } else {
      animFrame = requestAnimationFrame(tick)
    }
  }

  function cancelHold() {
    if (!holding) return
    holding = false
    progress = 0
    startTime = null
    if (animFrame !== null) {
      cancelAnimationFrame(animFrame)
      animFrame = null
    }
  }

  function finish() {
    holding = false
    progress = 0
    startTime = null
    animFrame = null
    dispatch("confirm")
  }
</script>

<button
  type="button"
  aria-label={label}
  class="relative overflow-hidden select-none {klass}"
  on:mousedown={startHold}
  on:mouseup={cancelHold}
  on:mouseleave={cancelHold}
  on:touchstart|preventDefault={startHold}
  on:touchend={cancelHold}
  on:touchcancel={cancelHold}
>
  {#if progress > 0}
    <span class="absolute inset-y-0 left-0 bg-red-500/20 pointer-events-none" style="width: {progress * 100}%"></span>
  {/if}
  <span class="relative flex items-center gap-1.5">
    <slot>
      <svg class={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </slot>
  </span>
</button>
