import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const booksDir = path.join(__dirname, 'src/content/books');

async function collect() {
    const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.md'));
    const extraction = [];

    for (const file of files) {
        const filePath = path.join(booksDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = matter(content);

        // We expect description to be a string currently
        let originalDesc = parsed.data.description;
        let lang = parsed.data.language;

        // Handle existing object structure if run multiple times
        if (typeof originalDesc === 'object') {
            // assume it's already translated or partially, just pick the main lang one
            originalDesc = originalDesc[lang] || Object.values(originalDesc)[0];
        }

        if (originalDesc) {
            extraction.push({
                file,
                lang,
                description: originalDesc
            });
        }
    }

    fs.writeFileSync('descriptions.json', JSON.stringify(extraction, null, 2), 'utf-8');
    console.log('Wrote descriptions.json');
}

collect();
