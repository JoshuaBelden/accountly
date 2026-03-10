<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import type { TaxBracket } from "$lib/types/tax"

  export let brackets: TaxBracket[] = []
  export let label = "Brackets"

  const dispatch = createEventDispatcher<{ change: TaxBracket[] }>()

  function addBracket() {
    const last = brackets[brackets.length - 1]
    const newMin = last ? (last.max ?? (last.min + 50000)) : 0
    const updated = [...brackets, { min: newMin, rate: 0 }]
    dispatch("change", updated)
  }

  function removeBracket(index: number) {
    dispatch("change", brackets.filter((_, i) => i !== index))
  }

  function updateBracket(index: number, field: keyof TaxBracket, rawValue: string) {
    const updated = brackets.map((bracket, i) => {
      if (i !== index) return bracket
      if (field === "rate") {
        return { ...bracket, rate: Math.min(1, Math.max(0, parseFloat(rawValue) / 100 || 0)) }
      }
      if (field === "max") {
        const parsed = parseFloat(rawValue)
        return { ...bracket, max: isNaN(parsed) || rawValue.trim() === "" ? undefined : parsed }
      }
      return { ...bracket, [field]: parseFloat(rawValue) || 0 }
    })
    dispatch("change", updated)
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <span class="text-sm font-medium text-gray-300">{label}</span>
    <button type="button" class="btn-secondary text-xs py-1 px-2" on:click={addBracket}>+ Add Bracket</button>
  </div>

  {#if brackets.length === 0}
    <p class="text-xs text-gray-500 italic">No brackets added. Click "+ Add Bracket" to begin.</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-gray-500 border-b border-gray-700">
            <th class="pb-1.5 pr-3 font-medium">Min Income</th>
            <th class="pb-1.5 pr-3 font-medium">Max Income</th>
            <th class="pb-1.5 pr-3 font-medium">Rate (%)</th>
            <th class="pb-1.5 w-8"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          {#each brackets as bracket, index}
            <tr>
              <td class="py-1.5 pr-3">
                <input
                  type="number"
                  class="input py-1 px-2 text-xs w-28"
                  value={bracket.min}
                  min="0"
                  on:change={event => updateBracket(index, "min", (event.target as HTMLInputElement).value)}
                />
              </td>
              <td class="py-1.5 pr-3">
                <input
                  type="number"
                  class="input py-1 px-2 text-xs w-28"
                  value={bracket.max ?? ""}
                  placeholder="No limit"
                  min="0"
                  on:change={event => updateBracket(index, "max", (event.target as HTMLInputElement).value)}
                />
              </td>
              <td class="py-1.5 pr-3">
                <input
                  type="number"
                  class="input py-1 px-2 text-xs w-20"
                  value={(bracket.rate * 100).toFixed(1)}
                  min="0"
                  max="100"
                  step="0.1"
                  on:change={event => updateBracket(index, "rate", (event.target as HTMLInputElement).value)}
                />
              </td>
              <td class="py-1.5">
                <button
                  type="button"
                  on:click={() => removeBracket(index)}
                  class="text-gray-600 hover:text-red-400 transition-colors"
                  aria-label="Remove bracket"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <p class="text-xs text-gray-600">
    Brackets are marginal — each rate applies only to the income within that range, not your full income.
    Leave "Max Income" blank for the top bracket.
  </p>
</div>
