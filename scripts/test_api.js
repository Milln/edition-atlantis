import fs from 'fs';
import matter from 'gray-matter';

async function test() {
    const fileContent = fs.readFileSync('src/content/books/153-sakrale-kunstwerke-im-detail-ostallgau-und-kau.md', 'utf-8');
    const parsed = matter(fileContent);
    // modify slightly
    parsed.data.publicationDate = new Date('2018-01-01T00:00:00.000Z');
    
    // see how it stringifies
    const newContent = matter.stringify(parsed.content, parsed.data);
    console.log(newContent.substring(0, 500));
}

test();
