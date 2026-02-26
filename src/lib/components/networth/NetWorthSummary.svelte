<script lang="ts">
  import { netWorth, totalAssets, totalLiabilities } from "$lib/stores/derived.store"
  import { settingsStore } from "$lib/stores/settings.store"
  import { formatCurrency } from "$lib/utils/currency"
</script>

<div class="card">
  <div class="text-center mb-6">
    <div class="text-sm text-gray-500 uppercase tracking-wide mb-1">Net Worth</div>
    <div class="text-4xl font-bold tabular-nums {$netWorth >= 0 ? 'text-emerald-400' : 'text-red-400'}">
      {formatCurrency($netWorth, $settingsStore.locale, $settingsStore.currency)}
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4 text-center">
    <div class="bg-gray-900 rounded-xl p-4">
      <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Assets</div>
      <div class="text-2xl font-bold text-gray-100 tabular-nums">
        {formatCurrency($totalAssets, $settingsStore.locale, $settingsStore.currency)}
      </div>
    </div>
    <div class="bg-gray-900 rounded-xl p-4">
      <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Liabilities</div>
      <div class="text-2xl font-bold text-red-400 tabular-nums">
        {formatCurrency($totalLiabilities, $settingsStore.locale, $settingsStore.currency)}
      </div>
    </div>
  </div>
</div>
