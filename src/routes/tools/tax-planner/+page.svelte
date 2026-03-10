<script lang="ts">
  import { paychecksStore } from "$lib/stores/paychecks.store"
  import { taxProfileStore, withholdingsStore } from "$lib/stores/tax.store"
  import AnnualSummaryCard from "$lib/components/tax/AnnualSummaryCard.svelte"
  import BracketWaterfallChart from "$lib/components/tax/BracketWaterfallChart.svelte"
  import PerPaycheckTable from "$lib/components/tax/PerPaycheckTable.svelte"
  import SetupWizard from "$lib/components/tax/SetupWizard.svelte"
  import TaxBreakdownChart from "$lib/components/tax/TaxBreakdownChart.svelte"
  import TaxProfileForm from "$lib/components/tax/TaxProfileForm.svelte"
  import WithholdingTracker from "$lib/components/tax/WithholdingTracker.svelte"
  import type { TaxProfile, AnnualTaxEstimate, PerPaycheckRecommended, WithholdingTrackerSummary } from "$lib/types/tax"
  import {
    computeAnnualTaxEstimate,
    computePerPaycheckRecommended,
    computeWithholdingTrackerSummary,
  } from "$lib/utils/tax"

  type Tab = "estimate" | "withholding" | "profile"
  let activeTab: Tab = "estimate"

  $: profile = $taxProfileStore
  $: paychecks = $paychecksStore
  $: withholdings = $withholdingsStore

  $: estimate = profile && paychecks.length > 0
    ? computeAnnualTaxEstimate(paychecks, profile)
    : null

  $: includedPaychecks = profile
    ? (profile.includedPaycheckIds.length === 0
        ? paychecks
        : paychecks.filter(paycheck => profile!.includedPaycheckIds.includes(paycheck.id))
      ).filter(paycheck => !paycheck.incomeType || paycheck.incomeType === "paycheck")
    : []

  $: perPaycheckRows = estimate && profile
    ? includedPaychecks.map(paycheck => computePerPaycheckRecommended(paycheck, estimate!, profile!))
    : ([] as PerPaycheckRecommended[])

  $: trackerSummary = estimate && profile
    ? computeWithholdingTrackerSummary(withholdings, perPaycheckRows, profile.taxYear, estimate)
    : null

  $: filingStatusLabel = profile
    ? ({
        single: "Single",
        marriedFilingJointly: "Married Filing Jointly",
        marriedFilingSeparately: "Married Filing Separately",
        headOfHousehold: "Head of Household",
      }[profile.filingStatus] ?? profile.filingStatus)
    : ""

  function handleProfileSave(event: CustomEvent<TaxProfile>) {
    taxProfileStore.save(event.detail)
    activeTab = "estimate"
  }

  function handleWizardSave(event: CustomEvent<TaxProfile>) {
    taxProfileStore.save(event.detail)
    activeTab = "estimate"
  }
</script>

<div class="max-w-5xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-start justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-100">Tax Planner</h1>
      {#if profile}
        <p class="text-sm text-gray-500 mt-0.5">{profile.taxYear} · {filingStatusLabel}</p>
      {/if}
    </div>
  </div>

  {#if !profile}
    <!-- First-time setup wizard -->
    <SetupWizard on:save={handleWizardSave} />
  {:else}
    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-800">
      {#each [
        { id: "estimate", label: "Annual Estimate" },
        { id: "withholding", label: "Withholding Tracker" },
        { id: "profile", label: "Tax Profile" },
      ] as tab}
        <button
          on:click={() => (activeTab = tab.id as Tab)}
          class="px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg
            {activeTab === tab.id
            ? 'text-indigo-300 border-b-2 border-indigo-500 -mb-px'
            : 'text-gray-500 hover:text-gray-300'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- Tab content -->
    {#if activeTab === "estimate"}
      {#if paychecks.length === 0}
        <div class="card text-center py-12 space-y-3">
          <p class="text-gray-400">No income sources found.</p>
          <p class="text-sm text-gray-500">
            Add paychecks in the <a href="/accounts" class="text-indigo-400 hover:text-indigo-300">Accounts</a> page first,
            then come back to see your tax estimate.
          </p>
        </div>
      {:else if !estimate}
        <div class="card text-center py-12">
          <p class="text-gray-400">Add tax brackets in the Tax Profile tab to see your estimate.</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnnualSummaryCard {estimate} incomeBreakdown={perPaycheckRows} />
          <TaxBreakdownChart {estimate} />
        </div>
        <BracketWaterfallChart
          brackets={profile.federalBrackets}
          taxableIncome={estimate.federalTaxableIncome}
          label="Federal Tax Bracket Breakdown"
        />
        {#if profile.stateBrackets.length > 0}
          <BracketWaterfallChart
            brackets={profile.stateBrackets}
            taxableIncome={estimate.stateTaxableIncome}
            label="{profile.stateName || 'State'} Tax Bracket Breakdown"
          />
        {/if}
        <PerPaycheckTable rows={perPaycheckRows} />
      {/if}

    {:else if activeTab === "withholding"}
      {#if !estimate || !trackerSummary}
        <div class="card text-center py-12 space-y-3">
          <p class="text-gray-400">Complete your tax profile first to enable withholding tracking.</p>
          <button class="btn-primary" on:click={() => (activeTab = "profile")}>Go to Tax Profile</button>
        </div>
      {:else}
        <WithholdingTracker
          {trackerSummary}
          taxYear={profile.taxYear}
        />
      {/if}

    {:else if activeTab === "profile"}
      <TaxProfileForm {profile} on:save={handleProfileSave} />
    {/if}
  {/if}
</div>
