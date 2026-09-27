import { useState, useRef, useEffect } from "react";
import api from "../services/api";
import Button from "../components/common/Button";
import { IconAI } from "../components/common/Icons";

const SUGGESTED_QUESTIONS = [
  "How much did I spend this month?",
  "Which invoices are overdue?",
  "Why did my expenses increase?",
  "Show me my financial forecast",
  "What is my current cash balance?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your Finora AI Financial Assistant. I can analyze your transactions, cash balances, invoices, and revenue streams. What would you like to know today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText) => {
    const text = messageText || input;
    if (!text.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) {
      setInput("");
    }
    setLoading(true);

    try {
      const response = await api.post("/ai/chat", { message: userMessage.content });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I encountered an error retrieving your financial data. Please ensure the backend is running and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="page" style={{ height: "calc(100vh - 48px)", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                background: "var(--color-primary-light)",
                color: "var(--color-primary)",
              }}
            >
              <IconAI size={20} />
            </span>
            <h1 style={{ margin: 0 }}>AI Financial Assistant</h1>
          </div>
          <p style={{ margin: "4px 0 0 0" }}>
            Ask questions about your transactions, account balances, receivables, and spending trends.
          </p>
        </div>
      </div>

      {/* Suggested Questions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            disabled={loading}
            style={{
              fontSize: 12,
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-primary)";
              e.currentTarget.style.color = "var(--color-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div
        style={{
          flex: 1,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {/* Messages List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isUser ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  alignSelf: isUser ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                    fontSize: 11,
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span>{isUser ? "You" : "Finora AI"}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius)",
                    borderBottomRightRadius: isUser ? 2 : "var(--radius)",
                    borderBottomLeftRadius: isUser ? "var(--radius)" : 2,
                    background: isUser ? "var(--color-primary)" : "var(--color-bg)",
                    color: isUser ? "#ffffff" : "var(--color-text)",
                    border: isUser ? "none" : "1px solid var(--color-border)",
                    lineHeight: 1.6,
                    fontSize: 14,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--color-text-muted)",
                fontSize: 13,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary)",
                  animation: "pulse 1.2s infinite ease-in-out",
                }}
              />
              Analyzing your financial records...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: 16,
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-surface)",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your cash, spending, invoices, or revenue..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                color: "var(--color-text)",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              icon={<IconAI size={16} />}
            >
              {loading ? "Thinking..." : "Send"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
