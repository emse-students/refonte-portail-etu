<script lang="ts">
	import { asset } from "$app/paths";

    //import sites from json file
    import sites from "$lib/data/autres-sites.json";
</script>

<svelte:head>
    <title>Autres Sites</title>
    <meta name="description" content="Découvrez d'autres sites utiles pour les étudiants de notre campus." />
</svelte:head>

<div class="container">
    <header>
        <h1>Autres Sites Utiles</h1>
        <p>
            Explorez une sélection de sites web qui offrent des ressources et des informations utiles pour les étudiants de notre campus.
        </p>
    </header>

    <main class="sites-grid">
        {#each sites as site}
            <a href={asset(site.url)} class="site-card" target="_blank" rel="noopener noreferrer">
                <img src={site.icon} alt={`${site.name} logo`} class="site-icon" />
                <div class="card-content">
                    <h3>{site.name}</h3>
                    <p>{site.description}</p>
                </div>
            </a>
        {/each}
    </main>
</div>

<style>
    .container {
        max-width: 1200px;
        min-width: 70%;
        margin: 2rem auto;
        padding: 0 1rem;
        min-height: calc(100vh - 8rem);
    }

    header {
        text-align: center;
        margin-bottom: 3rem;
        padding: 2rem 0;
    }

    header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    header p {
        font-size: 1.1rem;
        color: #666;
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.6;
    }

    .sites-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 2rem;
        padding-bottom: 3rem;
        place-items: center;
    }

    .site-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 280px;
        height: 210px;
        padding: 2rem 1.5rem;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border-radius: 16px;
        border: 1px solid rgba(0, 0, 0, 0.05);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
        text-decoration: none;
        color: inherit;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }

    .site-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #7c3aed 0%, #ec4899 100%);
        transform: scaleX(0);
        transition: transform 0.3s ease;
    }

    .site-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(124, 58, 237, 0.15), 0 6px 12px rgba(236, 72, 153, 0.1);
        border-color: rgba(124, 58, 237, 0.3);
    }

    .site-card:hover::before {
        transform: scaleX(1);
    }

    .site-icon {
        width: 80px;
        height: 80px;
        object-fit: contain;
        margin-bottom: 1.25rem;
        border-radius: 12px;
        padding: 0.5rem;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: transform 0.3s ease;
    }

    .site-card:hover .site-icon {
        transform: scale(1.1);
    }

    .card-content {
        text-align: center;
        width: 100%;
    }

    .card-content h3 {
        margin: 0 0 0.75rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a202c;
        transition: color 0.2s ease;
    }

    .site-card:hover .card-content h3 {
        color: #7c3aed;
    }

    .card-content p {
        margin: 0;
        color: #718096;
        font-size: 0.95rem;
        line-height: 1.5;
    }

    @media (max-width: 768px) {
        header h1 {
            font-size: 2rem;
        }

        .sites-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 1.5rem;
        }

        .site-card {
            width: 240px;
            height: 240px;
            padding: 1.5rem 1rem;
        }

        .site-icon {
            width: 64px;
            height: 64px;
        }
    }
</style>