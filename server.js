import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // habilita CORS para o frontend

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error("GROQ_API_KEY não definida no .env");
  process.exit(1);
}

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt é obrigatório." });
  }

  if (prompt.length > 2000) {
    return res.status(413).json({ error: "Prompt muito longo." });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("Erro da Groq:", response.status, await response.text());
      return res.status(502).json({ error: "Erro na IA (Groq)." });
    }

    const data = await response.json();

    const answer =
      data.choices?.[0]?.message?.content ||
      "No momento não consegui gerar uma resposta. Tente reformular sua pergunta.";

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Erro na chamada:", error);
    return res.status(500).json({ error: "Erro ao conectar com a IA." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend do chatbot rodando com Groq na porta ${PORT}`);
});
