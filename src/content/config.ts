import { defineCollection, reference, z } from 'astro:content';

const publicationsCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        author: reference('authors'),
        publicationDate: z.coerce.date().nullable().optional(),
        isbn10: z.string().nullable().optional(),
        isbn13: z.string().nullable().optional(),
        pageCount: z.number().nullable().optional(),
        binding: z.string().nullable().optional(),
        amazonLink: z.string().url().nullable().optional(),
        description: z.union([
            z.string(),
            z.object({
                de: z.object({
                    text: z.string(),
                    original: z.boolean().optional(),
                }).optional(),
                en: z.object({
                    text: z.string(),
                    original: z.boolean().optional(),
                }).optional(),
                fr: z.object({
                    text: z.string(),
                    original: z.boolean().optional(),
                }).optional(),
            })
        ]),
        cover: z.string(),
        back: z.string().nullable().optional(),
        price: z.number().nullable().optional(),
        coAuthors: z.array(reference('authors')).nullable().optional(),
        language: z.enum(['de', 'en', 'fr']),
        category: z.string().nullable().optional(),
        downloads: z.array(z.object({
            label: z.string(),
            file: z.string(),
        })).nullable().optional(),
    }),
});

const authorsCollection = defineCollection({
    type: 'data',
    schema: z.object({
        name: z.string(),
        bio: z.union([
            z.string(),
            z.object({
                de: z.object({
                    text: z.string(),
                    original: z.boolean().optional(),
                }).optional(),
                en: z.object({
                    text: z.string(),
                    original: z.boolean().optional(),
                }).optional(),
                fr: z.object({
                    text: z.string(),
                    original: z.boolean().optional(),
                }).optional(),
            })
        ]),
        photo: z.string(),
    }),
});

export const collections = {
    'publications': publicationsCollection,
    'authors': authorsCollection,
};
