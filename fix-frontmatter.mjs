import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const booksDir = path.join(__dirname, 'src/content/books');

async function fixFiles() {
    const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
        const filePath = path.join(booksDir, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        let hasChanges = false;

        // Fix description
        const descriptionRegex = /^description:\s*"([\s\S]*?)"(?=\n[a-z]+:)/m;
        const descMatch = content.match(descriptionRegex);
        if (descMatch) {
            console.log(`Fixing description in ${file}...`);
            let descContent = descMatch[1];
            descContent = descContent
                .replace(/\\r\\n/g, '\n')
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"');

            const indentedDesc = descContent.split('\n').map(line => '  ' + line).join('\n');
            const newDescription = `description: |\n${indentedDesc}`;
            content = content.replace(descMatch[0], newDescription);
            hasChanges = true;
        }

        // Fix title
        // Matches title: "..." followed by another key or end of frontmatter
        const titleRegex = /^title:\s*"([\s\S]*?)"(?=\n[a-z]+:)/m;
        const titleMatch = content.match(titleRegex);
        if (titleMatch) {
            console.log(`Fixing title in ${file}...`);
            let titleContent = titleMatch[1];
            titleContent = titleContent
                .replace(/\\r\\n/g, '\n')
                .replace(/\\n/g, '\n')
                .replace(/^\\"/, '') // Remove start escaped quote if any
                .replace(/\\"$/, '') // Remove end escaped quote if any
                .replace(/\\"/g, '"') // Unescape others
                .replace(/\\\\"/g, '"'); // Handle double escapes

            const newTitle = `title: >-\n  ${titleContent}`;
            content = content.replace(titleMatch[0], newTitle);
            hasChanges = true;
        }

        if (hasChanges) {
            fs.writeFileSync(filePath, content, 'utf-8');
        }
    }
}

fixFiles();
