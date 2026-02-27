<script lang="ts">
  import { page } from "$app/stores"
  import { searchOpen } from "$lib/stores/search.store"

  const navItems = [
    { href: "/planner", label: "Planner", primary: true },
    { href: "/budget", label: "Budget", primary: true },
    { href: "/accounts", label: "Accounts" },
    { href: "/bills", label: "Bills" },
    { href: "/merchants", label: "Merchants" },
    { href: "/transactions", label: "Transactions" },
    { href: "/networth", label: "Net Worth" },
  ]
</script>

<nav class="flex items-center gap-1">
  {#each navItems as item}
    <a
      href={item.href}
      class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {$page.url.pathname === item.href ||
      $page.url.pathname.startsWith(item.href + '/')
        ? 'bg-indigo-600 text-white'
        : item.primary
          ? 'text-indigo-300 border border-indigo-700 hover:text-white hover:bg-indigo-700'
          : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'}"
    >
      {item.label}
    </a>
  {/each}

  <button
    on:click={() => ($searchOpen = true)}
    class="ml-1 p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-100 hover:bg-gray-800"
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
