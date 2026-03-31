import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const booksDir = path.join(__dirname, 'src/content/books');

// Load translations from multiple potential property files or a single merged one
// We'll look for translations.json
let translations = [];
try {
    const data = fs.readFileSync('translations.json', 'utf-8');
    translations = JSON.parse(data);
} catch (e) {
    console.error("Could not read translations.json", e);
    process.exit(1);
}

// Convert to map for easy lookup
const translationMap = {};
translations.forEach(t => {
    translationMap[t.file] = t.translations;
});

const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.md'));

for (const file of files) {
    if (!translationMap[file]) {
        console.warn(`No translations found for ${file}`);
        continue;
    }

    const filePath = path.join(booksDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(content);

    // Existing description
    const originalDesc = parsed.data.description;
    const lang = parsed.data.language;

    // Construct new description object
    // If originalDesc is already an object, we merge. If string, we start with it.
    let newDescObj = {};
    if (typeof originalDesc === 'string') {
        newDescObj[lang] = originalDesc;
    } else if (typeof originalDesc === 'object') {
        newDescObj = { ...originalDesc };
    }

    // Merge new translations
    const incoming = translationMap[file];
    if (incoming) {
        if (incoming.de) newDescObj.de = incoming.de;
        if (incoming.en) newDescObj.en = incoming.en;
        if (incoming.fr) newDescObj.fr = incoming.fr;
    }

    // Update data
    parsed.data.description = newDescObj;

    // Stringify back to frontmatter
    // We want to force block scalars for descriptions if they are multi-line strings
    // gray-matter doesn't strictly support forcing block scalars easily for specific keys
    // but we can try just stringifying and see.
    // However, the user had explicit requirements about block scalars.
    // Gray-matter's stringify might default to quotes which broke things before.
    // We might need to manually adjust usage of Zod schema? No, that's reading.

    // Alternative: We manually construct the YAML for description?
    // Let's rely on gray-matter first. If it breaks, we'll fix it.
    // Actually, `js-yaml` (used by gray-matter) tries to be smart.

    const newContent = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Updated ${file}`);
}
