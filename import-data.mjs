
import fs from 'fs';
import path from 'path';

// Paths
const SQL_FILE = 'wordpress_2.sql';
const AUTHORS_DIR = 'src/content/authors';
const BOOKS_DIR = 'src/content/books';

// Helper to slugify strings
function slugify(text) {
    if (!text) return 'unknown';
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

function detectLanguage(text) {
    if (!text) return 'fr';
    const lower = text.toLowerCase();
    const deWords = [' und ', ' der ', ' die ', ' das ', ' ist ', ' von ', ' eine ', ' mit '];
    const frWords = [' le ', ' la ', ' les ', ' et ', ' est ', ' dans ', ' des ', ' pour '];

    let deCount = 0;
    let frCount = 0;

    deWords.forEach(w => { if (lower.includes(w)) deCount++; });
    frWords.forEach(w => { if (lower.includes(w)) frCount++; });

    if (deCount > frCount) return 'de';
    return 'fr';
}

function decodeEntities(text) {
    if (!text) return '';
    return text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&Agrave;/g, 'À')
        .replace(/&Eacute;/g, 'É')
        ;
}

// Helper to strip HTML and fix spacing
function stripHTML(html) {
    if (!html) return '';
    let text = html.replace(/<[^>]*>/g, '');
    text = decodeEntities(text).trim();
    // Replace \r\n, \n, \r with \n\n for markdown paragraphs
    return text
        .replace(/\\r\\n/g, '\n\n')
        .replace(/\r\n/g, '\n\n')
        .replace(/\\n/g, '\n\n') // Literal \n
        .replace(/\\r/g, '\n\n'); // Literal \r
}

function htmlToMarkdown(html) {
    if (!html) return '';
    let md = html;

    // Simple replacements
    md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
    md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<br\s*\/?>/gi, '\n');
    md = md.replace(/<p>(.*?)<\/p>/gi, '\n\n$1\n\n');
    md = md.replace(/<center>(.*?)<\/center>/gi, '\n$1\n');

    // Lists (simple)
    md = md.replace(/<ul>/gi, '\n');
    md = md.replace(/<\/ul>/gi, '\n');
    md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');

    // Remove remaining tags
    md = md.replace(/<[^>]*>/g, '');

    // Decode entities
    md = decodeEntities(md);

    // Fix literal escaped newlines from SQL
    md = md
        .replace(/\\r\\n/g, '\n\n')
        .replace(/\r\n/g, '\n\n')
        .replace(/\\n/g, '\n\n')
        .replace(/\\r/g, '\n\n');

    // Clean up whitespace
    md = md.replace(/\n\s+\n/g, '\n\n');
    md = md.replace(/\n{3,}/g, '\n\n');

    return md.trim();
}

function parseSQL() {
    console.log('Reading SQL file...');
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');

    // Regex for Authors INSERT
    // Handle SQL escaping: ' -> '' or \' -> '
    const authorRegex = /\((\d+),\s*'((?:[^']|''|\\')*)',\s*'((?:[^']|''|\\')*)',\s*'((?:[^']|''|\\')*)'\)/g;

    // Regex for Publications INSERT
    const pubRegex = /\((\d+),\s*\d+,\s*(\d+),\s*'((?:[^']|''|\\')*)',\s*'((?:[^']|''|\\')*)',\s*[\d\.]+,\s*'((?:[^']|''|\\')*)'/g;

    const authors = {};
    const publications = [];

    let match;
    // Parse Authors
    while ((match = authorRegex.exec(sqlContent)) !== null) {
        const [_, id, vorname, nachname, text] = match;
        const bio = text.replace(/''/g, "'").replace(/\\'/g, "'");
        // Also need to fix formatted bio for JSON
        const cleanBio = htmlToMarkdown(bio);
        authors[id] = {
            id,
            name: `${vorname} ${nachname}`.trim(),
            bio: cleanBio,
            slug: slugify(`${vorname} ${nachname}`.trim()) || `author-${id}`
        };
    }
    console.log(`Parsed ${Object.keys(authors).length} authors.`);

    // Parse Publications
    while ((match = pubRegex.exec(sqlContent)) !== null) {
        const [_, id, autId, titel, text, isbn] = match;
        const title = titel.replace(/''/g, "'").replace(/\\'/g, "'");
        const rawText = text.replace(/''/g, "'").replace(/\\'/g, "'");

        publications.push({
            id,
            autId,
            title,
            text: rawText,
            isbn: isbn ? isbn.replace(/''/g, "'").replace(/\\'/g, "'") : '',
        });
    }
    console.log(`Parsed ${publications.length} publications.`);

    return { authors, publications };
}

function generateFiles({ authors, publications }) {
    // Generate Author Files (JSON)
    if (!fs.existsSync(AUTHORS_DIR)) fs.mkdirSync(AUTHORS_DIR, { recursive: true });

    Object.values(authors).forEach(author => {
        const filePath = path.join(AUTHORS_DIR, `${author.slug}.json`);
        // Only write if not exists or overwrite? We'll overwrite to fix data.
        const data = {
            name: author.name,
            bio: author.bio,
            photo: '/images/authors/default.jpg'
        };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    });

    // Generate Book Files (Markdown)
    if (!fs.existsSync(BOOKS_DIR)) fs.mkdirSync(BOOKS_DIR, { recursive: true });

    publications.forEach(pub => {
        const author = authors[pub.autId];
        const authorSlug = author ? author.slug : 'unknown';
        const lang = detectLanguage(pub.text);

        // Prepare Full Description for Frontmatter (Plain Text)
        // stripHTML now handles \r\n -> \n\n
        const plainDesc = stripHTML(pub.text);

        // Prepare Title and ISBN
        // Use JSON.stringify to ensure safe YAML string (handles quotes, backslashes etc)
        const safeTitle = JSON.stringify(pub.title);
        const safeIsbn = JSON.stringify(pub.isbn || '');

        // Prepare Body (Markdown)
        const markdownBody = htmlToMarkdown(pub.text);

        // Handle description block scalar
        // Indent each line by 2 spaces for YAML block
        const indentDesc = plainDesc.split('\n').map(l => '  ' + l).join('\n');

        const frontmatter = `---
title: ${safeTitle}
author: ${authorSlug}
publicationDate: 2000-01-01
isbn: ${safeIsbn}
description: |
${indentDesc}
cover: "/images/books/book-placeholder.jpg"
language: "${lang}"
---

${markdownBody}
`;
        let filename = slugify(pub.title);
        if (filename.length > 50) filename = filename.substring(0, 50);

        // Handle name collision
        if (fs.existsSync(path.join(BOOKS_DIR, `${filename}.md`))) {
            filename = `${filename}-${pub.id}`;
        }

        fs.writeFileSync(path.join(BOOKS_DIR, `${filename}.md`), frontmatter);
    });
}

const data = parseSQL();
generateFiles(data);
console.log('Import completed.');
