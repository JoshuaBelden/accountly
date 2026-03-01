<script lang="ts">
  import { browser } from "$app/environment"
  import { goto } from "$app/navigation"
  import { page } from "$app/stores"
  import AccountOverview from "$lib/components/layout/AccountOverview.svelte"
  import GlobalSearch from "$lib/components/layout/GlobalSearch.svelte"
  import TopNav from "$lib/components/layout/TopNav.svelte"
  import { accountsStore } from "$lib/stores/accounts.store"
  import { consentStore } from "$lib/stores/consent.store"
  import "../app.css"

  $: onSettings = $page.url.pathname === "/settings"
  $: if (browser && !onSettings && (!$consentStore || $accountsStore.length === 0)) {
    goto("/settings")
  }
</script>

<div class="min-h-screen flex flex-col bg-gray-950 text-gray-100">
  <header class="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 shadow-lg">
    <div class="relative flex items-center h-14 px-4">
      <!-- Top-left: logo -->
      <div class="absolute left-4 top-1/2 -translate-y-1/2">
        <a href="/" class="flex items-center gap-2">
          <img src="/logo.png" alt="" class="h-8 w-auto" />
          <span class="hidden min-[1110px]:inline font-display text-lg font-semibold tracking-wide text-gray-100 leading-none">Accountly</span>
        </a>
      </div>

      <!-- Centered navigation -->
      <div class="w-full flex justify-center">
        <TopNav consented={$consentStore} />
      </div>

      <!-- Top-right: financial overview (hidden below 1260px) -->
      <div class="hidden min-[1260px]:block absolute right-4 top-1/2 -translate-y-1/2">
        <AccountOverview />
      </div>
    </div>
  </header>

  <main class="flex-1 p-6">
    <slot />
  </main>
</div>

<GlobalSearch />
