import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'content/jornada-cripto');

// Função auxiliar para normalizar texto (remover acentos e converter para minúsculas)
function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

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
  const normalizedQuery = normalizeText(query);
  const searchTerms = normalizedQuery.split(' ').filter(term => term.length >= 3);
  
  console.log(`[RAG] Query original: "${query}"`);
  console.log(`[RAG] Termos de busca: [${searchTerms.join(', ')}]`);

  if (searchTerms.length === 0) return '';

  let results: { content: string; score: number; title: string }[] = [];

  fileNames.forEach((fileName) => {
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    const title = (data as any).title || fileName;

    // Split content into paragraphs for better granularity
    const paragraphs = content.split(/\n\s*\n/);

    paragraphs.forEach((paragraph) => {
      let score = 0;
      const normalizedParagraph = normalizeText(paragraph);
      const matches: string[] = [];
      
      searchTerms.forEach(term => {
        let matched = false;
        
        // 1. Correspondência direta
        if (normalizedParagraph.includes(term)) {
          matched = true;
        } 
        // 2. Tratamento de "ação" vs "ar" (valorização <-> valorizar)
        else if (term.endsWith('acao')) {
          const baseTerm = term.slice(0, -4); 
          if (normalizedParagraph.includes(baseTerm + 'ar')) {
            matched = true;
          }
        } else if (term.endsWith('ar')) {
          const baseTerm = term.slice(0, -2);
          if (normalizedParagraph.includes(baseTerm + 'acao')) {
            matched = true;
          }
        }
        // 3. Tratamento básico de plural (ignora 's' final na busca ou no texto)
        else if (term.endsWith('s')) {
             const singular = term.slice(0, -1);
             if (normalizedParagraph.includes(singular)) matched = true;
        } else {
             // Se o termo é singular, tenta achar plural no texto
             if (normalizedParagraph.includes(term + 's')) matched = true;
        }

        if (matched) {
          score += 1;
          matches.push(term);
        }
      });

      if (score > 0) {
        results.push({
          content: paragraph.trim(),
          score,
          title
        });
        // Log para debug de parágrafos com alta pontuação
        if (score >= 2) {
            // console.log(`[RAG Match] Score: ${score} | Termos: [${matches.join(', ')}] | Trecho: ${paragraph.substring(0, 50)}...`);
        }
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

  console.log(`[RAG] Top resultado (Score ${topResults[0].score}): ${topResults[0].content.substring(0, 100)}...`);

  return topResults.map(r => `[Fonte: ${r.title}]\n${r.content}`).join('\n\n---\n\n');
}
