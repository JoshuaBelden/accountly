<script lang="ts">
	export let budget: number;
	export let actual: number;

	$: pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
	$: over = actual > budget;
	$: color = over ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-indigo-500';
</script>

<div class="w-full">
	<div class="w-full bg-gray-700 rounded-full h-1.5">
		<div
			class="{color} h-1.5 rounded-full transition-all"
			style="width: {pct}%"
		></div>
	</div>
</div>
