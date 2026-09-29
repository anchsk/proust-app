"use client";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
// HF Spaces sleep when idle; if nothing arrives by then, tell the user why
const COLD_START_HINT_MS = 5000;

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const query = question.trim();
    if (!query || loading) return;

    setAnswer("");
    setError("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const slowTimer = setTimeout(() => setSlow(true), COLD_START_HINT_MS);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      // No matching passages: the backend sends JSON instead of a stream
      if (res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setAnswer(data.message);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        clearTimeout(slowTimer);
        setSlow(false);
        // stream: true keeps multi-byte chars (é, œ…) split across chunks intact
        text += decoder.decode(value, { stream: true });
        setAnswer(text);
      }
      text += decoder.decode();
      setAnswer(text);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error(err);
      setError("Something went wrong while fetching the answer. Please try again.");
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  return (
    <main className="pt-20 px-10 max-w-150">
      <form onSubmit={handleSubmit}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about Swann's Way..."
          className="w-full border-b border-b-black mb-4"
        />
        {loading ? (
          <button className="border border-gray-300 px-3 pt-1.5 pb-1 rounded-lg grid place-items-center" type="button" onClick={handleStop}>
            <div>Stop</div>
          </button>
        ) : (
          <button className="border border-gray-300 px-3 pt-1.5 pb-1 rounded-lg grid place-items-center" type="submit" disabled={!question.trim()}>
            <div>Ask</div>
          </button>
        )}
      </form>
      <div className="py-10">
        {loading && !answer && (
          <p className="text-gray-500">
            {slow ? "Waking up the server, this can take up to a minute..." : "Thinking..."}
          </p>
        )}
        {error && <p className="text-red-600">{error}</p>}
        <div className="prose"><ReactMarkdown>{answer}</ReactMarkdown></div>
      </div>
    </main>
  );
}
