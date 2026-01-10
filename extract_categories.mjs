
import fs from 'fs';
import path from 'path';

// Decode HTML entities basic
function decodeHtml(html) {
    if (!html) return html;
    // Strip leading/trailing quotes if they survived
    let s = html.trim();
    if (s.startsWith("'") && s.endsWith("'")) s = s.substring(1, s.length - 1);
    return s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/''/g, "'");
}

const sqlPath = 'wordpress_2.sql';
const booksDir = path.join('src', 'content', 'books');

const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

// 1. Parse Categories
const categoryMap = {}; // id -> name
const catRegex = /INSERT INTO `kategorien` \(`name`, `kat_id`\) VALUES\s*([\s\S]*?);/;
const catMatch = sqlContent.match(catRegex);

if (catMatch) {
    const block = catMatch[1];
    const regex = /\('([^']+)',\s*(\d+)\)/g;
    let match;
    while ((match = regex.exec(block)) !== null) {
        categoryMap[match[2]] = decodeHtml(match[1]).trim();
    }
}

console.log("Categories found:", categoryMap);

// 2. Parse Publications
const bookByIsbn = {}; // isbn -> { categoryName, originalTitle }
const bookByTitle = {}; // normalizedTitle -> { categoryName, originalTitle }

function normalizeTitle(t) {
    if (!t) return "";
    return t.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[’‘]/g, "'")
        .replace(/[^a-z0-9]/g, "") // remove all non-alphanumeric
        .trim();
}

const pubBlockRegex = /INSERT INTO `publikationen` .*? VALUES\s*([\s\S]*?);/g;
let blockCount = 0;
let tupleCount = 0;

let blockMatch;
while ((blockMatch = pubBlockRegex.exec(sqlContent)) !== null) {
    blockCount++;
    const block = blockMatch[1];

    let startIdx = -1;
    let inString = false;
    let parenLevel = 0;

    for (let i = 0; i < block.length; i++) {
        const char = block[i];
        if (char === "'") {
            if (inString && block[i + 1] === "'") {
                i++; // skip escaped quote
            } else {
                inString = !inString;
            }
        } else if (!inString) {
            if (char === '(') {
                if (parenLevel === 0) startIdx = i;
                parenLevel++;
            } else if (char === ')') {
                parenLevel--;
                if (parenLevel === 0 && startIdx !== -1) {
                    const tuple = block.substring(startIdx + 1, i);
                    tupleCount++;
                    parseTuple(tuple);
                    startIdx = -1;
                }
            }
        }
    }
}

console.log(`Parsed ${blockCount} blocks and ${tupleCount} tuples.`);

function parseTuple(trimmed) {
    const fields = [];
    let currentField = '';
    let inString = false;
    for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        if (char === "'") {
            if (inString && trimmed[i + 1] === "'") {
                currentField += "'";
                i++; // skip next quote
            } else {
                inString = !inString;
            }
        } else if (char === ',' && !inString) {
            fields.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }
    fields.push(currentField.trim());

    if (fields.length >= 7) {
        const katId = fields[1];
        let title = decodeHtml(fields[3]);
        let isbn = decodeHtml(fields[6]);

        const categoryName = categoryMap[katId];
        if (categoryName) {
            const data = { categoryName, originalTitle: title, isbn };
            const cleanIsbn = isbn.replace(/[^0-9]/g, '');
            if (cleanIsbn && isbn !== "0") {
                bookByIsbn[cleanIsbn] = data;
            }
            bookByTitle[normalizeTitle(title)] = data;
            bookByTitle[title.toLowerCase().trim()] = data;
        }
    }
}

// 3. Update Books
const files = fs.readdirSync(booksDir);
let updatedCount = 0;
let missedFiles = [];

files.forEach(file => {
    if (!file.endsWith('.md')) return;
    const filePath = path.join(booksDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Extract title (handle multiline and quotes)
    let mdTitle = "";
    const titleRegex = /^title:\s*(?:>-\r?\n\s+([\s\S]*?)\r?\n(?=[a-zA-Z]+:)|"(.*?)"|'(.*?)'|(.*))$/m;
    const titleMatch = content.match(titleRegex);

    if (titleMatch) {
        if (titleMatch[1]) {
            mdTitle = titleMatch[1].split(/\r?\n\s+/).join(' ').trim();
        } else {
            mdTitle = (titleMatch[2] || titleMatch[3] || titleMatch[4] || "").trim();
        }
    }

    // Extract ISBN
    const isbnMatch = content.match(/^isbn:\s*["']?([^"'\n]*)["']?$/m);
    const mdIsbnOrg = isbnMatch ? isbnMatch[1].trim() : null;
    const mdIsbn = mdIsbnOrg ? mdIsbnOrg.replace(/[^0-9]/g, '') : null;

    let match = null;
    if (mdIsbn && bookByIsbn[mdIsbn]) {
        match = bookByIsbn[mdIsbn];
    } else {
        const normMdTitle = normalizeTitle(mdTitle);
        match = bookByTitle[normMdTitle] || bookByTitle[mdTitle.toLowerCase().trim()];
    }

    if (match) {
        const category = match.categoryName;
        const catLine = `category: '${category}'`;
        if (content.match(/^category:/m)) {
            content = content.replace(/^category:.*$/m, catLine);
        } else {
            if (content.match(/^title:/m)) {
                // Insert after the title line/block
                // If it's a multiline title, we need to find the end of the block.
                const titleIdx = content.indexOf('title:');
                const nextKeyMatch = content.substring(titleIdx).match(/\r?\n\w+:/);
                if (nextKeyMatch) {
                    const insertIdx = titleIdx + nextKeyMatch.index + 1;
                    content = content.substring(0, insertIdx) + catLine + "\n" + content.substring(insertIdx);
                } else {
                    // fall back
                    content = content.replace(/^title:.*$/m, `$&
${catLine}`);
                }
            } else {
                content = content.replace(/^---/, `---\n${catLine}`);
            }
        }
        fs.writeFileSync(filePath, content);
        updatedCount++;
    } else {
        missedFiles.push({ file, title: mdTitle, isbn: mdIsbnOrg });
    }
});

console.log(`Finished. Updated: ${updatedCount}, Missing: ${missedFiles.length}`);
if (missedFiles.length > 0) {
    console.log("\nMissed Files:");
    missedFiles.forEach(m => console.log(`- ${m.file} (Title: ${m.title}, ISBN: ${m.isbn})`));
}
