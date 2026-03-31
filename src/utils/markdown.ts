/**
 * A robust, lightweight Markdown-to-HTML parser.
 * Supports paragraphs, bold, italic, lists, and headings.
 */
export function parseMarkdown(md: string): string {
    if (!md) return '';

    // Normalize line endings
    let html = md.replace(/\r\n/g, '\n');

    // Basic inline formatting
    html = html
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>');
        
    const lines = html.split('\n');
    const result: string[] = [];
    let currentParagraph: string[] = [];
    let inList = false;

    const flushParagraph = () => {
        if (currentParagraph.length > 0) {
            // Join lines in paragraph with spaces, trimming each line
            const pText = currentParagraph.join(' ').trim();
            if (pText) {
                result.push(`<p class="mb-4">${pText}</p>`);
            }
            currentParagraph = [];
        }
    };

    const flushList = () => {
        if (inList) {
            result.push('</ul>');
            inList = false;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // 1. Heading check
        const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
        if (headingMatch) {
            flushParagraph();
            flushList();
            const level = headingMatch[1].length;
            result.push(`<h${level} class="font-serif font-bold text-primary mt-8 mb-4">${headingMatch[2]}</h${level}>`);
            continue;
        }

        // 2. List check (unordered)
        const listMatch = line.match(/^(\s*[\-*+])\s+(.*)$/);
        if (listMatch) {
            flushParagraph();
            if (!inList) {
                result.push('<ul class="list-disc ml-6 my-6 space-y-2">');
                inList = true;
            }
            result.push(`<li>${listMatch[2]}</li>`);
            continue;
        }

        // 3. Blank line check
        if (trimmedLine === '') {
            flushParagraph();
            flushList();
            continue;
        }

        // 4. Content line
        // If we were in a list and this is not a list item, close the list
        if (inList) {
            // Check if this line is a continuation of the previous list item (indented)
            if (line.startsWith('    ') || line.startsWith('\t')) {
                // Continuation - append to last result entry
                const lastIdx = result.length - 1;
                result[lastIdx] = result[lastIdx].replace(/<\/li>$/, ` ${trimmedLine}</li>`);
                continue;
            } else {
                flushList();
            }
        }

        currentParagraph.push(trimmedLine);
    }

    flushParagraph();
    flushList();

    return result.join('\n');
}
