import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const booksDir = path.join(process.cwd(), 'src/content/books');
const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.md'));

async function fetchYearGoogle(isbn) {
    try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.items && data.items.length > 0) {
            const dateStr = data.items[0].volumeInfo.publishedDate;
            if (dateStr) {
                const yearMatch = dateStr.match(/\d{4}/);
                if (yearMatch) return parseInt(yearMatch[0]);
            }
        }
    } catch (e) {
        console.error('Google API error:', e.message);
    }
    return null;
}

async function fetchYearOpenLibrary(isbn) {
    try {
        const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
        if (!res.ok) return null;
        const data = await res.json();
        const bookData = data[`ISBN:${isbn}`];
        if (bookData && bookData.publish_date) {
             const yearMatch = bookData.publish_date.match(/\d{4}/);
             if (yearMatch) return parseInt(yearMatch[0]);
        }
    } catch (e) {
         console.error('OpenLibrary API error:', e.message);
    }
    return null;
}

async function processBooks() {
    let modified = 0;
    
    for (const file of files) {
        const filePath = path.join(booksDir, file);
        const originalContent = fs.readFileSync(filePath, 'utf-8');
        
        // Parse with gray-matter
        const parsed = matter(originalContent);
        
        let isbnStr = parsed.data.isbn || '';
        // clean ISBN, keep only digits/X
        let isbn = isbnStr.toString().replace(/[^0-9X]/gi, '');
        
        let yearMatched = null;
        
        if (isbn && isbn.length >= 10) {
             console.log(`Searching for ISBN: ${isbn} for file ${file}...`);
             yearMatched = await fetchYearGoogle(isbn);
             if (!yearMatched) {
                  yearMatched = await fetchYearOpenLibrary(isbn);
             }
             
             // Sleep 1 second to avoid rate limiting
             await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
             console.log(`No valid ISBN for ${file}, leaving null.`);
        }
        
        if (yearMatched) {
             console.log(`Found year: ${yearMatched} for ${file}`);
             parsed.data.publicationDate = new Date(`${yearMatched}-01-01T00:00:00.000Z`);
        } else {
             console.log(`NOT found year for ${file}, setting to null.`);
             parsed.data.publicationDate = null;
        }
        
        // Clean ISBN format as string just to be safe if it's there
        if (isbnStr) {
            parsed.data.isbn = isbnStr.toString();
        }
        
        // Stringify (this unifies the formatting!)
        const newContent = matter.stringify(parsed.content, parsed.data);
        fs.writeFileSync(filePath, newContent, 'utf-8');
        modified++;
    }
    
    console.log(`✅ ProcessFinished! Analyzed and formatted ${modified} files.`);
}

processBooks();
