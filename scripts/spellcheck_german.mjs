/**
 * spellcheck_german.mjs
 *
 * Reads all book markdown files, extracts the German (de) description,
 * sends it to Gemini for proofreading (with focus on Umlauts and German spelling),
 * and automatically writes corrections back to the files.
 *
 * Usage:
 *   node --env-file=.env scripts/spellcheck_german.mjs                    # check all files
 *   node --env-file=.env scripts/spellcheck_german.mjs --file <slug.md>   # check a single file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const booksDir = path.join(__dirname, '..', 'src', 'content', 'books');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is not set. Run with --env-file=.env');
    process.exit(1);
}

const MODEL = "gemini-3.1-flash-lite-preview";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;


const args = process.argv.slice(2);
const fileArgIdx = args.indexOf('--file');
const SINGLE_FILE = fileArgIdx !== -1 ? args[fileArgIdx + 1] : null;

// Rate-limit: wait between API calls to stay within free-tier quota
const DELAY_MS = 4000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Call the Gemini API to proofread a German text.
 * Returns an object: { corrected: string, issues: string[], hadErrors: boolean }
 */
async function proofreadGerman(text, bookTitle) {
    const prompt = `You are a professional German proofreader. Your task is to check the following German text for spelling errors, with special attention to:
- Correct use of Umlauts (ä, ö, ü, Ä, Ö, Ü) which are sometimes incorrectly written as ae, oe, ue
- Correct use of ß (Eszett) vs ss
- Overall German spelling and grammar errors
- Incorrect line breaks within sentences (the text may have been word-wrapped)

The text below is a book description for "${bookTitle}".

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "corrected": "<the full corrected German text, preserving paragraph structure>",
  "issues": ["<description of issue 1>", "<description of issue 2>"],
  "changed": <true if any corrections were made, false otherwise>
}

If there are no issues, return the original text as "corrected" and an empty "issues" array.

German text to check:
---
${text}
---`;

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
        },
    };

    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (response.status === 429) {
            const waitTime = Math.pow(2, retries) * 5000 + Math.random() * 1000;
            console.log(`  ⏳ Rate limit hit (429). Retrying in ${Math.round(waitTime / 1000)}s...`);
            await sleep(waitTime);
            retries++;
            continue;
        }

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API error ${response.status}: ${err}`);
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            throw new Error('Gemini returned an empty response');
        }

        try {
            return JSON.parse(rawText);
        } catch (e) {
            // Sometimes the model wraps JSON in ```json ... ```, try to strip it
            const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (match) return JSON.parse(match[1]);
            throw new Error(`Could not parse Gemini response as JSON: ${rawText.substring(0, 200)}`);
        }
    }

    throw new Error(`Max retries reached for ${bookTitle}`);
}

async function processFile(file) {
    const filePath = path.join(booksDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(content);

    const title = parsed.data.title || file;
    const desc = parsed.data.description;

    // Support both the flat string format and the nested {de: {text, original}} format
    let germanText = null;
    let descStructure = 'unknown';

    if (typeof desc === 'string') {
        // Old flat format - we'll skip (no language info)
        console.log(`  [SKIP] ${file}: description is a plain string, no language info.`);
        return null;
    } else if (desc && typeof desc === 'object') {
        if (desc.de) {
            if (typeof desc.de === 'string') {
                germanText = desc.de;
                descStructure = 'flat_de';
            } else if (desc.de.text) {
                germanText = desc.de.text;
                descStructure = 'nested_de';
            }
        }
    }

    if (!germanText || germanText.trim().length === 0) {
        console.log(`  [SKIP] ${file}: no German description found.`);
        return null;
    }

    console.log(`\n📖 Checking: ${title} (${file})`);

    let result;
    try {
        result = await proofreadGerman(germanText, title);
    } catch (err) {
        console.error(`  ❌ API error: ${err.message}`);
        return { file, error: err.message };
    }

    if (!result.changed || result.issues.length === 0) {
        console.log(`  ✅ No issues found.`);
        return { file, changed: false };
    }

    console.log(`  ⚠️  Issues found (${result.issues.length}):`);
    result.issues.forEach((issue) => console.log(`     - ${issue}`));

    // Write the corrected text back
    if (descStructure === 'nested_de') {
        parsed.data.description.de.text = result.corrected;
    } else if (descStructure === 'flat_de') {
        parsed.data.description.de = result.corrected;
    }

    // Re-stringify using gray-matter
    // gray-matter uses js-yaml internally, which handles Unicode (Umlauts) correctly
    const newContent = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`  ✍️  Corrections written to ${file}`);

    // Show a simple diff preview of changed lines
    const origLines = germanText.split('\n');
    const fixedLines = result.corrected.split('\n');
    const maxLines = Math.min(origLines.length, fixedLines.length);
    for (let i = 0; i < maxLines; i++) {
        if (origLines[i] !== fixedLines[i]) {
            console.log(`     BEFORE: ${origLines[i]}`);
            console.log(`     AFTER:  ${fixedLines[i]}`);
        }
    }

    return { file, changed: true, issues: result.issues, corrected: result.corrected };
}

async function main() {
    console.log('🔍 German Spell Checker for Edition Atlantis Books');
    console.log(`   Mode: ✍️  AUTO-FIX (corrections are written automatically)`);
    console.log(`   Books dir: ${booksDir}\n`);

    let files;
    if (SINGLE_FILE) {
        files = [SINGLE_FILE];
    } else {
        files = fs.readdirSync(booksDir).filter((f) => f.endsWith('.md'));
    }

    console.log(`Found ${files.length} file(s) to process.\n`);

    const results = {
        ok: [],
        withIssues: [],
        skipped: [],
        errors: [],
    };

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await processFile(file);

        if (!result) {
            results.skipped.push(file);
        } else if (result.error) {
            results.errors.push(file);
        } else if (result.changed) {
            results.withIssues.push(file);
        } else {
            results.ok.push(file);
        }

        // Delay between API calls (except the last one)
        if (i < files.length - 1) {
            await sleep(DELAY_MS);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ No issues:     ${results.ok.length} file(s)`);
    console.log(`⚠️  With issues:   ${results.withIssues.length} file(s)`);
    console.log(`⏭️  Skipped:       ${results.skipped.length} file(s)`);
    console.log(`❌ Errors:        ${results.errors.length} file(s)`);

    if (results.withIssues.length > 0) {
        console.log('\nFiles with spelling issues:');
        results.withIssues.forEach((f) => console.log(`  - ${f}`));
    }

    if (results.errors.length > 0) {
        console.log('\nFiles with API errors:');
        results.errors.forEach((f) => console.log(`  - ${f}`));
    }


}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
