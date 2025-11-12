<script lang="ts">
    import { onMount } from 'svelte';
    import { resolve } from "$app/paths";

    const partners = [
        { name: 'Innovatech', category: 'Technologie' },
        { name: 'EcoSolutions', category: 'Environnement' },
        { name: 'Artisanat Local', category: 'Commerce' },
        { name: 'SantéPlus', category: 'Santé' },
        { name: 'Cultura Viva', category: 'Culture' },
        { name: 'Sport-Action', category: 'Sport' },
        { name: 'GastroNomade', category: 'Restauration' },
        { name: 'BuildIt', category: 'Construction' },
        { name: 'FinanConseil', category: 'Finance' },
        { name: 'EduFutur', category: 'Éducation' }
    ];

    let partnerLogos: { name: string; category: string; logoUrl: string }[] = [];

    onMount(() => {
        partnerLogos = partners.map((partner) => ({
            ...partner,
            logoUrl: `https://placehold.co/200x100/EEE/31343C?text=${encodeURIComponent(partner.name)}`
        }));
    });
</script>

<svelte:head>
    <title>Nos Partenariats</title>
    <meta
        name="description"
        content="Découvrez les partenaires qui collaborent avec nous et les avantages exclusifs pour nos membres."
    />
</svelte:head>

<div class="container">
    <header>
        <h1>Nos Partenariats</h1>
        <p>
            Nous sommes fiers de collaborer avec un réseau d'entreprises et d'organisations engagées.
            Découvrez les avantages exclusifs qu'ils proposent à notre communauté.
        </p>
    </header>

    <main class="partners-grid">
        {#if partnerLogos.length > 0}
            {#each partnerLogos as partner (partner.name)}
                <a href={resolve(`/partenariats/${partner.name.toLowerCase()}`)} class="partner-card">
                    <div class="logo-container">
                        <img src={partner.logoUrl} alt={`Logo de ${partner.name}`} loading="lazy" />
                    </div>
                    <div class="card-content">
                        <h3>{partner.name}</h3>
                        <span class="category-badge">{partner.category}</span>
                    </div>
                </a>
            {/each}
        {:else}
            {#each Array(8) as _}
                <div class="partner-card skeleton"></div>
            {/each}
        {/if}
    </main>
</div>

<style>
    .container {
        width: 80%;

        margin: 0 auto;
        padding: 2rem 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
            'Open Sans', 'Helvetica Neue', sans-serif;
    }

    header {
        text-align: center;
        margin-bottom: 3rem;
    }

    h1 {
        font-size: clamp(2rem, 5vw, 3rem);
        color: #1a1a1a;
        margin-bottom: 0.5rem;
    }

    header p {
        font-size: 1.1rem;
        color: #555;
        max-width: 700px;
        margin: 0 auto;
    }

    .partners-grid {

        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
    }

    .partner-card {
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
        display: flex;
        flex-direction: column;
    }

    .partner-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    .logo-container {
        background-color: #f8f9fa;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 120px;
    }

    .logo-container img {
        max-width: 80%;
        max-height: 80%;
        object-fit: contain;
    }

    .card-content {
        padding: 1rem 1.25rem;
        border-top: 1px solid #eee;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    h3 {
        font-size: 1.25rem;
        margin: 0 0 0.5rem 0;
        color: #222;
    }

    .category-badge {
        align-self: flex-start;
        background-color: #eef2ff;
        color: #4f46e5;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.6rem;
        border-radius: 9999px;
    }

    .skeleton {
        height: 220px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite linear;
    }

    @keyframes skeleton-loading {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }
</style>