<script lang="ts">
    import type { List } from "$lib/databasetypes";

    interface ListWithAssociation extends List {
        association_name?: string;
    }

    export let list: ListWithAssociation;

    import { resolve, asset } from "$app/paths";

    // Function to get the full URL for the list logo
    function getLogoUrl(logoPath: string): string {
        return asset(logoPath);
    }
</script>

<div class="list-card">
    <a href={resolve(`/lists/${list.handle}`)} aria-label={`Voir les détails de ${list.name}`}>
    {#if list.icon}
        <img src={getLogoUrl(list.icon)} alt={`${list.name} logo`} class="list-logo" />
    {:else}
        <div class="list-logo-placeholder">
            <span class="placeholder-text">{list.name.charAt(0).toUpperCase()}</span>
        </div>
    {/if}
    <div class="list-info">
        <h2 class="list-name">{list.name}</h2>
        {#if list.association_name}
            <p class="association-name">{list.association_name}</p>
        {/if}
    </div>
    </a>
</div>

<style>
    .list-card {
        position: relative;
        border-radius: 16px;
        padding: 0;
        overflow: hidden;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .list-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: #7c3aed;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
    }

    .list-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
        border-color: #7c3aed;
    }

    .list-card:hover::before {
        transform: scaleX(1);
    }

    .list-card a {
        display: flex;
        flex-direction: column;
        text-decoration: none;
        color: inherit;
        height: 100%;
    }

    .list-logo {
        width: 100%;
        height: 200px;
        object-fit: cover;
        background: #f9fafb;
        transition: transform 0.3s ease;
    }

    .list-logo-placeholder {
        width: 100%;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #7c3aed;
        transition: transform 0.3s ease;
    }

    .placeholder-text {
        font-size: 5rem;
        font-weight: 700;
        color: white;
        user-select: none;
    }

    .list-card:hover .list-logo,
    .list-card:hover .list-logo-placeholder {
        transform: scale(1.02);
    }

    .list-info {
        padding: 1.5rem;
        text-align: center;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .list-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a202c;
        margin: 0;
        line-height: 1.4;
        transition: color 0.2s ease;
    }

    .association-name {
        font-size: 0.9rem;
        color: #6b7280;
        margin: 0;
        font-weight: 500;
    }

    .list-card:hover .list-name {
        color: #7c3aed;
    }

    @media (max-width: 768px) {
        .list-logo,
        .list-logo-placeholder {
            height: 160px;
        }

        .placeholder-text {
            font-size: 4rem;
        }

        .list-info {
            padding: 1rem;
        }

        .list-name {
            font-size: 1.1rem;
        }

        .association-name {
            font-size: 0.85rem;
        }
    }
</style>
