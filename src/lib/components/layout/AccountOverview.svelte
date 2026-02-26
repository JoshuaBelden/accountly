<script lang="ts">
  import { netWorth, totalLiquid } from "$lib/stores/derived.store"
  import { settingsStore } from "$lib/stores/settings.store"
  import { formatCurrencyCompact } from "$lib/utils/currency"
</script>

<a href="/networth" class="flex items-center gap-4 group">
  <div class="text-right">
    <div class="text-xs text-gray-500 uppercase tracking-wide">Liquid</div>
    <div class="text-sm font-semibold text-gray-100 tabular-nums">
      {formatCurrencyCompact($totalLiquid, $settingsStore.locale, $settingsStore.currency)}
    </div>
  </div>
  <div class="w-px h-8 bg-gray-700"></div>
  <div class="text-right">
    <div class="text-xs text-gray-500 uppercase tracking-wide">Net Worth</div>
    <div class="text-sm font-semibold tabular-nums {$netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'}">
      {formatCurrencyCompact($netWorth, $settingsStore.locale, $settingsStore.currency)}
    </div>
  </div>
</a>
