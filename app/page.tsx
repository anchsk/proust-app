"use client";
import { useEffect, useRef, useState } from "react";
import type { ChatStatus } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { AboutDialog } from "@/components/about-dialog";
import { SearchHistory } from "@/components/search-history";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { type Entry, loadHistory, saveHistory } from "@/lib/history";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
// HF Spaces sleep when idle; if nothing arrives by then, tell the user why
const COLD_START_HINT_MS = 5000;

const SUGGESTIONS = [
  "La madeleine et le thé",
  "Flowers in the garden description",
  "Swann's jealousy",
];

// Answers open with markdown like "# ", so wait for actual words before rendering
const hasWords = (text: string) => /[\p{L}\p{N}]/u.test(text);

export default function Home() {
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  // null means the home screen, otherwise the search being shown
  const [activeId, setActiveId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [slow, setSlow] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const active = entries.find((e) => e.id === activeId);
  const status: ChatStatus = streaming ? "streaming" : loading ? "submitted" : active?.error ? "error" : "ready";

  // Read after mount: the server render has no access to localStorage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from browser storage
    setEntries(loadHistory());
    setHistoryLoaded(true);
  }, []);

  // Save once an answer settles rather than on every streamed chunk
  useEffect(() => {
    if (historyLoaded && !loading) saveHistory(entries);
  }, [entries, loading, historyLoaded]);

  async function ask(text: string) {
    const query = text.trim();
    if (!query || loading) return;

    const id = crypto.randomUUID();
    setQuestion("");
    setLoading(true);
    setEntries((prev) => [...prev, { id, question: query, answer: "" }]);
    setActiveId(id);

    const updateEntry = (patch: Partial<Entry>) =>
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

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
        updateEntry({ answer: data.message });
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (firstChunk) {
          firstChunk = false;
          clearTimeout(slowTimer);
          setSlow(false);
          setStreaming(true);
        }
        // stream: true keeps multi-byte chars (é, œ…) split across chunks intact
        answer += decoder.decode(value, { stream: true });
        updateEntry({ answer });
      }
      answer += decoder.decode();
      updateEntry({ answer });
    } catch (err) {
      if (controller.signal.aborted) {
        updateEntry({ stopped: true });
        return;
      }
      console.error(err);
      updateEntry({ error: true });
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setStreaming(false);
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  // Leaving a search that is still loading stops it; it stays in the history as stopped
  function showSearch(id: string | null) {
    if (id !== activeId) abortRef.current?.abort();
    setActiveId(id);
  }

  function handleNewSearch() {
    showSearch(null);
    setQuestion("");
  }

  function handleClearHistory() {
    abortRef.current?.abort();
    setEntries([]);
    setActiveId(null);
  }

  // While loading, the submit button acts as Stop (type="button"), so PromptInput's own
  // Enter handling would reset the form and wipe the draft. Keep it for after the answer.
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (loading && e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
    }
  }

  const promptInput = (
    <PromptInput onSubmit={({ text }) => { ask(text); }}>
      <PromptInputBody>
        <PromptInputTextarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={active ? "Ask a new question..." : "Ask about the book..."}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <p className="px-2 text-muted-foreground text-xs">
          Each question is answered on its own, without memory of earlier ones.
        </p>
        <PromptInputSubmit status={status} onStop={handleStop} disabled={!loading && !question.trim()} />
      </PromptInputFooter>
    </PromptInput>
  );

  return (
    <SidebarProvider>
      <SearchHistory
        entries={entries}
        activeId={activeId}
        onSelect={showSearch}
        onNewSearch={handleNewSearch}
        onClearHistory={handleClearHistory}
      />
      <SidebarInset className="h-dvh">
        <header className="flex h-12 shrink-0 items-center justify-between px-2">
          <SidebarTrigger />
          <AboutDialog />
        </header>

        {active ? (
          <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4 pb-6">
            {/* Remount per search: follow a streaming answer, but open saved ones at the top */}
            <Conversation key={active.id} initial={loading ? "smooth" : false} className="flex-1">
              <ConversationContent className="text-sm">
                <h2 className="border-l-2 border-foreground/30 pl-3 font-medium text-base text-muted-foreground">
                  {active.question}
                </h2>
                {hasWords(active.answer) && (
                  <MessageResponse isAnimating={streaming}>{active.answer}</MessageResponse>
                )}
                {loading && !streaming && (
                  <Shimmer>
                    {slow ? "Waking up the server, this can take up to a minute..." : "Thinking..."}
                  </Shimmer>
                )}
                {active.stopped && <p className="text-muted-foreground italic">Stopped.</p>}
                {active.error && (
                  <p className="text-destructive">
                    Something went wrong while fetching the answer. Please try again.
                  </p>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
            <div className="mt-4">{promptInput}</div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 pb-24">
            <div className="space-y-1 text-center">
              <h1 className="font-medium text-2xl">Proust Recherche</h1>
              <p className="text-lg italic">Du côté de chez Swann</p>
              <p className="pt-2 text-muted-foreground text-sm">
                Get answers grounded in quotes from Proust&apos;s text, in any language.
              </p>
            </div>
            {promptInput}
            <Suggestions className="mx-auto">
              {SUGGESTIONS.map((s) => (
                <Suggestion key={s} suggestion={s} onClick={ask} />
              ))}
            </Suggestions>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
