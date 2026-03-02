<script lang="ts">
  import { budgetStore } from "$lib/stores/budget.store"
  import { merchantsStore } from "$lib/stores/merchants.store"
  import type { BudgetCategory, Merchant } from "$lib/types"
  import { createEventDispatcher } from "svelte"

  export let editMerchant: Merchant | null = null

  const dispatch = createEventDispatcher()

  let name = editMerchant?.name ?? ""
  let hints = editMerchant?.hints ?? ""
  let icon = editMerchant?.icon ?? ""
  let iconError = ""
  let categoryId = editMerchant?.categoryId ?? ""
  let subcategoryId = editMerchant?.subcategoryId ?? ""
  let notes = editMerchant?.notes ?? ""

  async function drawToCanvas(source: ImageBitmapSource | string): Promise<string> {
    const bitmap =
      typeof source === "string"
        ? await new Promise<ImageBitmap>((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
              if (!img.naturalWidth) { reject(new Error("blank")); return }
              createImageBitmap(img).then(resolve).catch(reject)
            }
            img.onerror = reject
            img.src = source
          })
        : await createImageBitmap(source)
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 64
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, 64, 64)
    bitmap.close()
    return canvas.toDataURL("image/png")
  }

  async function onIconFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    iconError = ""
    const objectUrl = URL.createObjectURL(file)
    try {
      // Try createImageBitmap directly first (works for PNG/JPG/WebP)
      icon = await drawToCanvas(file)
    } catch {
      // Fall back to loading via object URL — handles .ico in browsers that
      // support it as an <img> source but not as a bitmap source
      try {
        icon = await drawToCanvas(objectUrl)
      } catch {
        iconError = "Could not decode this file. Try saving it as a PNG first."
      }
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  function now() {
    return new Date().toISOString()
  }

  let budgetCategories: BudgetCategory[] = []
  budgetStore.categories.subscribe(
    (c: BudgetCategory[]) => (budgetCategories = c.slice().sort((a, b) => a.name.localeCompare(b.name))),
  )

  $: subcategories = (budgetCategories.find(c => c.id === categoryId)?.subcategories ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))

  $: hintsValid = (() => {
    if (!hints) return true
    try {
      new RegExp(hints, "i")
      return true
    } catch {
      return false
    }
  })()

  function submit() {
    const merchant: Merchant = {
      id: editMerchant?.id ?? crypto.randomUUID(),
      name,
      hints,
      icon: icon || undefined,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      notes: notes || undefined,
      createdAt: editMerchant?.createdAt ?? now(),
      updatedAt: now(),
    }
    if (editMerchant) {
      merchantsStore.update(editMerchant.id, merchant)
    } else {
      merchantsStore.add(merchant)
    }
    dispatch("save", merchant)
  }
</script>

<form on:submit|preventDefault={submit} class="space-y-4">
  <div>
    <label class="label" for="merchant-name">Merchant Name</label>
    <input id="merchant-name" class="input" type="text" bind:value={name} required placeholder="e.g. Fred Meyer" />
  </div>

  <div>
    <label class="label">Icon (optional)</label>
    <div class="flex items-center gap-3">
      {#if icon}
        <img src={icon} alt="Merchant icon" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
      {:else}
        <div class="w-10 h-10 rounded-full bg-indigo-900 flex-shrink-0 flex items-center justify-center">
          <svg class="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      {/if}
      <div class="flex items-center gap-2">
        <label class="btn-secondary cursor-pointer text-sm">
          {icon ? "Replace" : "Upload"} PNG
          <input type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" on:change={onIconFileChange} />
        </label>
        {#if icon}
          <button type="button" class="btn-ghost text-sm text-red-400 hover:text-red-300" on:click={() => (icon = "")}>
            Remove
          </button>
        {/if}
      </div>
    </div>
    {#if iconError}
      <p class="mt-1.5 text-xs text-red-400">{iconError}</p>
    {/if}
  </div>

  <div>
    <label class="label" for="merchant-hints">Import Match Pattern</label>
    <input
      id="merchant-hints"
      class="input font-mono text-sm"
      type="text"
      bind:value={hints}
      required
      placeholder="e.g. FREDMEYER|fred.meyer"
    />
    {#if !hintsValid}
      <p class="mt-1 text-xs text-red-400">Invalid regular expression.</p>
    {:else}
      <p class="mt-1 text-xs text-gray-500">
        Regex matched against imported transaction descriptions (case-insensitive).
      </p>
    {/if}
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="label" for="merchant-category">Budget Category (optional)</label>
      <select id="merchant-category" class="input" bind:value={categoryId} on:change={() => (subcategoryId = "")}>
        <option value="">None</option>
        {#each budgetCategories as cat}
          <option value={cat.id}>{cat.name}</option>
        {/each}
      </select>
    </div>
    {#if subcategories.length > 0}
      <div>
        <label class="label" for="merchant-subcategory">Subcategory (optional)</label>
        <select id="merchant-subcategory" class="input" bind:value={subcategoryId}>
          <option value="">None</option>
          {#each subcategories as sub}
            <option value={sub.id}>{sub.name}</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <div>
    <label class="label" for="merchant-notes">Notes (optional)</label>
    <textarea id="merchant-notes" class="input" rows="2" bind:value={notes}></textarea>
  </div>

  <div class="flex justify-end gap-3 pt-2">
    <button type="button" class="btn-secondary" on:click={() => dispatch("cancel")}>Cancel</button>
    <button type="submit" class="btn-primary" disabled={!hintsValid}>
      {editMerchant ? "Update" : "Add"} Merchant
    </button>
  </div>
</form>
