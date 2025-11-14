<script lang="ts">
    import type { Association } from "$lib/databasetypes";

    let { data } = $props();
    const association: Association = data.association;
</script>

<svelte:head>
    <title>{association.name}</title>
    <meta
        name="description"
        content="Découvrez la vie associative de notre campus."
    />
</svelte:head>
<div class="container">
    <header>
        <h1>{association.name}</h1>
    </header>
    <p>{association.description}</p>
    <h2>Membres</h2>
    <ul>
        {#each association.members as member}
            <li>{member.user.name} - {member.role.name}</li>
        {/each}
    </ul>
    <h2>Evenement à venir</h2>
    <ul>
        
    </ul>
        
</div>

<style>
    .container header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .container h2 {
        margin-top: 2rem;
        font-size: 1.8rem;
        font-weight: 600;
        color: darkorchid;
    }

    .container p{
        font-size: 1.1rem;
		color: #666;
		max-width: 600px;
		margin: 0 auto;
    }
</style>
