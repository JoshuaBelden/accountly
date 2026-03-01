<script lang="ts">
  type TipOption = "$1" | "$2" | "10%" | "12%" | "15%" | "18%" | "20%" | "custom"
  type CustomMode = "percent" | "dollar"

  const TIP_OPTIONS: TipOption[] = ["$1", "$2", "10%", "12%", "15%", "18%", "20%", "custom"]

  let receiptAmount = ""
  let selectedTip: TipOption = "15%"
  let customValue = ""
  let customMode: CustomMode = "percent"

  $: receiptNum = parseFloat(receiptAmount) || 0

  $: tipAmount = (() => {
    if (selectedTip === "$1") return 1
    if (selectedTip === "$2") return 2
    if (selectedTip === "custom") {
      const num = parseFloat(customValue) || 0
      return customMode === "percent" ? (receiptNum * num) / 100 : num
    }
    const pct = parseFloat(selectedTip) / 100
    return receiptNum * pct
  })()

  $: total = receiptNum + tipAmount
  $: tipPercent = receiptNum > 0 ? (tipAmount / receiptNum) * 100 : 0

  /** Format a number as currency with 2 decimal places. */
  function fmt(value: number): string {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD" })
  }

  /** Format a percentage to one decimal place. */
  function fmtPct(value: number): string {
    return value.toFixed(1) + "%"
  }

  function selectTip(option: TipOption) {
    selectedTip = option
  }

  function labelFor(option: TipOption): string {
    return option === "custom" ? "Custom" : option
  }
</script>

<div class="max-w-lg mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-start gap-4">
    <a
      href="/tools"
      class="mt-1 p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
      aria-label="Back to Tools"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-gray-100">Tip Calculator</h1>
      <p class="text-sm text-gray-400 mt-0.5">Enter a receipt amount and choose your tip.</p>
    </div>
  </div>

  <!-- Receipt amount input -->
  <div class="card space-y-2">
    <label for="receipt-amount" class="text-xs font-medium text-gray-400 uppercase tracking-wide block">
      Receipt Amount
    </label>
    <div class="relative">
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl font-light">$</span>
      <input
        id="receipt-amount"
        type="number"
        bind:value={receiptAmount}
        min="0"
        step="0.01"
        placeholder="0.00"
        class="w-full pl-10 pr-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-3xl font-semibold
          text-gray-100 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums"
      />
    </div>
  </div>

  <!-- Tip selector -->
  <div class="card space-y-3">
    <div class="text-xs font-medium text-gray-400 uppercase tracking-wide">Tip</div>

    <div class="grid grid-cols-4 gap-2">
      {#each TIP_OPTIONS as option}
        <button
          on:click={() => selectTip(option)}
          class="py-2.5 px-2 rounded-lg text-sm font-medium transition-colors text-center
            {selectedTip === option
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-gray-100'}"
        >
          {labelFor(option)}
        </button>
      {/each}
    </div>

    <!-- Custom input -->
    {#if selectedTip === "custom"}
      <div class="pt-1 space-y-3">
        <div class="flex rounded-lg overflow-hidden border border-gray-700">
          <button
            on:click={() => (customMode = "percent")}
            class="flex-1 py-2 text-sm font-medium transition-colors
              {customMode === 'percent' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}"
          >
            Percentage
          </button>
          <button
            on:click={() => (customMode = "dollar")}
            class="flex-1 py-2 text-sm font-medium transition-colors border-l border-gray-700
              {customMode === 'dollar' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}"
          >
            Dollar Amount
          </button>
        </div>

        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {customMode === "percent" ? "%" : "$"}
          </span>
          <input
            type="number"
            bind:value={customValue}
            min="0"
            step={customMode === "percent" ? "1" : "0.01"}
            placeholder={customMode === "percent" ? "e.g. 22" : "e.g. 5.00"}
            class="w-full pl-8 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100
              placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    {/if}
  </div>

  <!-- Results -->
  <div class="card space-y-4">
    <div class="text-xs font-medium text-gray-400 uppercase tracking-wide">Summary</div>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-400">Receipt</span>
        <span class="tabular-nums text-gray-200 font-medium">{receiptNum > 0 ? fmt(receiptNum) : "—"}</span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-400">
          Tip
          {#if receiptNum > 0 && tipAmount > 0}
            <span class="text-gray-600 text-xs ml-1">({fmtPct(tipPercent)})</span>
          {/if}
        </span>
        <span class="tabular-nums text-indigo-300 font-medium">{tipAmount > 0 ? fmt(tipAmount) : "—"}</span>
      </div>

      <div class="border-t border-gray-700 pt-3 flex items-center justify-between">
        <span class="text-base font-semibold text-gray-100">Total</span>
        <span class="tabular-nums text-xl font-bold text-white">{total > 0 ? fmt(total) : "—"}</span>
      </div>
    </div>
  </div>
</div>
