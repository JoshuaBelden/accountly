<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import HoldButton from "./HoldButton.svelte"
  import Modal from "./Modal.svelte"

  export let open = false
  export let title = "Are you sure?"
  export let message = ""
  export let confirmLabel = "Confirm"
  export let danger = false
  export let showExport = false

  const dispatch = createEventDispatcher()

  function confirm() {
    dispatch("confirm")
    open = false
  }

  function cancel() {
    dispatch("cancel")
    open = false
  }
</script>

<Modal {open} {title} width="max-w-md" on:close={cancel}>
  <p class="text-gray-300 text-sm">{message}</p>
  <svelte:fragment slot="footer">
    <button class="btn-secondary" on:click={cancel}>Cancel</button>
    {#if showExport}
      <button class="btn-primary" on:click={() => dispatch('export')}>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export Data
      </button>
    {/if}
    {#if danger}
      <HoldButton {danger} on:confirm={confirm}>{confirmLabel}</HoldButton>
    {:else}
      <button class="btn-primary" on:click={confirm}>{confirmLabel}</button>
    {/if}
  </svelte:fragment>
</Modal>
