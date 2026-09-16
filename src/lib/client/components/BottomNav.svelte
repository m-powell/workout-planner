<script lang="ts">
	import { page } from '$app/state';

	const tabs = [
		{ href: '/', label: 'Today', icon: '🏋️' },
		{ href: '/plan', label: 'Plan', icon: '📋' },
		{ href: '/progress', label: 'Progress', icon: '📈' },
		{ href: '/settings', label: 'Settings', icon: '⚙️' }
	];

	function isActive(href: string) {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<nav class="fixed inset-x-0 bottom-0 z-20 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
	<div class="mx-auto flex max-w-md">
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				class="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium {isActive(tab.href)
					? 'text-emerald-400'
					: 'text-slate-500'}"
			>
				<span class="text-xl leading-none">{tab.icon}</span>
				{tab.label}
			</a>
		{/each}
	</div>
</nav>
