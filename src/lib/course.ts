import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'content/jornada-cripto');

export function getSortedCourseData() {
  // Get file names under /content/jornada-cripto
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    // Remove ".md" from file name to get slug
    const slug = fileName.replace(/\.md$/, '');

    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);

    // Combine the data with the slug
    return {
      slug,
      ...(matterResult.data as { title: string; order: number; videoId?: string }),
    };
  });

  // Sort posts by order
  return allPostsData.sort((a, b) => {
    if (a.order < b.order) {
      return -1;
    } else {
      return 1;
    }
  });
}

export function getAllCourseSlugs() {
  const fileNames = fs.readdirSync(postsDirectory);

  return fileNames.map((fileName) => {
    return {
      slug: fileName.replace(/\.md$/, ''),
    };
  });
}

export async function getCourseData(slug: string) {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  // Combine the data with the slug and contentHtml
  return {
    slug,
    contentHtml,
    ...(matterResult.data as { title: string; order: number; videoId?: string }),
  };
}

export function searchCourseContent(query: string): string {
  const fileNames = fs.readdirSync(postsDirectory);
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 3);
  
  if (searchTerms.length === 0) return '';

  let results: { content: string; score: number; title: string }[] = [];

  fileNames.forEach((fileName) => {
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    const title = (data as any).title || fileName;

    // Split content into paragraphs for better granularity
    const paragraphs = content.split(/\n\s*\n/);

    paragraphs.forEach(paragraph => {
      let score = 0;
      const lowerParagraph = paragraph.toLowerCase();
      
      searchTerms.forEach(term => {
        if (lowerParagraph.includes(term)) {
          score += 1;
        }
      });

      if (score > 0) {
        results.push({
          content: paragraph.trim(),
          score,
          title
        });
      }
    });
  });

  // Sort by score desc
  results.sort((a, b) => b.score - a.score);

  // Take top 3 chunks to save tokens
  const topResults = results.slice(0, 3);

  if (topResults.length === 0) {
    console.log(`[RAG] Nenhum resultado encontrado para: ${query}`);
    return '';
  }

  return topResults.map(r => `[Fonte: ${r.title}]\n${r.content}`).join('\n\n---\n\n');
}
