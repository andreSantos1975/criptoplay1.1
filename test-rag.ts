
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Mocking the environment logic from src/lib/course.ts to run standalone
const postsDirectory = path.join(process.cwd(), 'content/jornada-cripto');

interface SearchResult {
  content: string;
  score: number;
  path: string;
  title: string; // Added title property
}

function searchCourseContent(query: string) {
  console.log(`Searching for: "${query}" in ${postsDirectory}`);
  
  if (!fs.existsSync(postsDirectory)) {
    return '';
  }

  const fileNames = fs.readdirSync(postsDirectory).filter((fileName: string) => fileName.endsWith('.md'));

  const searchTerms = query.toLowerCase().split(' ');

  if (searchTerms.length === 0) return '';

  let results: SearchResult[] = [];

  fileNames.forEach((fileName: string) => {
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    const title = data.title || fileName;

    // Split content into paragraphs for better granularity
    const paragraphs = content.split(/\n\s*\n/);

    paragraphs.forEach((paragraph: string) => {
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
          title: data.title || fileName, // Assuming title is in data, fallback to fileName
          path: fileName, // Added missing path property
        });
      }
    });
  });

  // Sort by score desc
  results.sort((a, b) => b.score - a.score);

  // Take top 5 chunks
  const topResults = results.slice(0, 5);
  
  console.log(`Found ${results.length} matches. Top 5:`);
  topResults.forEach(r => console.log(`- [${r.score}] ${r.title}`));

  return topResults.map(r => `[Fonte: ${r.title}]\n${r.content}`).join('\n\n---\n\n');
}

// Test call
const query = "gerenciamento de risco";
const output = searchCourseContent(query);
console.log("\n---" + " OUTPUT " + "---" + "\n");
console.log(output);
