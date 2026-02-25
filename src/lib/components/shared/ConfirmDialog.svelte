<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Modal from './Modal.svelte';

	export let open = false;
	export let title = 'Are you sure?';
	export let message = '';
	export let confirmLabel = 'Confirm';
	export let danger = false;

	const dispatch = createEventDispatcher();

	function confirm() {
		dispatch('confirm');
		open = false;
	}

	function cancel() {
		dispatch('cancel');
		open = false;
	}
</script>

<Modal {open} {title} width="max-w-sm" on:close={cancel}>
	<p class="text-gray-300 text-sm">{message}</p>
	<svelte:fragment slot="footer">
		<button class="btn-secondary" on:click={cancel}>Cancel</button>
		<button class={danger ? 'btn-danger' : 'btn-primary'} on:click={confirm}>
			{confirmLabel}
		</button>
	</svelte:fragment>
</Modal>
