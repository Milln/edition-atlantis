declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"publications": {
"153-sakrale-kunstwerke-im-detail-ostallgau-und-kau.md": {
	id: "153-sakrale-kunstwerke-im-detail-ostallgau-und-kau.md";
  slug: "153-sakrale-kunstwerke-im-detail-ostallgau-und-kau";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"a-demain-dans-les-etoiles-carnets-vagabonds.md": {
	id: "a-demain-dans-les-etoiles-carnets-vagabonds.md";
  slug: "a-demain-dans-les-etoiles-carnets-vagabonds";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"a-mon-fils-a-mon-algerie.md": {
	id: "a-mon-fils-a-mon-algerie.md";
  slug: "a-mon-fils-a-mon-algerie";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"acacia-ou-un-arbre-sous-la-dune.md": {
	id: "acacia-ou-un-arbre-sous-la-dune.md";
  slug: "acacia-ou-un-arbre-sous-la-dune";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"alger-bab-el-oued.md": {
	id: "alger-bab-el-oued.md";
  slug: "alger-bab-el-oued";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"alger-ma-blanche-42-tableaux-peinture-naive-et-aqu.md": {
	id: "alger-ma-blanche-42-tableaux-peinture-naive-et-aqu.md";
  slug: "alger-ma-blanche-42-tableaux-peinture-naive-et-aqu";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"alger-ma-blanche-calendrier-2020-et-2021-25-tablea.md": {
	id: "alger-ma-blanche-calendrier-2020-et-2021-25-tablea.md";
  slug: "alger-ma-blanche-calendrier-2020-et-2021-25-tablea";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"alger-marseille-journal-dune-rapatriee.md": {
	id: "alger-marseille-journal-dune-rapatriee.md";
  slug: "alger-marseille-journal-dune-rapatriee";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"alger-mes-iles-aux-mouettes.md": {
	id: "alger-mes-iles-aux-mouettes.md";
  slug: "alger-mes-iles-aux-mouettes";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"algerie-1955-la-bataille-de-la-peur-jean-brune-le-.md": {
	id: "algerie-1955-la-bataille-de-la-peur-jean-brune-le-.md";
  slug: "algerie-1955-la-bataille-de-la-peur-jean-brune-le-";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"algerie-1960-la-victoire-trahie-guerre-psychologiq.md": {
	id: "algerie-1960-la-victoire-trahie-guerre-psychologiq.md";
  slug: "algerie-1960-la-victoire-trahie-guerre-psychologiq";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"algerie-1962-journal-de-lapocalypse-tagebuch-der-a.md": {
	id: "algerie-1962-journal-de-lapocalypse-tagebuch-der-a.md";
  slug: "algerie-1962-journal-de-lapocalypse-tagebuch-der-a";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"algerie-histoires-a-ne-pas-dire-le-film-choc-inter.md": {
	id: "algerie-histoires-a-ne-pas-dire-le-film-choc-inter.md";
  slug: "algerie-histoires-a-ne-pas-dire-le-film-choc-inter";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"algeriens-nous-sommes-que-histoire-de-lalgerianism.md": {
	id: "algeriens-nous-sommes-que-histoire-de-lalgerianism.md";
  slug: "algeriens-nous-sommes-que-histoire-de-lalgerianism";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"anthologie-jean-brune.md": {
	id: "anthologie-jean-brune.md";
  slug: "anthologie-jean-brune";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"asche-und-glut-erinnerungen-resistance-und-kz-buch.md": {
	id: "asche-und-glut-erinnerungen-resistance-und-kz-buch.md";
  slug: "asche-und-glut-erinnerungen-resistance-und-kz-buch";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"au-pays-de-la-paresse-algerie-1930-roman-colonial.md": {
	id: "au-pays-de-la-paresse-algerie-1930-roman-colonial.md";
  slug: "au-pays-de-la-paresse-algerie-1930-roman-colonial";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"aventures-prodigieuses-de-georges-untel-en-algerie.md": {
	id: "aventures-prodigieuses-de-georges-untel-en-algerie.md";
  slug: "aventures-prodigieuses-de-georges-untel-en-algerie";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"bab-el-oued-raconte-a-toinet-jean-brune-le-journal.md": {
	id: "bab-el-oued-raconte-a-toinet-jean-brune-le-journal.md";
  slug: "bab-el-oued-raconte-a-toinet-jean-brune-le-journal";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"bab-el-oued.md": {
	id: "bab-el-oued.md";
  slug: "bab-el-oued";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"cafe-maure-algerie-1934-roman-colonial.md": {
	id: "cafe-maure-algerie-1934-roman-colonial.md";
  slug: "cafe-maure-algerie-1934-roman-colonial";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"cetait-lalgerie-heureuse-1915-1965-nouvelle-editio.md": {
	id: "cetait-lalgerie-heureuse-1915-1965-nouvelle-editio.md";
  slug: "cetait-lalgerie-heureuse-1915-1965-nouvelle-editio";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"cetait-lalgerie-heureuse-1915-1965.md": {
	id: "cetait-lalgerie-heureuse-1915-1965.md";
  slug: "cetait-lalgerie-heureuse-1915-1965";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"cette-haine-qui-ressemble-a-lamour.md": {
	id: "cette-haine-qui-ressemble-a-lamour.md";
  slug: "cette-haine-qui-ressemble-a-lamour";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"cool-new-book.md": {
	id: "cool-new-book.md";
  slug: "cool-new-book";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"death-of-a-dream-algeria-1958-a-true-novel.md": {
	id: "death-of-a-dream-algeria-1958-a-true-novel.md";
  slug: "death-of-a-dream-algeria-1958-a-true-novel";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"der-monumentalmaler-johann-jakob-zeiller-1708-1783.md": {
	id: "der-monumentalmaler-johann-jakob-zeiller-1708-1783.md";
  slug: "der-monumentalmaler-johann-jakob-zeiller-1708-1783";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"dictionnaire-amoureux-gourmand-et-nostalgique-de-l.md": {
	id: "dictionnaire-amoureux-gourmand-et-nostalgique-de-l.md";
  slug: "dictionnaire-amoureux-gourmand-et-nostalgique-de-l";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"die-fruhe-geschichte-der-stadt-fussen.md": {
	id: "die-fruhe-geschichte-der-stadt-fussen.md";
  slug: "die-fruhe-geschichte-der-stadt-fussen";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"die-st-martinskirche-zu-leutkirch-urkirche-des-nib.md": {
	id: "die-st-martinskirche-zu-leutkirch-urkirche-des-nib.md";
  slug: "die-st-martinskirche-zu-leutkirch-urkirche-des-nib";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"die-wachter-des-abends.md": {
	id: "die-wachter-des-abends.md";
  slug: "die-wachter-des-abends";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"dis-cetait-comment-au-temps-de-lalgerie-francaise-.md": {
	id: "dis-cetait-comment-au-temps-de-lalgerie-francaise-.md";
  slug: "dis-cetait-comment-au-temps-de-lalgerie-francaise-";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"dis-cetait-comment-lalgerie-francaise-20-questions.md": {
	id: "dis-cetait-comment-lalgerie-francaise-20-questions.md";
  slug: "dis-cetait-comment-lalgerie-francaise-20-questions";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"douze-fables-en-sabir-avec-le-cd-du-disque-origina.md": {
	id: "douze-fables-en-sabir-avec-le-cd-du-disque-origina.md";
  slug: "douze-fables-en-sabir-avec-le-cd-du-disque-origina";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"du-sang-sur-la-dune-algerie-1920-roman-colonial.md": {
	id: "du-sang-sur-la-dune-algerie-1920-roman-colonial.md";
  slug: "du-sang-sur-la-dune-algerie-1920-roman-colonial";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"exode.md": {
	id: "exode.md";
  slug: "exode";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"fernand-destaing-medecin-de-lhistoire-biographie.md": {
	id: "fernand-destaing-medecin-de-lhistoire-biographie.md";
  slug: "fernand-destaing-medecin-de-lhistoire-biographie";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"francaoui.md": {
	id: "francaoui.md";
  slug: "francaoui";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"grand-pere-a-tue-deux-colons-8-mai-1945-en-algerie.md": {
	id: "grand-pere-a-tue-deux-colons-8-mai-1945-en-algerie.md";
  slug: "grand-pere-a-tue-deux-colons-8-mai-1945-en-algerie";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"il-etait-une-fois-ma-vie-alger-la-blanche.md": {
	id: "il-etait-une-fois-ma-vie-alger-la-blanche.md";
  slug: "il-etait-une-fois-ma-vie-alger-la-blanche";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"interdit-aux-chiens-et-aux-francais.md": {
	id: "interdit-aux-chiens-et-aux-francais.md";
  slug: "interdit-aux-chiens-et-aux-francais";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"jean-brune-et-albert-camus-deux-ecrivains-pieds-no.md": {
	id: "jean-brune-et-albert-camus-deux-ecrivains-pieds-no.md";
  slug: "jean-brune-et-albert-camus-deux-ecrivains-pieds-no";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"jean-brune-francais-dalgerie-biographie.md": {
	id: "jean-brune-francais-dalgerie-biographie.md";
  slug: "jean-brune-francais-dalgerie-biographie";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"journal-dexil.md": {
	id: "journal-dexil.md";
  slug: "journal-dexil";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"kirchenfresken-ostallgau-und-kaufbeuren-kalender-2.md": {
	id: "kirchenfresken-ostallgau-und-kaufbeuren-kalender-2.md";
  slug: "kirchenfresken-ostallgau-und-kaufbeuren-kalender-2";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"kirchenfuhrer-ostallgau-und-kaufbeuren.md": {
	id: "kirchenfuhrer-ostallgau-und-kaufbeuren.md";
  slug: "kirchenfuhrer-ostallgau-und-kaufbeuren";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"la-brousse-qui-mangea-lhomme-algerie-1914-roman-co.md": {
	id: "la-brousse-qui-mangea-lhomme-algerie-1914-roman-co.md";
  slug: "la-brousse-qui-mangea-lhomme-algerie-1914-roman-co";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"la-dimension-religieuse-de-la-guerre-dalgerie-1954.md": {
	id: "la-dimension-religieuse-de-la-guerre-dalgerie-1954.md";
  slug: "la-dimension-religieuse-de-la-guerre-dalgerie-1954";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"la-france-et-la-tierce-allemagne-a-lexemple-de-la-.md": {
	id: "la-france-et-la-tierce-allemagne-a-lexemple-de-la-.md";
  slug: "la-france-et-la-tierce-allemagne-a-lexemple-de-la-";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"la-guerre-dalgerie-une-guerre-sainte.md": {
	id: "la-guerre-dalgerie-une-guerre-sainte.md";
  slug: "la-guerre-dalgerie-une-guerre-sainte";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"la-guerre-dalgerie-vue-par-six-anciens-combattants.md": {
	id: "la-guerre-dalgerie-vue-par-six-anciens-combattants.md";
  slug: "la-guerre-dalgerie-vue-par-six-anciens-combattants";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"la-guerre-de-troie-commence-demain.md": {
	id: "la-guerre-de-troie-commence-demain.md";
  slug: "la-guerre-de-troie-commence-demain";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"la-lettre-a-un-pere-disparu.md": {
	id: "la-lettre-a-un-pere-disparu.md";
  slug: "la-lettre-a-un-pere-disparu";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"la-mort-mysterieuse-du-colonel-halpert-le-15-fevri.md": {
	id: "la-mort-mysterieuse-du-colonel-halpert-le-15-fevri.md";
  slug: "la-mort-mysterieuse-du-colonel-halpert-le-15-fevri";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"la-revolte.md": {
	id: "la-revolte.md";
  slug: "la-revolte";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"la-traversee-de-fiora-valencourt.md": {
	id: "la-traversee-de-fiora-valencourt.md";
  slug: "la-traversee-de-fiora-valencourt";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"lautre-rivage.md": {
	id: "lautre-rivage.md";
  slug: "lautre-rivage";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"le-papillon-ensable-roman.md": {
	id: "le-papillon-ensable-roman.md";
  slug: "le-papillon-ensable-roman";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"le-reve-assassine-roman-vrai.md": {
	id: "le-reve-assassine-roman-vrai.md";
  slug: "le-reve-assassine-roman-vrai";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"le-sel-des-andalouses.md": {
	id: "le-sel-des-andalouses.md";
  slug: "le-sel-des-andalouses";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"le-soleil-colonial-au-royaume-des-cailloux.md": {
	id: "le-soleil-colonial-au-royaume-des-cailloux.md";
  slug: "le-soleil-colonial-au-royaume-des-cailloux";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"le-troisieme-rubicon-forces-francaises-libres-13-m.md": {
	id: "le-troisieme-rubicon-forces-francaises-libres-13-m.md";
  slug: "le-troisieme-rubicon-forces-francaises-libres-13-m";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"les-ecrivains-pieds-noirs-face-a-la-guerre-dalgeri.md": {
	id: "les-ecrivains-pieds-noirs-face-a-la-guerre-dalgeri.md";
  slug: "les-ecrivains-pieds-noirs-face-a-la-guerre-dalgeri";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"les-enfants-de-la-licorne.md": {
	id: "les-enfants-de-la-licorne.md";
  slug: "les-enfants-de-la-licorne";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"les-francais-dalgerie-de-1962-a-2014.md": {
	id: "les-francais-dalgerie-de-1962-a-2014.md";
  slug: "les-francais-dalgerie-de-1962-a-2014";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"les-harkis-drame-ou-tragedie-1955-2025-un-premier-.md": {
	id: "les-harkis-drame-ou-tragedie-1955-2025-un-premier-.md";
  slug: "les-harkis-drame-ou-tragedie-1955-2025-un-premier-";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"les-maux-pour-le-dire-chroniques-de-ciceron-pour-l.md": {
	id: "les-maux-pour-le-dire-chroniques-de-ciceron-pour-l.md";
  slug: "les-maux-pour-le-dire-chroniques-de-ciceron-pour-l";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"les-mutins.md": {
	id: "les-mutins.md";
  slug: "les-mutins";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"les-oliviers-de-la-justice.md": {
	id: "les-oliviers-de-la-justice.md";
  slug: "les-oliviers-de-la-justice";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"les-oranges-ameres-de-blida.md": {
	id: "les-oranges-ameres-de-blida.md";
  slug: "les-oranges-ameres-de-blida";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"lettre-a-un-maudit.md": {
	id: "lettre-a-un-maudit.md";
  slug: "lettre-a-un-maudit";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"lhote-albert-camus-novelle-jacques-ferrandez.md": {
	id: "lhote-albert-camus-novelle-jacques-ferrandez.md";
  slug: "lhote-albert-camus-novelle-jacques-ferrandez";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"lhote-la-nouvelle-dalbert-camus-et-la-bande-dessin.md": {
	id: "lhote-la-nouvelle-dalbert-camus-et-la-bande-dessin.md";
  slug: "lhote-la-nouvelle-dalbert-camus-et-la-bande-dessin";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"livre-blanc-alger-le-26-mars-1962-la-fusillade-de-.md": {
	id: "livre-blanc-alger-le-26-mars-1962-la-fusillade-de-.md";
  slug: "livre-blanc-alger-le-26-mars-1962-la-fusillade-de-";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"los-caracoles-lepopee-dune-famille-espagnole-a-tra.md": {
	id: "los-caracoles-lepopee-dune-famille-espagnole-a-tra.md";
  slug: "los-caracoles-lepopee-dune-famille-espagnole-a-tra";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"memoire-dabsence.md": {
	id: "memoire-dabsence.md";
  slug: "memoire-dabsence";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"mon-beau-navire-o-ma-memoire-les-paquebots-de-la-m.md": {
	id: "mon-beau-navire-o-ma-memoire-les-paquebots-de-la-m.md";
  slug: "mon-beau-navire-o-ma-memoire-les-paquebots-de-la-m";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"mon-paradis-perdu-une-enfance-algerienne-oran-1954.md": {
	id: "mon-paradis-perdu-une-enfance-algerienne-oran-1954.md";
  slug: "mon-paradis-perdu-une-enfance-algerienne-oran-1954";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"mythos-legion-etrangere-mai-avere-paura-erinnerung.md": {
	id: "mythos-legion-etrangere-mai-avere-paura-erinnerung.md";
  slug: "mythos-legion-etrangere-mai-avere-paura-erinnerung";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"oran-1961-1962-journal-dun-pretre-en-algerie.md": {
	id: "oran-1961-1962-journal-dun-pretre-en-algerie.md";
  slug: "oran-1961-1962-journal-dun-pretre-en-algerie";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"orientalisme-et-laureats-de-la-villa-abd-el-tif-ca.md": {
	id: "orientalisme-et-laureats-de-la-villa-abd-el-tif-ca.md";
  slug: "orientalisme-et-laureats-de-la-villa-abd-el-tif-ca";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"peter-heel-der-vornehme-bildhauer-von-pfronten-169.md": {
	id: "peter-heel-der-vornehme-bildhauer-von-pfronten-169.md";
  slug: "peter-heel-der-vornehme-bildhauer-von-pfronten-169";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"sept-nuits-sur-un-cadavre-algerie-1930-roman-colon.md": {
	id: "sept-nuits-sur-un-cadavre-algerie-1930-roman-colon.md";
  slug: "sept-nuits-sur-un-cadavre-algerie-1930-roman-colon";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"sonnensprossen-funfzehn-etwas-andere-liebesgeschic.md": {
	id: "sonnensprossen-funfzehn-etwas-andere-liebesgeschic.md";
  slug: "sonnensprossen-funfzehn-etwas-andere-liebesgeschic";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"tradition-et-revolution-larmee-prussienne-en-1870.md": {
	id: "tradition-et-revolution-larmee-prussienne-en-1870.md";
  slug: "tradition-et-revolution-larmee-prussienne-en-1870";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"un-combat-tranquille-une-fille-de-harki-se-souvien.md": {
	id: "un-combat-tranquille-une-fille-de-harki-se-souvien.md";
  slug: "un-combat-tranquille-une-fille-de-harki-se-souvien";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"une-histoire-souterraine-pieds-noirs-et-musulmans-.md": {
	id: "une-histoire-souterraine-pieds-noirs-et-musulmans-.md";
  slug: "une-histoire-souterraine-pieds-noirs-et-musulmans-";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
"voyage-au-bout-de-leden-conte-philosophique-prefac.md": {
	id: "voyage-au-bout-de-leden-conte-philosophique-prefac.md";
  slug: "voyage-au-bout-de-leden-conte-philosophique-prefac";
  body: string;
  collection: "publications";
  data: InferEntrySchema<"publications">
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		"authors": {
"andree-montero": {
	id: "andree-montero";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"anne-marie-lorentz": {
	id: "anne-marie-lorentz";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"beatrice-riquelme-olivieri": {
	id: "beatrice-riquelme-olivieri";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"benoit-gaumer": {
	id: "benoit-gaumer";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"charles-courtin": {
	id: "charles-courtin";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"charles-gallea": {
	id: "charles-gallea";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"christiane-lacoste-adrover": {
	id: "christiane-lacoste-adrover";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"daniel-pouilly": {
	id: "daniel-pouilly";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"danielle-deliot-libmann": {
	id: "danielle-deliot-libmann";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"danilo-pagliaro": {
	id: "danilo-pagliaro";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"erwin-munsch": {
	id: "erwin-munsch";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"eva-albes": {
	id: "eva-albes";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"fernand-destaing": {
	id: "fernand-destaing";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"francine-dessaigne": {
	id: "francine-dessaigne";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"hafida-chabi": {
	id: "hafida-chabi";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"helie-de-saint-marc": {
	id: "helie-de-saint-marc";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"henri-mazzarino": {
	id: "henri-mazzarino";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"henry-guey": {
	id: "henry-guey";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"herbert-wittmann": {
	id: "herbert-wittmann";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"janine-montupet": {
	id: "janine-montupet";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"jean-brune": {
	id: "jean-brune";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"jean-pelegri": {
	id: "jean-pelegri";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"jean-pierre-lledo": {
	id: "jean-pierre-lledo";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"jean-taousson": {
	id: "jean-taousson";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"jeanine-de-la-hogue": {
	id: "jeanine-de-la-hogue";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"jerome-tanon": {
	id: "jerome-tanon";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"jocelyne-mas": {
	id: "jocelyne-mas";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"josef-mair": {
	id: "josef-mair";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"le-livre-interdit": {
	id: "le-livre-interdit";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"louis-pozzo-di-borgo": {
	id: "louis-pozzo-di-borgo";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"maia-alonso": {
	id: "maia-alonso";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"marc-faber": {
	id: "marc-faber";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"marie-louise-de-pena": {
	id: "marie-louise-de-pena";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"maurice-calmein": {
	id: "maurice-calmein";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"max-teste": {
	id: "max-teste";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"michel-de-laparre": {
	id: "michel-de-laparre";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"michele-piris-lambert": {
	id: "michele-piris-lambert";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"monique-clavaud": {
	id: "monique-clavaud";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"nicolas-kayanakis": {
	id: "nicolas-kayanakis";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"nicole-guiraud": {
	id: "nicole-guiraud";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"olivier-podevins": {
	id: "olivier-podevins";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"peter-alfred-bletschacher": {
	id: "peter-alfred-bletschacher";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"philippe-lamarque": {
	id: "philippe-lamarque";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"roger-vetillard": {
	id: "roger-vetillard";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"suzon-pulicani-varnier": {
	id: "suzon-pulicani-varnier";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
"wolf-albes": {
	id: "wolf-albes";
  collection: "authors";
  data: InferEntrySchema<"authors">
};
};

	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("./../../src/content/config.js");
}
