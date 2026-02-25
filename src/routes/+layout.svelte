<script lang="ts">
	import '../app.css';
	import TopNav from '$lib/components/layout/TopNav.svelte';
	import AccountOverview from '$lib/components/layout/AccountOverview.svelte';
</script>

<div class="min-h-screen flex flex-col bg-gray-950 text-gray-100">
	<header class="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 shadow-lg">
		<div class="relative flex items-center h-14 px-4">
			<!-- Top-left: always-visible financial overview -->
			<div class="absolute left-4 top-1/2 -translate-y-1/2">
				<AccountOverview />
			</div>

			<!-- Centered navigation -->
			<div class="w-full flex justify-center">
				<TopNav />
			</div>
		</div>
	</header>

	<main class="flex-1 p-6">
		<slot />
	</main>
</div>
