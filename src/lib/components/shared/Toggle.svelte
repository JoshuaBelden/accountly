<script lang="ts">
	export let checked = false;
	export let label = '';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	function toggle() {
		checked = !checked;
		dispatch('change', checked);
	}
</script>

<label class="flex items-center gap-3 cursor-pointer">
	<button
		type="button"
		role="switch"
		aria-checked={checked}
		aria-label={label || 'Toggle'}
		on:click={toggle}
		class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 {checked ? 'bg-indigo-600' : 'bg-gray-700'}"
	>
		<span
			class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {checked ? 'translate-x-6' : 'translate-x-1'}"
		></span>
	</button>
	{#if label}
		<span class="text-sm text-gray-300">{label}</span>
	{/if}
</label>
