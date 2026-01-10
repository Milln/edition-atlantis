import { getCollection } from 'astro:content';

export async function GET({ params, request }) {
    const books = await getCollection('books');
    const authors = await getCollection('authors');

    // Create a searchable index
    // We include fields that we want to search over
    const searchIndex = books.map(book => {
        // Resolve author name
        const authorId = typeof book.data.author === 'object' ? book.data.author.id : book.data.author;
        const authorEntry = authors.find(a => a.id === authorId);
        const authorName = authorEntry ? authorEntry.data.name : authorId;

        let descText = '';
        if (typeof book.data.description === 'string') {
            descText = book.data.description;
        } else if (book.data.description && typeof book.data.description === 'object') {
            // Search across all available translations
            descText = Object.values(book.data.description).join(' ');
        }

        return {
            title: book.data.title,
            description: descText,
            isbn: book.data.isbn,
            author: authorName,
            slug: book.slug,
            lang: book.data.language,
            year: book.data.publicationDate.getFullYear(),
            cover: book.data.cover
        };
    });

    return new Response(JSON.stringify(searchIndex), {
        status: 200,
        headers: {
            "Content-Type": "application/json"
        }
    });
}
