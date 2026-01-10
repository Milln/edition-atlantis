
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SQL_FILE = path.join(PROJECT_ROOT, 'wordpress_2.sql');
const PICS_DIR = path.join(PROJECT_ROOT, 'pics');
const AUTHORS_DIR = path.join(PROJECT_ROOT, 'src/content/authors');
const BOOKS_DIR = path.join(PROJECT_ROOT, 'src/content/books');
const PUBLIC_IMG_AUTHORS = path.join(PROJECT_ROOT, 'public/images/authors');
const PUBLIC_IMG_BOOKS = path.join(PROJECT_ROOT, 'public/images/books');

async function ensureDir(dir) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

function normalize(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function parseSQL() {
    const content = await fs.readFile(SQL_FILE, 'utf-8');
    const lines = content.split('\n');
    const authors = {};
    const publications = {};
    const links = []; // { link_id, aut_id, pub_id }

    let currentContext = null;

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('INSERT INTO `autoren`')) {
            currentContext = 'authors';
            continue;
        } else if (line.startsWith('INSERT INTO `publikationen`')) {
            currentContext = 'pubs';
            continue;
        } else if (line.startsWith('INSERT INTO `autorenlinks`')) {
            currentContext = 'links';
            continue;
        } else if (line.startsWith(';')) {
            currentContext = null;
        }

        if (!line.startsWith('(')) continue;

        if (currentContext === 'authors') {
            const match = line.match(/^\((\d+),\s*'([^']*)',\s*'([^']*)'/);
            if (match) {
                const [_, id, vorname, nachname] = match;
                authors[id] = { id, name: `${vorname} ${nachname}` };
            }
        } else if (currentContext === 'pubs') {
            // (pub_id, kat_id, aut_id, titel, text, preis, isbn, available)
            // Regex needs to handle floats for price and text fields
            // Simplifying assumption: price is the 6th field

            // Try to match basic fields. 
            // NOTE: SQL dumps allow commas inside strings, which simple split won't handle perfectly.
            // But here we rely on the specific format of this dump.

            // pub_id is int, kat_id int, aut_id int, titel string, text string...
            // Let's rely on the ID matching logic we had, but also grab price.

            // Be careful with parsing CSV-like structure with quotes.
            // Using a simple regex for ID and Title first for matching.

            const matchIdTitle = line.match(/^\((\d+),\s*\d+,\s*(\d+),\s*'([^']*)'/);
            if (matchIdTitle) {
                const [_, id, aut_id, title] = matchIdTitle;

                // Extract Price: look for number after text field
                // This is tricky with regex. Let's do a simpler scan for the number before ISBN or similar.
                // The structure is: ID, KAT, AUT, TITLE, TEXT, PRICE, ISBN, AVAIL
                // Price is a float.

                // Alternative: split by `, ` but strings contain commas.
                // Let's assume price is surrounded by `, ` and is a number.
                // It's the 3rd form last element usually?
                // No, let's keep it simple: Extract everything between the last text field and ISBN.

                // Let's try to match the end of the line: ..., price, 'isbn', available);
                const endMatch = line.match(/,\s*([\d.]+),\s*'[^']*',\s*\d+\)[,;]?$/);
                let price = 0;
                if (endMatch) {
                    price = parseFloat(endMatch[1]);
                }

                publications[id] = { id, aut_id, title, price };
            }
        } else if (currentContext === 'links') {
            const match = line.match(/^\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                const [_, link_id, aut_id, pub_id] = match;
                links.push({ aut_id, pub_id });
            }
        }
    }

    return { authors, publications, links };
}

async function getFiles(dir, ext) {
    try {
        const files = await fs.readdir(dir);
        return files.filter(f => f.endsWith(ext));
    } catch (e) {
        console.error(`Error reading ${dir}:`, e);
        return [];
    }
}

async function main() {
    await ensureDir(PUBLIC_IMG_AUTHORS);
    await ensureDir(PUBLIC_IMG_BOOKS);

    const { authors: sqlAuthors, publications: sqlPubs, links: sqlLinks } = await parseSQL();
    console.log(`Loaded SQL: ${Object.keys(sqlAuthors).length} authors, ${Object.keys(sqlPubs).length} pubs, ${sqlLinks.length} links.`);

    const authorIdToSlug = {};

    // --- Process Authors ---
    const authorFiles = await getFiles(AUTHORS_DIR, '.json');
    for (const file of authorFiles) {
        const slug = file.replace('.json', '');
        const filePath = path.join(AUTHORS_DIR, file);
        const setContent = JSON.parse(await fs.readFile(filePath, 'utf-8'));

        const fileSlugNorm = normalize(slug);
        let matchedId = null;

        for (const [id, data] of Object.entries(sqlAuthors)) {
            const sqlNameNorm = normalize(data.name);
            const sqlNameRevNorm = normalize(data.name.split(' ').reverse().join(' '));
            // Also try to match just lastName if unique? No, safe with full name.
            if (sqlNameNorm === fileSlugNorm || sqlNameRevNorm === fileSlugNorm) {
                matchedId = id;
                break;
            }
        }

        if (matchedId) {
            authorIdToSlug[matchedId] = slug;
            const srcImg = path.join(PICS_DIR, `aut_${matchedId}.jpg`);
            const destImgName = `${slug}.jpg`;
            const destImgPath = path.join(PUBLIC_IMG_AUTHORS, destImgName);

            try {
                await fs.access(srcImg);
                await fs.copyFile(srcImg, destImgPath);
                // console.log(`[Author] MATCH: ${slug} (ID ${matchedId})`);

                setContent.photo = `/images/authors/${destImgName}`;
                await fs.writeFile(filePath, JSON.stringify(setContent, null, 2));
            } catch (e) { }
        }
    }

    console.log(`Mapped ${Object.keys(authorIdToSlug).length} authors to slugs.`);

    // --- Process Books ---
    const bookFiles = await getFiles(BOOKS_DIR, '.md');
    for (const file of bookFiles) {
        const slug = file.replace('.md', '');
        const filePath = path.join(BOOKS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');

        // Extract title safely
        const titleMatch = content.match(/title:\s*(.+)/);
        let title = slug;
        if (titleMatch) {
            // handle yaml escaping/quoting
            let rawTitle = titleMatch[1].trim();
            if (rawTitle.startsWith('"') && rawTitle.endsWith('"')) {
                // Remove quotes and handle escaped quotes
                rawTitle = rawTitle.slice(1, -1).replace(/\\"/g, '"');
            }
            title = rawTitle;
        }

        const normTitle = normalize(title);
        let matchedId = null;

        for (const [id, data] of Object.entries(sqlPubs)) {
            const sqlTitleNorm = normalize(data.title);
            if (sqlTitleNorm === normTitle) {
                matchedId = id;
                break;
            }
            // Fuzzy match if strict fails
            if (sqlTitleNorm.includes(normTitle) || (normTitle.includes(sqlTitleNorm) && normTitle.length > 5)) {
                if (normTitle.length > 8 && sqlTitleNorm.length > 8) {
                    matchedId = id;
                    break;
                }
            }
        }

        if (matchedId) {
            console.log(`[Book] MATCH: ${slug} (ID ${matchedId})`);

            // 1. Data Logic
            const pubData = sqlPubs[matchedId];
            const price = pubData.price;

            const coAuthorIds = sqlLinks
                .filter(l => l.pub_id == matchedId && l.aut_id != pubData.aut_id) // Exclude primary author if linked again??
                // Actually `aut_id` in `publikationen` is the primary.
                // Links might contain it too or others.
                .map(l => l.aut_id);

            // Filter out primary author if it's in links (it shouldn't be usually but safety check)
            // But wait, we need to know the primary author slug from the markdown or update it?
            // The markdown already has an author slug.

            const coAuthorSlugs = coAuthorIds
                .map(id => authorIdToSlug[id])
                .filter(s => s); // keep only if we found a slug

            // 2. Image Logic
            const possibleFiles = [`pub_${matchedId}.jpg`, `pub_${matchedId}-600x600.jpg`, `pub_${matchedId}-150x150.jpg`];
            let foundSrc = null;

            for (const p of possibleFiles) {
                try {
                    await fs.access(path.join(PICS_DIR, p));
                    foundSrc = p;
                    break;
                } catch { }
            }

            if (!foundSrc) {
                const allPics = await fs.readdir(PICS_DIR);
                const match = allPics.find(p => p.startsWith(`pub_${matchedId}.`) || p.startsWith(`pub_${matchedId}-`));
                if (match) foundSrc = match;
            }

            let destImgName = null;
            if (foundSrc) {
                destImgName = `${slug}.jpg`;
                const destImgPath = path.join(PUBLIC_IMG_BOOKS, destImgName);
                await fs.copyFile(path.join(PICS_DIR, foundSrc), destImgPath);
            }

            // Back cover
            const backSrc = `pub_${matchedId}_back.jpg`;
            try {
                await fs.access(path.join(PICS_DIR, backSrc));
                await fs.copyFile(path.join(PICS_DIR, backSrc), path.join(PUBLIC_IMG_BOOKS, `${slug}_back.jpg`));
            } catch { }

            // 3. Update Frontmatter
            let newLines = [];
            const lines = content.split('\n');
            let inFrontmatter = false;
            let fmCount = 0;

            // Naive Frontmatter parser/updater
            // Better: Reconstruct it.

            // Check if fields exist
            let hasPrice = content.includes('price:');
            let hasCoAuthors = content.includes('coAuthors:');
            let hasCover = content.includes('cover:');

            // We use regex replace which is safer for partial updates than full reconstruct
            let newContent = content;

            if (price) {
                if (hasPrice) {
                    newContent = newContent.replace(/^price:.*$/m, `price: ${price}`);
                } else {
                    newContent = newContent.replace(/^---([\s\S]+?)---/, (match, fm) => {
                        return `---${fm}price: ${price}\n---`;
                    });
                }
            }

            if (coAuthorSlugs.length > 0) {
                const coAuthString = `coAuthors:\n${coAuthorSlugs.map(s => `  - ${s}`).join('\n')}`;
                if (hasCoAuthors) {
                    // Too complex to replace array cleanly with regex if multiline, 
                    // but assuming it didn't exist or was empty.
                    // If it exists, let's skip to avoid breaking manual edits? 
                    // Or overwrite? Let's overwrite safely.
                    // Actually, if it exists, it might be tough. Let's assume it doesn't exist mostly.
                } else {
                    newContent = newContent.replace(/^---([\s\S]+?)---/, (match, fm) => {
                        return `---${fm}${coAuthString}\n---`;
                    });
                }
            }

            if (destImgName) {
                const newCoverLine = `cover: "/images/books/${destImgName}"`;
                if (hasCover) {
                    newContent = newContent.replace(/^cover:.*$/m, newCoverLine);
                } else {
                    newContent = newContent.replace(/^---([\s\S]+?)---/, (match, fm) => {
                        return `---${fm}${newCoverLine}\n---`;
                    });
                }
            }

            await fs.writeFile(filePath, newContent);
        }
    }
}

main().catch(console.error);
