import { writable } from "svelte/store";

export type ToastType = "success" | "error" | "info";

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
	duration?: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	let count = 0;

	return {
		subscribe,
		add: (message: string, type: ToastType = "info", duration = 3000) => {
			const id = count++;
			update((toasts) => [...toasts, { id, message, type, duration }]);
			if (duration > 0) {
				setTimeout(() => {
					update((toasts) => toasts.filter((t) => t.id !== id));
				}, duration);
			}
		},
		remove: (id: number) => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		},
	};
}

export const toasts = createToastStore();
