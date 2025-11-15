<script lang="ts">
    import type { Association } from "$lib/databasetypes";

    export let association: Association;

    import { resolve, asset } from "$app/paths";

    // Function to get the full URL for the association logo
    function getLogoUrl(logoPath: string): string {
        return asset(logoPath);
    }
</script>

<div class="association-card">
    <a href={resolve(`/associations/${association.handle}`)} aria-label={`Voir les détails de ${association.name}`}>
    {#if association.icon}
        <img src={getLogoUrl(association.icon)} alt={`${association.name} logo`} class="association-logo" />
    {:else}
        <div class="association-logo-placeholder">
            <span class="placeholder-text">{association.name.charAt(0).toUpperCase()}</span>
        </div>
    {/if}
    <div class="association-info">
        <h2 class="association-name">{association.name}</h2>
    </div>
    </a>
</div>

<style>
    .association-card {
        position: relative;
        border-radius: 16px;
        padding: 0;
        overflow: hidden;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border: 1px solid rgba(124, 58, 237, 0.1);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .association-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #7c3aed 0%, #ec4899 100%);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
    }

    .association-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(124, 58, 237, 0.15), 0 6px 12px rgba(236, 72, 153, 0.1);
        border-color: rgba(124, 58, 237, 0.3);
    }

    .association-card:hover::before {
        transform: scaleX(1);
    }

    .association-card a {
        display: flex;
        flex-direction: column;
        text-decoration: none;
        color: inherit;
        height: 100%;
    }

    .association-logo {
        width: 100%;
        height: 200px;
        object-fit: cover;
        background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
        transition: transform 0.3s ease;
    }

    .association-logo-placeholder {
        width: 100%;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
        transition: transform 0.3s ease;
    }

    .placeholder-text {
        font-size: 5rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        user-select: none;
    }

    .association-card:hover .association-logo,
    .association-card:hover .association-logo-placeholder {
        transform: scale(1.05);
    }

    .association-info {
        padding: 1.5rem;
        text-align: center;
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .association-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a202c;
        margin: 0;
        line-height: 1.4;
        transition: color 0.2s ease;
    }

    .association-card:hover .association-name {
        color: #7c3aed;
    }

    @media (max-width: 768px) {
        .association-logo,
        .association-logo-placeholder {
            height: 160px;
        }

        .placeholder-text {
            font-size: 4rem;
        }

        .association-info {
            padding: 1rem;
        }

        .association-name {
            font-size: 1.1rem;
        }
    }
</style>