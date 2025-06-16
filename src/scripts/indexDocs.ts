#!/usr/bin/env node

/**
 * Docusaurus AI Search Indexing Script
 *
 * This script indexes Docusaurus documentation by:
 * 1. Finding all markdown/MDX files in the docs directory
 * 2. Splitting them into sections based on headings
 * 3. Storing the sections in Upstash Search for hybrid search
 */

import { Search } from '@upstash/search';
import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';

// Types and Interfaces
interface SearchMetadata {
  title: string;
  path: string;
  level: number;
  type: string;
  content: string;
  documentTitle: string;
  chunkIndex?: number;
  totalChunks?: number;
  [key: string]: string | number | undefined;
}

interface DocumentSection {
  level?: number;
  title?: string;
  content?: string;
}

interface ContentChunk {
  content: string;
  chunkIndex: number;
  totalChunks: number;
}

// Configuration Constants
const DEFAULT_INDEX_NAMESPACE = '@upstash/docusaurus-theme-ai-search';
const DEFAULT_DOCS_PATH = 'docs';
const indexNamespace = process.env.UPSTASH_SEARCH_INDEX_NAMESPACE ?? DEFAULT_INDEX_NAMESPACE;
const docsPath = process.env.DOCS_PATH ?? DEFAULT_DOCS_PATH;
console.log('Index namespace:', indexNamespace);
console.log('Docs path:', docsPath);

// Initialize Upstash Search client
const searchClient = new Search({
  url: process.env.UPSTASH_SEARCH_REST_URL!,
  token: process.env.UPSTASH_SEARCH_REST_TOKEN!,
});

const index = searchClient.index(indexNamespace)

/**
 * Utility Functions
 */

/**
 * Converts text to a URL-friendly slug
 * @param text The text to slugify
 * @returns A URL-friendly version of the text
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .trim()
    .replace(/\./g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * Extracts title from markdown frontmatter or generates one from filename
 * @param content The markdown content
 * @param fileName The name of the file
 * @returns The extracted or generated title
 */
function extractTitle(content: string, fileName: string): string {
  const titleMatch = content.match(
    /^---[\s\S]*?\ntitle:\s*["']?(.*?)["']?\n[\s\S]*?---/
  );
  if (titleMatch?.[1]) {
    return titleMatch[1].replace(/['"]/g, '').trim();
  }
  return path
    .basename(fileName, path.extname(fileName))
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extracts ID from markdown frontmatter
 * @param content The markdown content
 * @returns The extracted ID or null if not found
 */
function extractId(content: string): string | null {
  const idMatch = content.match(/^---[\s\S]*?\nid:\s*["']?(.*?)["']?\n[\s\S]*?---/);
  return idMatch?.[1] || null;
}

/**
 * File Processing Functions
 */

/**
 * Recursively finds all markdown/MDX files in a directory
 * @param dir Directory to search in
 * @returns Array of file paths
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files = await fs.readdir(dir, { withFileTypes: true });
  let markdownFiles: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory() && !file.name.startsWith('.')) {
      const subFiles = await findMarkdownFiles(fullPath);
      markdownFiles = [...markdownFiles, ...subFiles];
    } else if (file.name.match(/\.(md|mdx)$/)) {
      markdownFiles.push(fullPath);
    }
  }

  return markdownFiles;
}

/**
 * Processes a single markdown file and returns its content and metadata
 * @param filePath Path to the markdown file
 */
async function processMarkdownFile(filePath: string) {
  const content = await fs.readFile(filePath, 'utf-8');
  const dirPath = path.dirname(path.relative(process.cwd(), filePath))
    .replace(docsPath, 'docs');

  // Try to get ID from frontmatter, fallback to filename
  const id = extractId(content) || path.basename(filePath).replace(/\.(md|mdx)$/, '');
  const relativePath = path.join(dirPath, id);

  const fileName = path.basename(filePath);
  const title = extractTitle(content, fileName);

  return {
    content,
    title,
    _meta: {
      path: relativePath,
    },
  };
}

/**
 * Content Processing Functions
 */

/**
 * Splits MDX content into sections based on headings
 * @param mdx The MDX content to split
 * @returns Array of sections with their headings and content
 */
function splitMdxByHeadings(mdx: string): DocumentSection[] {
  const sections = mdx.split(/(?=^#{1,6}\s)/m);

  return sections
    .map((section) => {
      const lines = section.trim().split('\n');
      const headingMatch = lines[0]?.match(/^(#{1,6})\s+(.+)$/);

      if (!headingMatch) return null;

      const [, hashes, title] = headingMatch;
      const content = lines.slice(1).join('\n').trim();

      return {
        level: hashes?.length,
        title,
        content,
      };
    })
    .filter(Boolean) as DocumentSection[];
}

/**
 * Splits content into chunks with overlap to avoid character limits
 * @param content The content to split
 * @param maxChunkSize Maximum size of each chunk (default: 1200)
 * @param overlapSize Size of overlap between chunks (default: 200)
 * @returns Array of content chunks
 */
function splitContentIntoChunks(
  content: string,
  maxChunkSize: number = 1200,
  overlapSize: number = 200
): ContentChunk[] {
  if (content.length <= maxChunkSize) {
    return [{ content, chunkIndex: 0, totalChunks: 1 }];
  }

  // Ensure overlap is not too large to prevent infinite loops
  overlapSize = Math.min(overlapSize, Math.floor(maxChunkSize * 0.3));

  const chunks: ContentChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;
  const maxIterations = Math.ceil(content.length / (maxChunkSize - overlapSize)) + 1;

  while (startIndex < content.length && chunkIndex < maxIterations) {
    let endIndex = Math.min(startIndex + maxChunkSize, content.length);
    
    // If this isn't the last chunk, try to break at a natural boundary
    if (endIndex < content.length) {
      // Look for sentence boundaries first
      const sentenceBreak = content.lastIndexOf('.', endIndex);
      if (sentenceBreak > startIndex + maxChunkSize * 0.5) {
        endIndex = sentenceBreak + 1;
      } else {
        // Look for word boundaries
        const wordBreak = content.lastIndexOf(' ', endIndex);
        if (wordBreak > startIndex + maxChunkSize * 0.5) {
          endIndex = wordBreak;
        }
      }
    }

    const chunkContent = content.slice(startIndex, endIndex).trim();
    if (chunkContent) {
      chunks.push({
        content: chunkContent,
        chunkIndex,
        totalChunks: 0, // Will be updated after all chunks are created
      });
    }

    // Move start index forward, accounting for overlap
    // Ensure we always make progress to avoid infinite loops
    const nextStartIndex = Math.max(endIndex - overlapSize, startIndex + 1);
    if (nextStartIndex >= content.length) break;
    
    startIndex = nextStartIndex;
    chunkIndex++;
  }

  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.totalChunks = chunks.length;
  });

  return chunks;
}

/**
 * Main indexing function
 */
async function indexDocs() {
  try {
    console.log('Starting indexing process...');
    console.log('Using index namespace:', indexNamespace);

    // Find and process markdown files
    console.log('Finding markdown files...');
    const markdownFiles = await findMarkdownFiles(
      path.join(process.cwd(), docsPath)
    );
    console.log(`Found ${markdownFiles.length} markdown files`);

    console.log('Processing markdown files...');
    const allDocs = await Promise.all(markdownFiles.map(processMarkdownFile));
    console.log(`Processed ${allDocs.length} documents`);

    // Reset the index for fresh indexing
    await index.reset();
    console.log('Reset index for fresh indexing');

    // Process each document
    for (const doc of allDocs) {
      try {
        const sections = splitMdxByHeadings(doc.content);

        for (const section of sections) {
          if (!section || !section.content) continue;

          // Split content into chunks if it's too long
          const contentChunks = splitContentIntoChunks(section.content);

          for (const chunk of contentChunks) {
            const chunkSuffix = contentChunks.length > 1 ? `-chunk-${chunk.chunkIndex + 1}` : '';
            const headingId = `${doc._meta.path}#${slugify(section.title!)}${chunkSuffix}`;

            const metadata: SearchMetadata = {
              title: section.title ?? '<Error displaying title>',
              path: doc._meta.path,
              level: section.level ?? 2,
              type: contentChunks.length > 1 ? 'section-chunk' : 'section',
              content: chunk.content,
              documentTitle: doc.title,
              ...(contentChunks.length > 1 && {
                chunkIndex: chunk.chunkIndex,
                totalChunks: chunk.totalChunks,
              }),
            };

            await index.upsert(
              {
                id: headingId,
                content: { title: section.title, content: chunk.content },
                metadata,
              }
            );
          }
        }

        console.log(`✅ Indexed document sections: ${doc.title}`);
      } catch (error) {
        console.error(`❌ Failed to index ${doc.title}:`, error);
      }
    }

    console.log('✅ Finished indexing docs');
  } catch (error) {
    console.error('❌ Failed to index docs:', error);
    throw error;
  }
}

// Start the indexing process
indexDocs().catch(console.error);
