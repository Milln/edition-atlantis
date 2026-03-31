import { getCollection } from 'astro:content';

export async function GET({ params, request }) {
    const publications = await getCollection('publications');
    const authors = await getCollection('authors');

    // Create a searchable index
    // We include fields that we want to search over
    const searchIndex = publications.map(publication => {
        // Resolve author name
        const authorId = typeof publication.data.author === 'object' ? publication.data.author.id : publication.data.author;
        const authorEntry = authors.find(a => a.id === authorId);
        const authorName = authorEntry ? authorEntry.data.name : authorId;

        let descText = '';
        if (typeof publication.data.description === 'string') {
            descText = publication.data.description;
        } else if (publication.data.description && typeof publication.data.description === 'object') {
            // Search across all available translations
            descText = Object.values(publication.data.description).join(' ');
        }

        return {
            title: publication.data.title,
            description: descText,
            isbn10: publication.data.isbn10 || '',
            isbn13: publication.data.isbn13 || '',
            author: authorName,
            slug: publication.slug,
            lang: publication.data.language,
            year: publication.data.publicationDate ? publication.data.publicationDate.getFullYear() : 'unknown',
            cover: publication.data.cover
        };
    });

    return new Response(JSON.stringify(searchIndex), {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
    });
}
