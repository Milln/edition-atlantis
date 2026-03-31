import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.1-flash-lite-preview";

async function reformatAndTranslate(text, sourceLang) {
    if (!text || text.trim().length === 0) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    const payload = {
        contents: [{
            parts: [{
                text: `You are a professional editor and translator. Reformat and translate the following text about a book publication into three languages: German (de), English (en), and French (fr).

Rules for all versions:
- REMOVE ALL markdown formatting symbols (symbols like **, ###, _, *, \`, etc.).
- Convert the text to clean, professionally structured paragraphs.
- Use bold for emphasis or headings.
- Use appropriate line breaks/newlines between paragraphs.
- Fix all spelling errors and punctuation issues.
- REPLACE all French quotes (« and ») with standard English double quotes (").
- Fix any inconsistent spacing or broken words.
- DO NOT rewrite the content, just the formatting/translation.
- DO NOT use any markdown characters.

Translation Rules:
- Identify the source language.
- Translate accurately into the other two languages from the set {de, en, fr}.
- Do not add any additional information or comments.
- Mark the original language with "original": true in the json object.

Return ONLY a valid JSON object with the keys "de", "en", and "fr" containing the reformatted/translated text in "text" field, and for each a key "original" with the value true if the text is the original one.

Source Language provided: ${sourceLang || 'detect'}
Text to process:
${text}`
            }]
        }],
        generationConfig: {
            response_mime_type: "application/json"
        }
    };

    let retries = 0;
    const maxRetries = 5;
    const baseDelay = 10000; // 10 seconds for 429 retry

    while (retries < maxRetries) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.status === 429) {
                retries++;
                const waitTime = baseDelay * Math.pow(2, retries - 1);
                console.log(`  Rate limited (429). Retrying in ${waitTime / 1000}s... (Attempt ${retries}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                let resultText = data.candidates[0].content.parts[0].text.trim();
                try {
                    return JSON.parse(resultText);
                } catch (e) {
                    // Try to extract JSON if model wrapped it in markdown blocks
                    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try {
                            return JSON.parse(jsonMatch[0]);
                        } catch (e2) { }
                    }
                    console.error('JSON Parse Error:', resultText);
                    return null;
                }
            } else {
                console.error('API Error:', JSON.stringify(data, null, 2));
                return null;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    }
    return null;
}

async function processFile(filePath) {
    console.log(`Processing: ${path.basename(filePath)}`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(fileContent);

    // Skip if already processed (has de/en/fr object and empty body)
    if (parsed.data.description &&
        typeof parsed.data.description === 'object' &&
        parsed.data.description.de &&
        parsed.data.description.en &&
        parsed.data.description.fr &&
        parsed.content.trim() === '') {
        console.log(`  Skipping (already processed)`);
        return;
    }

    // Combine description and body for reformatting
    const currentDescription = typeof parsed.data.description === 'string' ? parsed.data.description : '';
    const combinedText = [
        currentDescription,
        parsed.content
    ].filter(Boolean).join('\n\n');

    if (!combinedText.trim()) {
        console.log(`  Skipping (empty body and description)`);
        return;
    }

    const translations = await reformatAndTranslate(combinedText, parsed.data.language);

    if (!translations) {
        console.log(`  Failed to process ${path.basename(filePath)}. Skipping file update.`);
        return;
    }

    // Update frontmatter with the translated object and clear body
    parsed.data.description = translations;

    // Explicitly stringify with empty content to clear the body
    const newContent = matter.stringify("", parsed.data);
    fs.writeFileSync(filePath, newContent);
    console.log(`  Done`);
}

async function main() {
    if (!API_KEY) {
        console.error('GEMINI_API_KEY not found in environment.');
        process.exit(1);
    }

    const booksDir = 'src/content/books';
    const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.md'));

    const testFile = process.argv[2];
    if (testFile) {
        const fullPath = path.join(booksDir, testFile);
        if (fs.existsSync(fullPath)) {
            await processFile(fullPath);
        } else {
            console.error(`File not found: ${testFile}`);
        }
    } else {
        console.log(`Processing all ${files.length} files...`);
        for (const file of files) {
            await processFile(path.join(booksDir, file));
            // Increased delay to avoid initial rate limiting (15 RPM is common)
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
    }
}

main();
