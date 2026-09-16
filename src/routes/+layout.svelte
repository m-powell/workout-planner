<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BottomNav from '$lib/client/components/BottomNav.svelte';
	import { initSyncQueue } from '$lib/client/offline/syncQueue.svelte';

	let { children, data } = $props();

	onMount(() => {
		initSyncQueue();
	});

	$effect(() => {
		if (!data.onboarded && !data.isOnboardingRoute) {
			goto('/onboarding');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#0f172a" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="Gym" />
	<link rel="apple-touch-icon" href="/icons/icon-192.png" />
</svelte:head>

<div class="mx-auto min-h-dvh max-w-md" class:pb-20={!data.isOnboardingRoute}>
	{@render children()}
</div>

{#if !data.isOnboardingRoute}
	<BottomNav />
{/if}
