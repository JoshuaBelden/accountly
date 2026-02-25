import { writable } from 'svelte/store';
import { loadFromStorage, saveToStorage } from '$lib/persistence/localStorage';
import type { Paycheck } from '$lib/types';

const KEY = 'paychecks';

function now() {
	return new Date().toISOString();
}

function createPaychecksStore() {
	const store = writable<Paycheck[]>(loadFromStorage<Paycheck[]>(KEY, []));
	store.subscribe((v) => saveToStorage(KEY, v));

	return {
		subscribe: store.subscribe,
		set: store.set,
		add(paycheck: Paycheck) {
			store.update((list) => [...list, paycheck]);
		},
		update(id: string, changes: Partial<Paycheck>) {
			store.update((list) =>
				list.map((p) => (p.id === id ? { ...p, ...changes, updatedAt: now() } : p))
			);
		},
		remove(id: string) {
			store.update((list) => list.filter((p) => p.id !== id));
		}
	};
}

export const paychecksStore = createPaychecksStore();
