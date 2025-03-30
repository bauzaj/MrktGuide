import React, { useState } from "react";
import axios from "axios";

export default function App() {
  const [ticker, setTicker] = useState("");
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);

  const getStockInsight = async () => {
    if (!ticker) return;
    setLoading(true);
    setInsight("");

    const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    

    try {
      const quoteRes = await axios.get(
        `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
      );

      const newsRes = await axios.get(
        `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=2024-03-20&to=2024-03-28&token=${FINNHUB_API_KEY}`
      );

      const price = quoteRes.data.c;
      const change = quoteRes.data.d;
      const pctChange = quoteRes.data.dp;
      const recentHeadline = newsRes.data[0]?.headline || "No recent news available.";

      const gptPrompt = `Stock: ${ticker}
Current Price: $${price}
Change: ${change} (${pctChange}%)
News: ${recentHeadline}

Should I buy, hold, or sell this stock? Provide reasoning.`;

      const gptRes = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a responsible and insightful stock advisor.",
            },
            {
              role: "user",
              content: gptPrompt,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      setInsight(gptRes.data.choices[0].message.content);
    } catch (err) {
      console.error(err);
      setInsight("Error fetching data. Check the ticker and API keys.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Smart Market Guide</h1>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
        <input
          type="text"
          placeholder="Enter ticker (e.g. AAPL)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          className="border px-4 py-2 rounded-lg w-60"
        />
        <button
          onClick={getStockInsight}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? "Analyzing..." : "Get Insight"}
        </button>
      </div>
      {insight && (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6 whitespace-pre-wrap">
          {insight}
        </div>
      )}
    </div>
  );
}
