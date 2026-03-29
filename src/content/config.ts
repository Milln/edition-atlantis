import { defineCollection, reference, z } from 'astro:content';

const booksCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        author: reference('authors'),
        publicationDate: z.date().nullable().optional(),
        isbn: z.string().optional(),
        description: z.union([
            z.string(),
            z.object({
                de: z.string().optional(),
                en: z.string().optional(),
                fr: z.string().optional(),
            })
        ]),
        cover: z.string(),
        back: z.string().optional(),
        price: z.number().optional(),
        coAuthors: z.array(reference('authors')).optional(),
        language: z.enum(['de', 'en', 'fr']),
        category: z.string().optional(),
    }),
});

const authorsCollection = defineCollection({
    type: 'data',
    schema: z.object({
        name: z.string(),
        bio: z.string(),
        photo: z.string(),
    }),
});

export const collections = {
    'books': booksCollection,
    'authors': authorsCollection,
};
