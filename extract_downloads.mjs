
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Paths
const SQL_FILE = 'wordpress_2.sql';
const BOOKS_DIR = 'src/content/books';
const DOWNLOADS_DIR = 'public/downloads';
const BASE_URL = 'http://editionatlantis.de/wordpress/wp-content/uploads/publinks/';

// Helper to decode HTML entities and SQL escapes
function cleanText(text) {
    if (!text) return "";
    let s = text.trim();
    if (s.startsWith("'") && s.endsWith("'")) s = s.substring(1, s.length - 1);
    
    // Handle SQL escapes first
    s = s.replace(/\\'/g, "'").replace(/''/g, "'").replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\\\/g, "\\");

    // Handle HTML entities
    return s.replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&Agrave;/g, 'À')
            .replace(/&Eacute;/g, 'É')
            .replace(/&rsquo;/g, "'");
}

function normalizeTitle(t) {
    if (!t) return "";
    return t.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[’‘]/g, "'")
        .replace(/[^a-z0-9]/g, "") // remove all non-alphanumeric
        .trim();
}

// Download file function
async function downloadFile(url, dest) {
    if (fs.existsSync(dest)) {
        return true;
    }
    
    console.log(`Downloading: ${url} -> ${dest}`);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, buffer);
        return true;
    } catch (error) {
        console.error(`Failed to download ${url}:`, error.message);
        return false;
    }
}

// Improved SQL parser that handles the whole file to avoid getting lost in semicolons
function parseSQL(sqlPath) {
    console.log(`Parsing SQL: ${sqlPath}`);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    const publications = {};
    const publinks = {};

    let i = 0;
    while (i < sqlContent.length) {
        // Look for INSERT INTO
        if (sqlContent.substring(i, i + 12) === "INSERT INTO ") {
            i += 12;
            let tableNameMatch = sqlContent.substring(i).match(/^`?(\w+)`?\s+/);
            if (tableNameMatch) {
                const tableName = tableNameMatch[1];
                i += tableNameMatch[0].length;
                
                // Find VALUES
                let valuesIdx = sqlContent.substring(i).indexOf(" VALUES");
                if (valuesIdx !== -1) {
                    i += valuesIdx + 7;
                    // Find start of tuples
                    while (i < sqlContent.length && sqlContent[i] !== '(') i++;
                    
                    // Parse tuples until semicolon
                    const blockStart = i;
                    let inString = false;
                    let parenLevel = 0;
                    let blockEnd = -1;

                    for (let j = i; j < sqlContent.length; j++) {
                        const char = sqlContent[j];
                        if (char === "\\") { j++; continue; }
                        if (char === "'") {
                            if (inString && sqlContent[j+1] === "'") { j++; }
                            else { inString = !inString; }
                        } else if (!inString) {
                            if (char === '(') parenLevel++;
                            else if (char === ')') parenLevel--;
                            else if (char === ';' && parenLevel === 0) {
                                blockEnd = j;
                                break;
                            }
                        }
                    }

                    if (blockEnd !== -1) {
                        const block = sqlContent.substring(blockStart, blockEnd);
                        if (tableName === 'publikationen') {
                            parseTuples(block, 8, (fields) => {
                                const pub_id = fields[0];
                                publications[pub_id] = { 
                                    pub_id, 
                                    title: cleanText(fields[3]), 
                                    isbn: cleanText(fields[6]) 
                                };
                            });
                        } else if (tableName === 'publinks') {
                            parseTuples(block, 4, (fields) => {
                                const pub_id = fields[1];
                                if (!publinks[pub_id]) publinks[pub_id] = [];
                                publinks[pub_id].push({ 
                                    text: cleanText(fields[2]), 
                                    link: cleanText(fields[3]) 
                                });
                            });
                        }
                        i = blockEnd + 1;
                    }
                }
            }
        } else {
            i++;
        }
    }

    return { publications, publinks };
}

function parseTuples(block, expectedFields, onRow) {
    let startIdx = -1;
    let inString = false;
    let parenLevel = 0;

    for (let i = 0; i < block.length; i++) {
        const char = block[i];
        if (char === "\\") { i++; continue; }
        if (char === "'") {
            if (inString && block[i + 1] === "'") { i++; }
            else { inString = !inString; }
        } else if (!inString) {
            if (char === '(') {
                if (parenLevel === 0) startIdx = i;
                parenLevel++;
            } else if (char === ')') {
                parenLevel--;
                if (parenLevel === 0 && startIdx !== -1) {
                    const tuple = block.substring(startIdx + 1, i);
                    const fields = [];
                    let currentField = '';
                    let inFieldString = false;
                    
                    for (let j = 0; j < tuple.length; j++) {
                        const tChar = tuple[j];
                        if (tChar === "\\") {
                            if (inFieldString) { currentField += tuple[j + 1] || ''; j++; }
                            else { currentField += tChar; }
                        } else if (tChar === "'") {
                            if (inFieldString && tuple[j + 1] === "'") { currentField += "'"; j++; }
                            else { inFieldString = !inFieldString; }
                        } else if (tChar === ',' && !inFieldString) {
                            fields.push(currentField.trim());
                            currentField = '';
                        } else {
                            currentField += tChar;
                        }
                    }
                    fields.push(currentField.trim());
                    if (fields.length >= expectedFields) onRow(fields);
                    startIdx = -1;
                }
            }
        }
    }
}

async function run() {
    if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

    const { publications, publinks } = parseSQL(SQL_FILE);
    console.log(`Successfully parsed ${Object.keys(publications).length} publications and found links for ${Object.keys(publinks).length} books.`);

    // Match pub_id to markdown files
    const matches = {}; // pub_id -> filepath
    const files = fs.readdirSync(BOOKS_DIR).filter(f => f.endsWith('.md'));

    for (const file of files) {
        const filePath = path.join(BOOKS_DIR, file);
        const { data } = matter(fs.readFileSync(filePath, 'utf8'));
        const isbn = (data.isbn || "").replace(/[^0-9]/g, '');
        const title = normalizeTitle(data.title);

        for (const [pubId, pub] of Object.entries(publications)) {
            const pubIsbn = pub.isbn.replace(/[^0-9]/g, '');
            const pubTitle = normalizeTitle(pub.title);

            if (isbn && pubIsbn && isbn === pubIsbn) {
                matches[pubId] = file;
                break;
            } else if (title && pubTitle && title === pubTitle) {
                matches[pubId] = file;
            }
        }
    }

    let updatedCount = 0;
    for (const [pubId, links] of Object.entries(publinks)) {
        const file = matches[pubId];
        if (!file) {
            console.log(`No match found for publication ID ${pubId} (${publications[pubId]?.title || 'Unknown'})`);
            continue;
        }

        const filePath = path.join(BOOKS_DIR, file);
        const parsed = matter(fs.readFileSync(filePath, 'utf8'));
        const downloads = [];

        for (const linkObj of links) {
            const rawLink = linkObj.link;
            const label = linkObj.text;

            if (!rawLink || rawLink === 'https://editionatlantis.de/wordpress/wp-content/uploads/publinks/') continue;

            let downloadUrl = '';
            if (rawLink.startsWith('http')) {
                downloadUrl = rawLink;
            } else {
                const cleanPath = rawLink.replace(/^\/?wordpress\//i, '').replace(/^wp-content\/uploads\/publinks\//i, '');
                downloadUrl = BASE_URL + encodeURIComponent(cleanPath).replace(/%2F/g, '/');
            }

            if (downloadUrl.match(/\.(pdf|jpg|jpeg|png)$/i)) {
                let filename = path.basename(decodeURIComponent(downloadUrl));
                filename = filename.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\.\-_]/g, '');
                
                const destPath = path.join(DOWNLOADS_DIR, filename);
                const success = await downloadFile(downloadUrl, destPath);
                
                if (success) {
                    downloads.push({ label: label || filename, file: `/downloads/${filename}` });
                }
            }
        }

        if (downloads.length > 0) {
            parsed.data.downloads = downloads;
            fs.writeFileSync(filePath, matter.stringify(parsed.content, parsed.data));
            updatedCount++;
        }
    }

    console.log(`\nFinished! Updated ${updatedCount} books with downloads.`);
}

run().catch(console.error);
