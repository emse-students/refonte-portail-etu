<!--
	Renders the "Carte de la Vie Asso" Canari currently has live: the hand-placed poster of the
	association scene, turned into an interactive map where every blob links to that association.

	Two things about the payload shape this component:

	1. It carries NO content. A bubble is a placement plus an `assoId`, so the name, logo and brand
	   color are joined here against the association list the page already loads. A bubble whose
	   association no longer resolves (archived away, deleted, renamed id) is simply dropped - a live
	   map must not be able to produce a dead link.
	2. Its geometry is fractions of the frame, not pixels. Percentages cover position and width for
	   free, but a font size cannot be a percentage of a width, so the frame's rendered width is
	   measured (`bind:clientWidth`) and the pixel sizes derive from it. That also keeps the blob
	   square: `w` is a fraction of the frame WIDTH, for both of its dimensions.

	What happens INSIDE a blob - where the logo sits, how big the name is - is not in the contract and
	is deliberately ours: the fractions below echo the printed poster without importing its constants.
-->
<script lang="ts">
	import type { CanariAssociation, PublishedCarte } from "$lib/types";
	import { logoUrl, initials, generateColor } from "$lib/media";
	import { m } from "$lib/paraglide/messages";

	let {
		carte,
		associations,
	}: {
		carte: PublishedCarte;
		/** The directory's own association list; the join source for every bubble's content. */
		associations: CanariAssociation[];
	} = $props();

	/** Blob-relative geometry, as fractions of the blob diameter. Echoes the poster's proportions. */
	const LOGO_SIZE = 0.44;
	const LOGO_TOP = 0.1;
	const NAME_TOP = 0.56;
	const NAME_WIDTH = 0.73;

	/** Rendered frame width in pixels; every pixel size below is derived from it. */
	let frameWidth = $state(0);

	/** Association id lifted onto the top layer while hovered, so an enlarged blob is never overlapped. */
	let raised = $state<string | null>(null);

	/**
	 * Ids whose logo image failed to load, so the blob falls back to initials. Kept as one array in
	 * the parent rather than as per-bubble component state: a bubble has no behaviour of its own, and
	 * splitting it out would mean threading eight geometry props through to save this list.
	 */
	let brokenLogos = $state<string[]>([]);

	const byId = $derived(new Map(associations.map((a) => [a.id, a])));

	/** Bubbles whose association still resolves, paired with it, back to front. */
	const placed = $derived(
		carte.bubbles
			.map((bubble) => ({ bubble, asso: byId.get(bubble.assoId) }))
			.filter((p): p is { bubble: (typeof carte.bubbles)[number]; asso: CanariAssociation } =>
				Boolean(p.asso)
			)
	);

	/** Name font size as a fraction of the blob diameter; longer names shrink, as on the poster. */
	function nameFontFraction(name: string): number {
		const n = name.length;
		if (n <= 10) return 0.086;
		if (n <= 16) return 0.071;
		if (n <= 22) return 0.062;
		if (n <= 30) return 0.052;
		return 0.048;
	}
</script>

{#if placed.length > 0}
	<!--
		Wide screens only. The map is a dense hand-made composition with no reflow: shrunk to a phone
		its blobs overlap into an unreadable smudge, and the tiles below already serve that viewport.
	-->
	<section
		aria-label={m.associations_carte_label()}
		class="hidden lg:block mb-12 rounded-3xl overflow-hidden border border-white/60 dark:border-white/10 shadow-lg"
	>
		<div
			bind:clientWidth={frameWidth}
			class="relative w-full bg-mines-navy"
			style="aspect-ratio:{carte.aspectRatio}"
		>
			{#if carte.background.dataUrl}
				<img
					src={carte.background.dataUrl}
					alt=""
					class="absolute inset-0 w-full h-full object-cover"
				/>
				<!-- The author's legibility scrim, mirroring the editor's own chrome. -->
				{#if carte.background.scrimOpacity > 0}
					<div
						class="absolute inset-0 bg-black"
						style="opacity:{carte.background.scrimOpacity / 100}"
					></div>
				{/if}
			{/if}

			{#each carte.texts as text, i (i)}
				<div
					class="absolute select-none"
					style="left:{text.x * 100}%;top:{text.y * 100}%;width:{text.w *
						frameWidth}px;z-index:{text.z};font-size:{text.size *
						frameWidth}px;color:{text.color};font-weight:{text.bold
						? 800
						: 400};text-align:{text.align};line-height:1.15;text-shadow:0 1px 3px rgba(0,0,0,0.45)"
				>
					{text.content}
				</div>
			{/each}

			{#each placed as { bubble, asso } (bubble.assoId)}
				{@const size = bubble.w * frameWidth}
				{@const color = bubble.color || asso.color || generateColor(asso.name)}
				{@const url = brokenLogos.includes(asso.id) ? null : logoUrl(asso)}
				<a
					href="/associations/{asso.slug}"
					title={asso.name}
					class="absolute block transition-transform duration-300 ease-out hover:scale-110 focus-visible:scale-110 focus-visible:outline-none motion-reduce:transition-none"
					style="left:{bubble.x * 100}%;top:{bubble.y *
						100}%;width:{size}px;height:{size}px;z-index:{raised === bubble.assoId
						? 10001
						: bubble.z}"
					onmouseenter={() => (raised = bubble.assoId)}
					onmouseleave={() => (raised = null)}
					onfocus={() => (raised = bubble.assoId)}
					onblur={() => (raised = null)}
				>
					<!-- Blob silhouette: the brand-color shape every other layer sits on. -->
					<div
						class="absolute inset-0"
						style="border-radius:{bubble.radius};background:{color};box-shadow:0 8px 22px rgba(0,0,0,0.22)"
					></div>

					<!-- Logo chip: white frame with brand-colored initials, so it reads on the blob. -->
					<div
						class="absolute flex items-center justify-center overflow-hidden bg-white/95 font-extrabold leading-none"
						style="left:{(1 - LOGO_SIZE) * 50}%;top:{LOGO_TOP * 100}%;width:{LOGO_SIZE *
							100}%;height:{LOGO_SIZE *
							100}%;border-radius:{bubble.logoRadius};color:{color};font-size:{size *
							LOGO_SIZE *
							0.4}px;box-shadow:0 4px 14px rgba(0,0,0,0.2)"
					>
						{#if url}
							<img
								src={url}
								alt=""
								loading="lazy"
								decoding="async"
								class="w-full h-full object-cover"
								onerror={() => (brokenLogos = [...brokenLogos, asso.id])}
							/>
						{:else}
							<span>{initials(asso.name)}</span>
						{/if}
					</div>

					<!-- Association name inside the blob, below the logo; wraps and shrinks to fit. -->
					<div
						class="absolute text-center font-extrabold text-white"
						style="left:{(1 - NAME_WIDTH) * 50}%;top:{NAME_TOP * 100}%;width:{NAME_WIDTH *
							100}%;font-size:{nameFontFraction(asso.name) *
							size}px;line-height:1.1;overflow-wrap:break-word;text-shadow:0 1px 3px rgba(0,0,0,0.45)"
					>
						{asso.name}
					</div>
				</a>
			{/each}
		</div>
	</section>
{/if}
