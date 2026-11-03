export interface StandaloneChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class StandaloneChatbotError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 502 | 503
  ) {
    super(message);
    this.name = 'StandaloneChatbotError';
  }
}

const CHAT_API_URL = 'http://localhost:11434/api/chat';
const CHAT_MODEL = 'llama3.2:3b';

function modelUnavailableError() {
  return new StandaloneChatbotError(
    `The required local model is unavailable. Run "ollama pull ${CHAT_MODEL}" and try again.`,
    503
  );
}

export async function openStandaloneChatStream(
  messages: StandaloneChatMessage[],
  signal: AbortSignal
): Promise<ReadableStream<Uint8Array>> {
  let response: Response;
  try {
    response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a fast and helpful AI assistant. Answer exactly what the user asks. Keep answers short, clear and simple. Avoid unnecessary introductions, repeated information and lengthy explanations. For simple questions, answer in 2-4 sentences. Give detailed answers only when explicitly requested.',
          },
          ...messages,
        ],
        stream: true,
        keep_alive: '5m',
        options: {
          temperature: 0.6,
          num_predict: 140,
        },
      }),
      signal,
    });
  } catch {
    if (signal.aborted) {
      throw new StandaloneChatbotError(
        'The assistant took too long to respond. Please try again.',
        503
      );
    }
    throw new StandaloneChatbotError(
      'The assistant is unavailable. Make sure Ollama is running and try again.',
      503
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw modelUnavailableError();
    }
    throw new StandaloneChatbotError(
      'The assistant could not complete the request. Please try again.',
      502
    );
  }

  if (!response.body) {
    throw new StandaloneChatbotError(
      'The assistant returned an invalid response. Please try again.',
      502
    );
  }

  return response.body;
}

export async function* readStandaloneChatStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const parseLine = (line: string): string | undefined => {
    if (!line.trim()) return undefined;

    let data: {
      message?: { content?: string };
      error?: string;
      done?: boolean;
    };
    try {
      data = JSON.parse(line);
    } catch {
      throw new StandaloneChatbotError(
        'The assistant returned an invalid response. Please try again.',
        502
      );
    }

    if (data.error) {
      if (/model .* not found/i.test(data.error)) {
        throw modelUnavailableError();
      }
      throw new StandaloneChatbotError(
        'The assistant could not complete the request. Please try again.',
        502
      );
    }

    return typeof data.message?.content === 'string'
      ? data.message.content
      : undefined;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: !done });
      }

      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);
        const content = parseLine(line);
        if (content) yield content;
        newlineIndex = buffer.indexOf('\n');
      }

      if (done) {
        buffer += decoder.decode();
        const content = parseLine(buffer.replace(/\r$/, ''));
        if (content) yield content;
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
