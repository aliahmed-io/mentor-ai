"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, AlertCircle, Loader2, BookOpen } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [q, setQ] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [sources, setSources] = useState<{ id: string; position: number; preview: string }[]>([]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [messages]);

  const ask = async () => {
    const question = q.trim();
    if (!question || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setMessages((m) => [...m, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setQ("");
    
    try {
      const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ question }) });
      
      if (!res.ok) {
        throw new Error('Failed to get response');
      }
      
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = dec.decode(value);
        text
          .split("\n\n")
          .filter(Boolean)
          .forEach((line) => {
            if (!line.startsWith("data:")) return;
            try {
              const payload = JSON.parse(line.slice(5));
              if (payload.type === "token") {
                setMessages((m) => {
                  const copy = [...m];
                  const last = copy[copy.length - 1];
                  if (last?.role === "assistant") last.content += payload.content;
                  return copy;
                });
              } else if (payload.type === "sources") {
                setSources(payload.items || []);
              }
            } catch (e) {
              console.error('Error parsing streaming response:', e);
            }
          });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") last.content = "Sorry, I couldn't process your question. Please try again.";
        return copy;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl md:text-2xl font-semibold">AI Chat</h2>
        </div>
        <Badge variant="secondary" className="w-fit">Ask questions about your documents</Badge>
      </div>
      
      <Card className="flex flex-col h-[60vh] md:h-[70vh] shadow-lg border-0">
        <CardContent className="flex-1 flex flex-col p-0">
          <div ref={boxRef} className="flex-1 overflow-auto p-4 md:p-6 space-y-4" aria-live="polite">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-muted-foreground max-w-md">
                  Ask questions about your uploaded documents. I can help you understand the content, 
                  generate summaries, and answer specific questions.
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex gap-2 md:gap-3 ${m.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex gap-2 md:gap-3 max-w-[85%] sm:max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                      m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                    }`}>
                      {m.role === "user" ? <User className="h-3 w-3 md:h-4 md:w-4" /> : <Bot className="h-3 w-3 md:h-4 md:w-4" />}
                    </div>
                    <div className={`rounded-xl px-3 py-2 md:px-4 md:py-2 shadow-sm ${
                      m.role === "user" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-900"
                    }`}>
                      <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{m.content}</div>
                      {m.role === "assistant" && isLoading && i === messages.length - 1 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs opacity-70">Thinking...</span>
                        </div>
                      )}
                      {m.role === "assistant" && i === messages.length - 1 && sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sources.map((s, idx) => (
                            <a key={s.id} href={`/document/${''}#pos-${s.position}`} className="inline-flex items-center gap-1 text-xs bg-white rounded px-2 py-1 border hover:bg-blue-50" title={s.preview}>
                              <BookOpen className="h-3 w-3 text-blue-600" /> Source {idx+1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border-t border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}
          
          <div className="p-4 md:p-6 border-t bg-gray-50/50">
            <div className="flex gap-2 md:gap-3">
              <Input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your documents..." 
                disabled={isLoading}
                className="flex-1 h-10 md:h-11 text-sm md:text-base"
              />
              <Button 
                onClick={ask} 
                disabled={!q.trim() || isLoading}
                size="icon"
                className="h-10 w-10 md:h-11 md:w-11 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center md:text-left">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


