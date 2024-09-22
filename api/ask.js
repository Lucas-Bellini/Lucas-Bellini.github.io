import mammoth from "mammoth";
import { Configuration, OpenAIApi } from "openai";
import fs from "fs";
import path from "path";

// Configuração da API da OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Função para ler o arquivo .docx e extrair o texto
async function readDocxFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const { value: text } = await mammoth.extractRawText({ buffer: fileBuffer });
  return text;
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { question } = req.body;

    try {
      // Caminho para o arquivo .docx (certifique-se de que o arquivo está na pasta correta)
      const filePath = path.join(process.cwd(), "Lucasbel.docx");

      // Lê o arquivo e extrai o texto
      const resumeText = await readDocxFile(filePath);

      // Cria o prompt incluindo o texto do currículo e a pergunta do usuário
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Você é um assistente útil que responde com base no currículo de Lucas Bellini." },
          { role: "system", content: `Aqui está o currículo:\n\n${resumeText}` },  // Adiciona o texto do currículo como contexto
          { role: "user", content: question }
        ],
      });

      // Retorna a resposta do chat
      res.status(200).json({ answer: response.data.choices[0].message.content.trim() });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao processar a pergunta' });
    }
  } else {
    res.status(405).json({ message: "Método não permitido" });
  }
}
