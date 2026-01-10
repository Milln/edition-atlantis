
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDir = 'src/content/books';
const publicDir = 'public';

const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));

console.log(`Scanning ${files.length} book files...`);

files.forEach(file => {
    const filePath = path.join(contentDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(content);

    let changed = false;
    const coverPath = parsed.data.cover;

    if (coverPath) {
        // Check if cover exists
        const fullCoverPath = path.join(publicDir, coverPath);
        if (!fs.existsSync(fullCoverPath)) {
            console.error(`[MISSING] Cover for ${file} not found at ${fullCoverPath}`);
        }

        // Check for back cover
        const dir = path.dirname(coverPath);
        const ext = path.extname(coverPath);
        const name = path.basename(coverPath, ext);
        const backCoverName = `${name}_back${ext}`;
        const backCoverPath = path.join(dir, backCoverName);
        const fullBackPath = path.join(publicDir, backCoverPath);

        if (fs.existsSync(fullBackPath)) {
            if (!parsed.data.back) {
                console.log(`[ADDING] Back cover for ${file}`);
                parsed.data.back = backCoverPath.replace(/\\/g, '/');
                changed = true;
            }
        }
    }

    if (changed) {
        const newContent = matter.stringify(parsed.content, parsed.data);
        fs.writeFileSync(filePath, newContent);
    }
});

console.log('Done.');
