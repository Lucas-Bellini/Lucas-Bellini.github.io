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

// Função para detectar o idioma (simplesmente verificando se tem mais palavras comuns em português ou inglês)
function detectLanguage(question) {
  const commonPortugueseWords = ["é", "de", "com", "que", "como", "por"];
  const commonEnglishWords = ["is", "the", "with", "what", "how", "for"];
  
  const portugueseCount = commonPortugueseWords.filter(word => question.includes(word)).length;
  const englishCount = commonEnglishWords.filter(word => question.includes(word)).length;
  
  return portugueseCount > englishCount ? "portuguese" : "english";
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { question } = req.body;

    try {
      // Caminho para o arquivo .docx
      const filePath = path.join(process.cwd(), "Lucasbel.docx");

      // Lê o arquivo e extrai o texto
      const resumeText = await readDocxFile(filePath);

      // Detecta o idioma da pergunta
      const language = detectLanguage(question);

      // Cria o contexto adequado baseado no idioma detectado
      let systemMessage;
      if (language === "portuguese") {
        systemMessage = "Você é um assistente que responde com base no currículo de Lucas Bellini em português.";
      } else {
        systemMessage = "You are an assistant that responds based on Lucas Bellini's resume in English.";
      }

      // Cria o prompt incluindo o texto do currículo e a pergunta do usuário
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemMessage },
          { role: "system", content: `Here is the resume:\n\n${resumeText}` },  // Adiciona o texto do currículo como contexto
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
