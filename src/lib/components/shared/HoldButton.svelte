<script lang="ts">
  import { createEventDispatcher } from "svelte"

  /** How long the user must hold before the action fires, in milliseconds. */
  export let holdDuration = 1000
  export let danger = false

  const dispatch = createEventDispatcher()

  let holding = false
  let progress = 0
  let rafId: number
  let startTime: number

  function startHold() {
    if (holding) return
    holding = true
    startTime = performance.now()
    rafId = requestAnimationFrame(tick)
  }

  function tick(now: number) {
    if (!holding) return
    progress = Math.min(((now - startTime) / holdDuration) * 100, 100)
    if (progress >= 100) {
      reset()
      dispatch("confirm")
    } else {
      rafId = requestAnimationFrame(tick)
    }
  }

  function reset() {
    holding = false
    progress = 0
    cancelAnimationFrame(rafId)
  }
</script>

<button
  class="relative overflow-hidden select-none {danger ? 'btn-danger' : 'btn-primary'}"
  title="Hold to confirm"
  on:mousedown={startHold}
  on:mouseup={reset}
  on:mouseleave={reset}
  on:contextmenu={reset}
  on:touchstart|preventDefault={startHold}
  on:touchend={reset}
  on:touchcancel={reset}
>
  <span class="absolute inset-0 bg-white/25 origin-left pointer-events-none" style="transform: scaleX({progress / 100})" />
  <span class="relative z-10 inline-flex items-center gap-2"><slot /></span>
</button>
