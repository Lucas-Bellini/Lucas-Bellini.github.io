const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs');
const path = require('path');


const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { question } = req.body;

    // Carregue o arquivo .docx com suas informações
    const docPath = path.join(process.cwd(), 'data', 'Lucasbel.docx');
    const docContent = fs.readFileSync(docPath, 'utf-8');

    try {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Você irá responder perguntas de recrutadores sobre mim. Baseado no seguinte currículo:\n\n${docContent}\n\nResponda à seguinte pergunta:\n\n${question}. E se ela for feita em ingles, traduza o texto para o ingles.`,
        max_tokens: 500,
      });

      res.status(200).json({ answer: response.data.choices[0].text.trim() });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao processar a pergunta' });
    }
  } else {
    res.status(405).json({ message: "Método não permitido" });
  }
}
