<script lang="ts">
	import NetWorthSummary from '$lib/components/networth/NetWorthSummary.svelte';
	import AssetLiabilityTable from '$lib/components/networth/AssetLiabilityTable.svelte';
	import ForecastTimeline from '$lib/components/networth/ForecastTimeline.svelte';
</script>

<div class="max-w-4xl mx-auto space-y-6">
	<h1 class="text-2xl font-bold text-gray-100">Net Worth</h1>

	<NetWorthSummary />
	<AssetLiabilityTable />
	<ForecastTimeline />
</div>
