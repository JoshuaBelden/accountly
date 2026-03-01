<script lang="ts">
  import { afterNavigate } from "$app/navigation"
  import { page } from "$app/stores"
  import { searchOpen } from "$lib/stores/search.store"

  export let consented = false

  let menuOpen = false

  const primaryItem = { href: "/planner", label: "Planner" }
  const secondaryItems = [
    { href: "/budget", label: "Budget" },
    { href: "/accounts", label: "Accounts" },
    { href: "/bills", label: "Bills" },
    { href: "/merchants", label: "Merchants" },
    { href: "/transactions", label: "Transactions" },
    { href: "/networth", label: "Net Worth" },
    { href: "/tools", label: "Tools" },
  ]

  /** Returns true if the given href matches the current page. */
  function isActive(href: string): boolean {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + "/")
  }

  afterNavigate(() => {
    menuOpen = false
  })
</script>

<nav class="relative flex items-center gap-1">
  <!-- Planner: always visible -->
  <a
    href={consented ? primaryItem.href : undefined}
    aria-disabled={!consented}
    class="px-4 py-2 rounded-lg text-sm font-medium transition-colors
      {!consented
      ? 'text-gray-600 cursor-not-allowed'
      : isActive(primaryItem.href)
        ? 'bg-indigo-600 text-white'
        : 'text-indigo-300 border border-indigo-700 hover:text-white hover:bg-indigo-700'}"
  >
    {primaryItem.label}
  </a>

  <!-- Secondary nav items: only visible on wide screens (>= 1110px) -->
  {#each secondaryItems as item}
    <a
      href={consented ? item.href : undefined}
      aria-disabled={!consented}
      class="hidden min-[1110px]:block px-4 py-2 rounded-lg text-sm font-medium transition-colors
        {!consented
        ? 'text-gray-600 cursor-not-allowed'
        : isActive(item.href)
          ? 'bg-indigo-600 text-white'
          : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'}"
    >
      {item.label}
    </a>
  {/each}

  <!-- Hamburger button: visible only when secondary items are hidden (< 1110px) -->
  <button
    disabled={!consented}
    aria-label="Open navigation menu"
    aria-expanded={menuOpen}
    on:click={() => (menuOpen = !menuOpen)}
    class="min-[1110px]:hidden p-2 rounded-lg transition-colors
      {consented
      ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
      : 'text-gray-600 cursor-not-allowed'}"
  >
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {#if menuOpen}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      {:else}
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      {/if}
    </svg>
  </button>

  <!-- Dropdown menu for secondary items -->
  {#if menuOpen}
    <div
      class="absolute top-full mt-2 right-0 z-50 min-[1110px]:hidden
             w-48 rounded-lg bg-gray-900 border border-gray-700 shadow-xl py-1"
    >
      {#each secondaryItems as item}
        <a
          href={consented ? item.href : undefined}
          aria-disabled={!consented}
          class="block px-4 py-2.5 text-sm font-medium transition-colors
            {!consented
            ? 'text-gray-600 cursor-not-allowed'
            : isActive(item.href)
              ? 'text-indigo-400 bg-indigo-950'
              : 'text-gray-300 hover:text-white hover:bg-gray-800'}"
        >
          {item.label}
        </a>
      {/each}
    </div>
  {/if}

  <button
    disabled={!consented}
    on:click={() => ($searchOpen = true)}
    class="ml-1 p-2 rounded-lg transition-colors
      {consented
      ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
      : 'text-gray-600 cursor-not-allowed'}"
    aria-label="Search (⌘K)"
  >
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
      />
    </svg>
  </button>

  <a
    href="/settings"
    class="ml-1 p-2 rounded-lg transition-colors {($page.url.pathname as string).includes('/settings')
      ? 'text-white bg-indigo-600'
      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'}"
    aria-label="Settings"
  >
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  </a>
</nav>
