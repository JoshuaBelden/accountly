<script lang="ts">
  import AccountOverview from "$lib/components/layout/AccountOverview.svelte"
  import GlobalSearch from "$lib/components/layout/GlobalSearch.svelte"
  import TopNav from "$lib/components/layout/TopNav.svelte"
  import "../app.css"
</script>

<div class="min-h-screen flex flex-col bg-gray-950 text-gray-100">
  <header class="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 shadow-lg">
    <div class="relative flex items-center h-14 px-4">
      <!-- Top-left: logo -->
      <div class="absolute left-4 top-1/2 -translate-y-1/2">
        <a href="/" class="flex items-center gap-2 group">
          <div
            class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md group-hover:bg-indigo-500 transition-colors"
          >
            <svg
              class="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span class="text-sm font-semibold tracking-tight text-gray-100 group-hover:text-white transition-colors"
            >Accountly</span
          >
        </a>
      </div>

      <!-- Centered navigation -->
      <div class="w-full flex justify-center">
        <TopNav />
      </div>

      <!-- Top-right: financial overview -->
      <div class="absolute right-4 top-1/2 -translate-y-1/2">
        <AccountOverview />
      </div>
    </div>
  </header>

  <main class="flex-1 p-6">
    <slot />
  </main>
</div>

<GlobalSearch />
