"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown"

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setAnswer("");
    setLoading(true);

    const res = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "query": question }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
      setAnswer(text);
    }

    setLoading(false);
  }

  return (
    <main className="pt-20 px-10 max-w-150">
      <form onSubmit={handleSubmit}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about The Swanns's Way..."
          className="w-full border-b border-b-black mb-4"
        />
        <button className="border border-gray-300 px-3 pt-1.5 pb-1 rounded-lg grid place-items-center" type="submit" disabled={loading}>
         <div> {loading ? "Thinking..." : "Ask"}</div>
        </button>
      </form>
      <div className="py-10">
      <div className="prose"><ReactMarkdown>{answer}</ReactMarkdown></div>
      </div>
    </main>
  );
}