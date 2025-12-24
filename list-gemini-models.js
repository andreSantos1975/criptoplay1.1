const https = require('https');

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.error("Erro: A variável de ambiente GOOGLE_GENERATIVE_AI_API_KEY não está definida.");
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Consultando API do Google para listar modelos disponíveis...");

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      
      if (json.error) {
        console.error("Erro retornado pela API:", JSON.stringify(json.error, null, 2));
      } else if (json.models) {
        console.log("\n✅ Modelos Disponíveis para generateContent:");
        const contentModels = json.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        
        if (contentModels.length === 0) {
            console.log("Nenhum modelo suporta 'generateContent'.");
        }
        
        contentModels.forEach(m => {
          // Extrai apenas o ID do modelo (ex: models/gemini-pro -> gemini-pro)
          const id = m.name.replace('models/', '');
          console.log(`- ${id} (Versão: ${m.version})`);
        });
        
        console.log("\nRecomendação: Escolha um dos IDs acima para colocar no seu código.");
      } else {
        console.log("Resposta inesperada:", json);
      }
    } catch (e) {
      console.error("Erro ao processar resposta JSON:", e.message);
      console.log("Resposta bruta:", data);
    }
  });

}).on('error', (e) => {
  console.error("Erro na requisição:", e.message);
});
