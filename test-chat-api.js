async function testChat() {
  console.log("Testando API /api/chat...");
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'No modulo Exchanges de Criptomoedas qual é a valorizaçao que a criptomoeda pode te em um dia?' }
        ]
      }),
    });

    if (!response.ok) {
      console.error(`Erro na API: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Corpo da resposta de erro:', text);
      return;
    }

    console.log("API respondeu com sucesso. Lendo resposta...");
    const text = await response.text();
    console.log("Resposta parcial:", text.substring(0, 500));

  } catch (error) {
    console.error("Falha ao conectar na API:", error.message);
  }
}

testChat();