<script lang="ts">
	export let variant: 'green' | 'yellow' | 'red' | 'blue' | 'gray' = 'gray';

	const classes: Record<string, string> = {
		green: 'badge-green',
		yellow: 'badge-yellow',
		red: 'badge-red',
		blue: 'badge-blue',
		gray: 'badge-gray'
	};
</script>

<span class={classes[variant]}>
	<slot />
</span>
