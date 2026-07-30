<!--
	The "Carte de la Vie Asso" Canari currently has live: the hand-composed poster of the association
	scene, reproduced here as an interactive map where every association links to its page.

	It is a COPY, not an interpretation. Canari publishes the poster already resolved - every box,
	every font size, the bureau crown, the length-based name shrinking, the author's own tuning - and
	this component draws those numbers and decides nothing of its own. That is the whole design:

	1. **One scale factor.** The payload's geometry is in POSTER pixels against `carte.stage`, so the
	   stage is drawn at its native size and scaled once (`k`). Every published number is then used
	   verbatim, which is also what makes the directory's shrink-to-fit land on the same font size as
	   the editor: the loop measures the same poster pixels on both sides.
	2. **Live join for the association, snapshot for the people.** A unit carries `assoId`, so the
	   name, logo and brand color come from the association list this page already loads - a rename
	   reaches the map with no republish. Member names and roles travel in the payload instead,
	   because WHICH member sits in WHICH crown slot is an authoring decision, not live data.
	3. **The chrome below is mirrored, not published.** Card padding, corner radii and shadows are
	   cosmetic constants copied from Canari's `PosterCanvas.svelte`; only geometry that the author
	   can move (or tune) travels. If the poster's card is ever redesigned, these follow by hand.

	A v1 publication (fractions of the frame, `bubbles`, no members) carries no `units` and cannot be
	rendered faithfully, so the map is simply omitted until the author republishes.
-->
<script lang="ts">
	import type { CanariAssociation, PublishedCarte, PublishedCarteUnit } from "$lib/types";
	import { logoUrl, avatarUrl, generateColor } from "$lib/media";
	import { m } from "$lib/paraglide/messages";

	let {
		carte,
		associations,
	}: {
		carte: PublishedCarte;
		/** The directory's own association list; the join source for every unit's content. */
		associations: CanariAssociation[];
	} = $props();

	/** Canari's two families, self-hosted (see app.css). Poster body text is Nunito. */
	const BODY_FONT = "'Nunito Variable', 'Nunito', 'Segoe UI', sans-serif";
	/** Display font: the poster's title, its free-text labels and the directory headings. */
	const DISPLAY_FONT = "'Fredoka Variable', 'Fredoka', 'Segoe UI', sans-serif";

	// Cosmetic card chrome, mirrored from Canari's PosterCanvas.svelte (poster px).
	const CARD_RADIUS = 9;
	const CARD_PAD = 6;
	const CARD_PAD_BOTTOM = 7;
	/** The photo is square and inset from the card by the padding on both sides. */
	const CARD_PHOTO_INSET = 2 * CARD_PAD;
	const CARD_PHOTO_RADIUS = 7;
	const CARD_INITIALS_SIZE = 22;

	/** How much a hovered unit grows, and the z-index it borrows while it does. */
	const HOVER_SCALE = 1.1;
	const HOVER_Z = 10001;

	/** Rendered width of the frame, in CSS px. Drives the single stage scale factor. */
	let frameWidth = $state(0);

	/** Poster px -> CSS px. The stage is drawn at native size and scaled by this. */
	const k = $derived(carte.stage?.w ? frameWidth / carte.stage.w : 0);

	/** Association id lifted to the top layer while hovered, so a grown unit is never overlapped. */
	let raised = $state<string | null>(null);

	const byId = $derived(new Map(associations.map((a) => [a.id, a])));

	/**
	 * Units whose association still resolves, paired with it. A unit pointing at an archived or
	 * deleted association is dropped: a live map must not be able to produce a dead link.
	 */
	const placed = $derived(
		(carte.units ?? [])
			.map((unit) => ({ unit, asso: byId.get(unit.assoId) }))
			.filter((p): p is { unit: PublishedCarteUnit; asso: CanariAssociation } => Boolean(p.asso))
	);

	/**
	 * Brand color of a unit: the author's override wins, then the association's live color, then the
	 * color the poster resolved (which is what an association with no color of its own printed as).
	 */
	function unitColor(unit: PublishedCarteUnit, asso: CanariAssociation): string {
		return unit.color ?? asso.color ?? unit.colorFallback;
	}

	/** The color the poster printed for an association, for the directory's dot. */
	const colorById = $derived(
		new Map((carte.units ?? []).map((unit) => [unit.assoId, unit.colorFallback]))
	);

	/** Hides a broken photo/logo so the colored initials layer behind it shows through. */
	function hideOnError(event: Event) {
		(event.currentTarget as HTMLImageElement).style.display = "none";
	}

	/** The directory's fixed-height body and its multi-column content, for the font auto-fit. */
	let dirBodyEl = $state<HTMLElement>();
	let dirContentEl = $state<HTMLElement>();

	/**
	 * Shrinks the directory font until every member fits the fixed panel, exactly as Canari's editor
	 * does - the published `fontSize` is where the search starts, not where it ends. Sizes are applied
	 * imperatively so the measuring loop never re-triggers itself, and item text is in `em` so scaling
	 * the wrapper scales the whole list.
	 *
	 * The measurement is scale-invariant: `clientHeight`/`scrollHeight` are layout pixels, which a CSS
	 * transform does not touch, so this measures the same poster pixels the editor measured.
	 */
	$effect(() => {
		const dir = carte.directory;
		const body = dirBodyEl;
		const contentNode = dirContentEl;
		if (!dir || !body || !contentNode || dir.zones.length === 0) return;
		const raf = requestAnimationFrame(() => {
			const avail = body.clientHeight;
			let font = dir.fontSize;
			contentNode.style.fontSize = `${font}px`;
			// Step down until it fits or we hit a readable floor.
			while (contentNode.scrollHeight > avail && font > dir.fontSize * 0.5) {
				font -= 0.5;
				contentNode.style.fontSize = `${font}px`;
			}
		});
		return () => cancelAnimationFrame(raf);
	});
</script>

{#if placed.length > 0}
	<!--
		Wide screens only. The map is a dense hand-made composition with no reflow: shrunk to a phone
		its units overlap into an unreadable smudge, and the tiles below already serve that viewport.
	-->
	<section
		aria-label={m.associations_carte_label()}
		class="hidden lg:block mb-12 rounded-3xl overflow-hidden border border-white/60 dark:border-white/10 shadow-lg"
	>
		<div
			bind:clientWidth={frameWidth}
			class="relative w-full overflow-hidden"
			style="aspect-ratio:{carte.aspectRatio};background:{carte.style.pageBg}"
		>
			<!-- The poster at its native size, scaled as one block: see the header comment. -->
			{#if k > 0}
				<div
					class="absolute top-0 left-0 origin-top-left"
					style="width:{carte.stage.w}px;height:{carte.stage
						.h}px;transform:scale({k});font-family:{BODY_FONT}"
				>
					{#if carte.background.dataUrl}
						<img
							src={carte.background.dataUrl}
							alt=""
							class="absolute inset-0 w-full h-full object-cover"
						/>
						{#if carte.background.scrimOpacity > 0}
							<div
								class="absolute inset-0"
								style="background:{carte.style.scrimColor};opacity:{carte.background.scrimOpacity /
									100}"
							></div>
						{/if}
					{/if}

					{#if carte.title}
						<div
							class="absolute"
							style="left:{carte.title.x}px;top:{carte.title.y}px;width:{carte.title
								.w}px;z-index:{carte.title.z}"
						>
							<!-- A <p>, not a heading: the showcase's global h1-h6 rules would restyle the poster. -->
							<p
								class="m-0"
								style="font-family:{DISPLAY_FONT};font-size:{carte.title.size}px;font-weight:{carte
									.title.weight};color:{carte.title.color};text-align:{carte.title
									.align};line-height:normal"
							>
								{carte.title.content}
							</p>
						</div>
					{/if}

					{#each carte.texts as text, i (i)}
						<div
							class="absolute select-none"
							style="left:{text.x}px;top:{text.y}px;width:{text.w}px;z-index:{text.z};font-family:{DISPLAY_FONT};font-size:{text.size}px;font-weight:{text.weight};text-align:{text.align};color:{text.color};line-height:1.25;white-space:pre-wrap;overflow-wrap:break-word"
						>
							{text.content}
						</div>
					{/each}

					{#each placed as { unit, asso } (unit.assoId)}
						{@const color = unitColor(unit, asso)}
						{@const url = logoUrl(asso)}
						<!--
							One association unit. The link box is the unit itself, so the whole composition
							(blob, logo, crown, name) is clickable, and `aria-label` keeps the accessible name
							down to the association instead of reading every face out loud.
						-->
						<a
							href="/associations/{asso.slug}"
							aria-label={asso.name}
							title={asso.name}
							class="absolute block origin-center transition-transform duration-300 ease-out focus-visible:outline-none motion-reduce:transition-none"
							style="left:{unit.x}px;top:{unit.y}px;width:{unit.w}px;height:{unit.h}px;transform:scale({raised ===
							unit.assoId
								? unit.scale * HOVER_SCALE
								: unit.scale});z-index:{raised === unit.assoId ? HOVER_Z : unit.z}"
							onmouseenter={() => (raised = unit.assoId)}
							onmouseleave={() => (raised = null)}
							onfocus={() => (raised = unit.assoId)}
							onblur={() => (raised = null)}
						>
							<!-- Blob silhouette: the brand-color shape every other layer sits on. -->
							<div
								class="absolute"
								style="left:{unit.blob.x}px;top:{unit.blob.y}px;width:{unit.blob
									.size}px;height:{unit.blob.size}px;border-radius:{unit.blob
									.radius};background:{color};box-shadow:0 8px 22px rgba(0,0,0,0.22)"
							></div>

							<!-- Hero logo: its own frame shape, centered on the blob, allowed to overflow it. -->
							<div
								class="absolute flex items-center justify-center overflow-hidden font-extrabold leading-none"
								style="left:{unit.logo.x}px;top:{unit.logo.y}px;width:{unit.logo.w}px;height:{unit
									.logo.h}px;border-radius:{unit.logo
									.radius};background:rgba(255,255,255,0.94);color:{color};font-size:{unit.logo
									.initialsSize}px;box-shadow:0 4px 14px rgba(0,0,0,0.2)"
							>
								<span>{unit.logo.initials}</span>
								{#if url}
									<img
										src={url}
										alt=""
										loading="lazy"
										decoding="async"
										onerror={hideOnError}
										class="absolute inset-0 w-full h-full object-cover"
									/>
								{/if}
							</div>

							<!-- Bureau cards over the blob's top arc, then the president in front of them. -->
							{#each unit.cards as card (card.userId)}
								<div class="absolute" style="left:{card.x}px;top:{card.y}px">
									<div
										style="width:{card.w}px;background:{carte.style
											.cardBg};border-radius:{CARD_RADIUS}px;padding:{CARD_PAD}px {CARD_PAD}px {CARD_PAD_BOTTOM}px;box-shadow:0 4px 11px rgba(0,0,0,0.22)"
									>
										<div
											class="relative flex items-center justify-center overflow-hidden font-extrabold text-white"
											style="width:{card.w - CARD_PHOTO_INSET}px;height:{card.w -
												CARD_PHOTO_INSET}px;border-radius:{CARD_PHOTO_RADIUS}px;background:{color};font-size:{CARD_INITIALS_SIZE}px"
										>
											<span>{card.initials}</span>
											<img
												src={avatarUrl(card.userId)}
												alt=""
												loading="lazy"
												decoding="async"
												onerror={hideOnError}
												class="absolute inset-0 w-full h-full object-cover"
											/>
										</div>
										<p
											class="text-center"
											style="margin:4px 0 0;font-size:{card.nameSize}px;font-weight:700;line-height:1.1;color:{carte
												.style.cardTextColor};overflow-wrap:anywhere;word-break:break-word"
										>
											{card.name}
										</p>
										{#if card.role}
											<p
												class="text-center"
												style="margin:1px 0 0;font-size:{card.roleSize}px;font-weight:600;line-height:1.05;color:{carte
													.style
													.cardTextColor};opacity:0.72;overflow-wrap:anywhere;word-break:break-word"
											>
												{card.role}
											</p>
										{/if}
									</div>
								</div>
							{/each}

							<!-- Association name inside the blob, below the logo; wraps and shrinks to fit. -->
							<div
								class="absolute text-center"
								style="left:{unit.name.x}px;top:{unit.name.y}px;width:{unit.name.w}px"
							>
								<p
									class="m-0 text-white"
									style="font-size:{unit.name
										.size}px;font-weight:800;line-height:1.1;overflow-wrap:break-word;text-shadow:0 1px 3px rgba(0,0,0,0.45)"
								>
									{asso.name}
								</p>
								{#if asso.contactEmail}
									<p
										style="margin:2px 0 0;font-size:{unit.name
											.emailSize}px;font-weight:600;line-height:normal;color:rgba(255,255,255,0.85);word-break:break-all"
									>
										{asso.contactEmail}
									</p>
								{/if}
							</div>
						</a>
					{/each}

					{#if carte.directory && carte.directory.zones.length > 0}
						{@const dir = carte.directory}
						<!-- The poster's member directory: every member, grouped by association. -->
						<aside
							class="absolute flex flex-col overflow-hidden box-border"
							style="left:{dir.x}px;top:{dir.y}px;width:{dir.w}px;height:{dir.h}px;background:{carte
								.style
								.directoryBg};border-radius:{dir.radius}px;padding:{dir.padY}px {dir.padX}px;box-shadow:0 10px 30px rgba(0,0,0,0.14)"
						>
							<p
								class="flex-none"
								style="font-family:{DISPLAY_FONT};font-size:{dir.headingSize}px;font-weight:800;margin:0 0 14px;line-height:normal;color:{carte
									.style.directoryTextColor}"
							>
								{dir.heading}
							</p>
							<!-- Fixed-height, clipped body: the effect above shrinks the font until it fits. -->
							<div bind:this={dirBodyEl} class="flex-1 min-h-0 overflow-hidden">
								<div
									bind:this={dirContentEl}
									style="columns:{dir.columns};column-gap:{dir.columnGap}px;font-size:{dir.fontSize}px"
								>
									{#each dir.zones as zone, zi (zi)}
										<div
											style="break-inside:avoid;break-after:avoid;margin-top:{zi === 0
												? '0'
												: '1.5em'};margin-bottom:0.8em;font-family:{DISPLAY_FONT};font-weight:700;font-size:1em;color:{carte
												.style
												.directoryTextColor};letter-spacing:0.01em;border-bottom:1px solid {carte
												.style.directoryMutedColor}40;padding-bottom:0.2em"
										>
											{zone.label}
										</div>
										{#each zone.assos as entry (entry.assoId)}
											{@const asso = byId.get(entry.assoId)}
											{#if asso}
												<div style="break-inside:avoid;margin-bottom:0.9em">
													<div
														style="display:flex;align-items:baseline;gap:0.5em;margin-bottom:0.2em"
													>
														<span
															class="flex-none"
															style="width:0.7em;height:0.7em;border-radius:50%;background:{asso.color ??
																colorById.get(entry.assoId) ??
																generateColor(asso.name)};transform:translateY(0.08em)"
														></span>
														<span
															style="font-size:1em;font-weight:800;line-height:1.2;color:{carte
																.style.directoryTextColor}"
														>
															{asso.name}
														</span>
													</div>
													{#if entry.line}
														<p
															style="margin:0 0 0 1.2em;font-size:0.65em;line-height:1.35;color:{carte
																.style.directoryMutedColor}"
														>
															{entry.line}
														</p>
													{/if}
												</div>
											{/if}
										{/each}
									{/each}
								</div>
							</div>
						</aside>
					{/if}
				</div>
			{/if}
		</div>
	</section>
{/if}
