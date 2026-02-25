<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let title = '';
	export let open = false;
	export let width = 'max-w-lg';

	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		on:keydown={handleKeydown}
	>
		<!-- Backdrop -->
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="absolute inset-0 bg-black/60 backdrop-blur-sm"
			on:click={close}
		></div>

		<!-- Panel -->
		<div class="relative w-full {width} bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
			<!-- Header -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
				<h2 class="text-lg font-semibold text-gray-100">{title}</h2>
				<button
					on:click={close}
					class="p-1 text-gray-400 hover:text-gray-100 rounded-lg hover:bg-gray-800 transition-colors"
					aria-label="Close"
				>
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="overflow-y-auto flex-1 px-6 py-4">
				<slot />
			</div>

			<!-- Footer -->
			{#if $$slots.footer}
				<div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700 flex-shrink-0">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}
