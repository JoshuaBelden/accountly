import { writable } from "svelte/store"

/** Controls whether the global search panel is open. */
export const searchOpen = writable(false)
