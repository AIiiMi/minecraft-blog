import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const RULES_PATH = path.join(__dirname, '../TRANSLATION_RULES.md');
const CONTENT_DIR = path.join(__dirname, '../src/content/blog');
const IGNORE_FILES = ['README.md'];

// 1. Parse Dictionary
function parseRules() {
    console.log(`Loading rules from: ${RULES_PATH}`);
    const content = fs.readFileSync(RULES_PATH, 'utf-8');
    const lines = content.split('\n');
    const dictionary = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        // Match table rows starting with | **English** | Japanese |
        if (trimmed.startsWith('|') && !trimmed.includes('---')) {
            const parts = trimmed.split('|').map(s => s.trim()).filter(s => s !== '');
            if (parts.length >= 2) {
                let eng = parts[0].replace(/\*\*/g, ''); // Remove markdown bold
                let jpn = parts[1];

                // Skip headers (English / Japanese)
                if (eng.toLowerCase() === 'english' || jpn === 'Japanese') return;

                if (eng && jpn) {
                    dictionary.push({ eng, jpn });
                }
            }
        }
    });

    // Sort by length of English term (descending) to prevent partial replacement
    dictionary.sort((a, b) => b.eng.length - a.eng.length);

    console.log(`Loaded ${dictionary.length} translation terms.`);
    return dictionary;
}

// 2. Process Files
function processFiles(dictionary) {
    if (!fs.existsSync(CONTENT_DIR)) {
        console.error(`Content directory not found: ${CONTENT_DIR}`);
        return;
    }

    const files = fs.readdirSync(CONTENT_DIR).filter(file =>
        (file.endsWith('.md') || file.endsWith('.mdx')) && !IGNORE_FILES.includes(file)
    );

    console.log(`Found ${files.length} content files.`);

    files.forEach(file => {
        const filePath = path.join(CONTENT_DIR, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        const originalContent = content;
        let replaceCount = 0;

        dictionary.forEach(term => {
            // Case-insensitive regex with word boundaries
            // Escape special regex characters in the English term
            const escapedEng = term.eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedEng}\\b`, 'gi');

            if (regex.test(content)) {
                content = content.replace(regex, (match) => {
                    replaceCount++;
                    return term.jpn;
                });
            }
        });

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log(`[UPDATED] ${file} - Replaced ${replaceCount} terms.`);
        } else {
            console.log(`[NO CHANGE] ${file}`);
        }
    });
}

// Main Execution
try {
    const dictionary = parseRules();
    if (dictionary.length > 0) {
        processFiles(dictionary);
        console.log('Done.');
    } else {
        console.warn('No rules found. Check TRANSLATION_RULES.md format.');
    }
} catch (e) {
    console.error('Error executing script:', e);
}
