<script lang="ts">
  import FinancialHealthWidget from "$lib/components/dashboard/FinancialHealthWidget.svelte"
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-100">Financial Health</h1>
    <p class="text-sm text-gray-400 mt-1">Financial health at a glance</p>
  </div>

  <FinancialHealthWidget />

  <div class="bg-gray-800/50 border border-gray-700 rounded-xl p-5 space-y-4">
    <h2 class="text-sm font-semibold text-gray-300">How these are calculated</h2>
    <dl class="grid sm:grid-cols-2 gap-x-8 gap-y-4">
      <div>
        <dt class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Savings Rate</dt>
        <dd class="text-sm text-gray-400 leading-relaxed">
          <span class="text-gray-200">(Income − Expenses) ÷ Income</span> averaged over the prior 3 complete months.
          Uses recorded income transactions when available; falls back to configured paycheck amounts if you haven't
          imported income. Target: <span class="text-emerald-400">≥ 20%</span>.
        </dd>
      </div>
      <div>
        <dt class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Debt-to-Income</dt>
        <dd class="text-sm text-gray-400 leading-relaxed">
          <span class="text-gray-200">Monthly debt payments ÷ Monthly income.</span> Debt payments are the minimum
          payment on every loan account, normalized to monthly. Income is from configured paychecks. Safe zone:
          <span class="text-emerald-400">≤ 28%</span>; lenders flag risk above 43%.
        </dd>
      </div>
      <div>
        <dt class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Emergency Fund</dt>
        <dd class="text-sm text-gray-400 leading-relaxed">
          <span class="text-gray-200">Liquid balance ÷ Avg monthly expenses.</span> Liquid includes all checking and
          savings account balances. Expenses are averaged over the prior 3 complete months of recorded transactions.
          Target: <span class="text-emerald-400">≥ 6 months</span>.
        </dd>
      </div>
      <div>
        <dt class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Budget Adherence</dt>
        <dd class="text-sm text-gray-400 leading-relaxed">
          <span class="text-gray-200">Share of budget categories on track this month.</span> A category is on track
          when actual spending (from categorized transactions) hasn't exceeded its budget. Only evaluates categories
          with a budget set. Target: <span class="text-emerald-400">≥ 80%</span>.
        </dd>
      </div>
    </dl>
  </div>
</div>
