import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { question } = req.body;

    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",  // Usando o modelo GPT-3.5
        messages: [
          { role: "system", content: "Você é um assistente útil que responde com base no currículo de Lucas Bellini." },
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
