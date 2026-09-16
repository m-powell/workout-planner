<script lang="ts">
	let {
		value = $bindable(),
		step = 1,
		min = 0,
		suffix = '',
		label = ''
	}: { value: number; step?: number; min?: number; suffix?: string; label?: string } = $props();

	function dec() {
		value = Math.max(min, Math.round((value - step) * 100) / 100);
	}
	function inc() {
		value = Math.round((value + step) * 100) / 100;
	}
</script>

<div class="flex flex-col items-center gap-1">
	{#if label}<span class="text-xs text-slate-500">{label}</span>{/if}
	<div class="flex items-center gap-3">
		<button
			type="button"
			onclick={dec}
			class="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-xl font-semibold text-slate-200 active:bg-slate-700"
			aria-label="decrease"
		>
			−
		</button>
		<span class="w-16 text-center text-2xl font-bold tabular-nums">{value}{suffix}</span>
		<button
			type="button"
			onclick={inc}
			class="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-xl font-semibold text-slate-200 active:bg-slate-700"
			aria-label="increase"
		>
			+
		</button>
	</div>
</div>
