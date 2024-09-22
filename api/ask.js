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
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const { value: text } = await mammoth.extractRawText({ buffer: fileBuffer });
    console.log("Texto extraído do arquivo .docx:", text); // Log do texto extraído
    return text;
  } catch (error) {
    console.error("Erro ao ler o arquivo .docx:", error); // Log do erro
    throw new Error("Erro ao ler o arquivo .docx.");
  }
}

// Função para detectar o idioma (simplesmente verificando se tem mais palavras comuns em português ou inglês)
function detectLanguage(question) {
  const commonPortugueseWords = ["é", "de", "com", "que", "como", "por"];
  const commonEnglishWords = ["is", "the", "with", "what", "how", "for"];
  
  const portugueseCount = commonPortugueseWords.filter(word => question.includes(word)).length;
  const englishCount = commonEnglishWords.filter(word => question.includes(word)).length;
  
  console.log("Contagem de palavras em português:", portugueseCount); // Log para depuração
  console.log("Contagem de palavras em inglês:", englishCount); // Log para depuração
  
  return portugueseCount > englishCount ? "portuguese" : "english";
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { question } = req.body;

    try {
      console.log("Pergunta recebida:", question); // Log para depuração da pergunta

      // Caminho para o arquivo .docx
      const filePath = path.join(process.cwd(), "Lucasbel.docx");

      // Lê o arquivo e extrai o texto
      const resumeText = await readDocxFile(filePath);

      // Detecta o idioma da pergunta
      const language = detectLanguage(question);
      console.log("Idioma detectado:", language); // Log do idioma detectado

      // Cria o contexto adequado baseado no idioma detectado
      let systemMessage;
      if (language === "portuguese") {
        systemMessage = "Você é uma Intelegencia Artificial, que responde perguntas sobre meu histórico profissional em português. Você nunca responderá nada sobre si, apenas sobre o Lucas, baseado em meu historico profissional. Você é educado e deixa qualquer assunto interessante. Estou disponivel para vagas e serviços na área de dados e você sempre dará respostas para clientes e recrutadores, então seja cordial e nunca deixe um assunto acabar, sempre emende em um novo tema. Sempre que alguém te perguntar algo, ao término, de uma sugestão, como por exemplo 'Espero ter sanado sua dúvida. Gostaria de saber mais sobre as habilidades técnicas do Lucas?'";
      } else {
        systemMessage = "You are an Artificial Intelligence, who answers questions about my professional history in Portuguese. You will never answer anything about yourself, only about Lucas, based on my professional history. You are polite and make any topic interesting. I am available for vacancies and services in the data area and you will always provide answers to clients and recruiters, so be cordial and never let a topic end, always change it to a new topic. Whenever someone asks you something, at the end of a suggestion, such as 'I hope I have answered your question. Would you like to know more about Lucas' technical skills?'";
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

      console.log("Resposta da OpenAI recebida:", response.data.choices[0].message.content.trim()); // Log da resposta da OpenAI

      // Retorna a resposta do chat
      res.status(200).json({ answer: response.data.choices[0].message.content.trim() });
    } catch (error) {
      console.error("Erro ao processar a pergunta:", error); // Log para depuração do erro
      res.status(500).json({ error: 'Erro ao processar a pergunta' });
    }
  } else {
    res.status(405).json({ message: "Método não permitido" });
  }
}
