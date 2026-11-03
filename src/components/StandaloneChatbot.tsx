import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Plus, Send, X } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id?: number;
}

const MAX_MESSAGES = 10;

export const StandaloneChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messageListRef = useRef<HTMLDivElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const messageIdRef = useRef(0);
  const activeResponseIdRef = useRef<number | null>(null);

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: isLoading ? 'auto' : 'smooth',
    });
  }, [messages, isLoading, isOpen]);

  const startNewChat = () => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    activeResponseIdRef.current = null;
    setIsLoading(false);
    setMessages([]);
    setInput('');
    setError('');
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    const conversation: ChatMessage[] = [
      ...messages,
      { role: 'user' as const, content: question },
    ].slice(-MAX_MESSAGES);
    const responseId = ++messageIdRef.current;
    activeResponseIdRef.current = responseId;
    const responseMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      id: responseId,
    };
    setMessages([
      ...conversation,
      responseMessage,
    ].slice(-MAX_MESSAGES));
    setInput('');
    setError('');
    setIsLoading(true);
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        let responseError = 'Unable to get a response. Please try again.';
        try {
          const data: { error?: string } = await response.json();
          if (typeof data.error === 'string') responseError = data.error;
        } catch {
          // Keep the generic message when the server does not return JSON.
        }
        throw new Error(responseError);
      }
      if (!response.body) {
        throw new Error('The assistant returned an invalid response. Please try again.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';
      let completed = false;

      const handleEventLine = (line: string) => {
        if (!line.startsWith('data:')) return;

        let event: { chunk?: string; done?: boolean; error?: string };
        try {
          event = JSON.parse(line.slice(5).trim());
        } catch {
          throw new Error('The assistant returned an invalid response. Please try again.');
        }

        if (typeof event.error === 'string') throw new Error(event.error);
        if (typeof event.chunk === 'string' && event.chunk) {
          answer += event.chunk;
          setMessages((current) =>
            current.map((message) =>
              message.id === responseId
                ? { ...message, content: message.content + event.chunk }
                : message
            )
          );
        }
        if (event.done === true) completed = true;
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (value) buffer += decoder.decode(value, { stream: !done });

          let newlineIndex = buffer.indexOf('\n');
          while (newlineIndex !== -1) {
            handleEventLine(buffer.slice(0, newlineIndex).replace(/\r$/, ''));
            buffer = buffer.slice(newlineIndex + 1);
            newlineIndex = buffer.indexOf('\n');
          }

          if (done) {
            buffer += decoder.decode();
            if (buffer.trim()) handleEventLine(buffer.replace(/\r$/, ''));
            break;
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!completed) {
        throw new Error('The assistant connection ended before the response was complete.');
      }
      if (!answer.trim()) {
        throw new Error('The assistant returned an empty response. Please try again.');
      }
    } catch (requestError) {
      if (
        controller.signal.aborted ||
        (requestError instanceof DOMException && requestError.name === 'AbortError')
      ) {
        return;
      }
      controller.abort();
      if (activeResponseIdRef.current === responseId) {
        setMessages((current) =>
          current.filter(
            (message) => message.id !== responseId || Boolean(message.content)
          )
        );
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to reach the assistant. Please try again.'
        );
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
      if (activeResponseIdRef.current === responseId) {
        activeResponseIdRef.current = null;
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="standalone-chatbot-widget fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          aria-label="AI Assistant chat window"
          className="flex h-[min(560px,calc(100dvh-120px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
        >
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Bot className="h-5 w-5" />
              </span>
              <h2 className="text-sm font-semibold text-slate-900">AI Assistant</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startNewChat}
                aria-label="New Chat"
                title="New Chat"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">New Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div
            ref={messageListRef}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-slate-800">
                  How can I help?
                </p>
                <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-slate-500">
                  Ask a question about programming, science, history, or anything else.
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={message.id ?? `${index}-${message.role}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && !message.content && isLoading ? (
                  <div
                    className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm"
                    role="status"
                    aria-label="Assistant is typing"
                  >
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500" />
                  </div>
                ) : (
                  <p
                    className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-indigo-600 text-white'
                        : 'rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm'
                    }`}
                  >
                    {message.content}
                  </p>
                )}
              </div>
            ))}

            {error && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </p>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex items-end gap-2 border-t border-slate-200 bg-white p-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={1500}
              rows={1}
              placeholder="Message..."
              aria-label="Message"
              className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        aria-expanded={isOpen}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-900/25 transition hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};
