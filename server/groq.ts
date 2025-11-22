import Groq from "groq-sdk";
import { ENV } from "./_core/env";

const groq = new Groq({
  apiKey: ENV.groqApiKey,
});

export interface GroqStreamOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * Stream a completion from Groq API
 */
export async function* streamGroqCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: GroqStreamOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    temperature = 0.7,
    maxTokens = 8192,
    model = "openai/gpt-oss-120b",
  } = options;

  try {
    const stream = await groq.chat.completions.create({
      model,
      messages: messages as any,
      temperature: temperature / 100, // Convert 0-100 to 0-1
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    throw new Error(
      `Groq API error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get a single completion from Groq API (non-streaming)
 */
export async function getGroqCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: GroqStreamOptions = {}
): Promise<string> {
  const {
    temperature = 0.7,
    maxTokens = 8192,
    model = "openai/gpt-oss-120b",
  } = options;

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: messages as any,
      temperature: temperature / 100,
      max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    throw new Error(
      `Groq API error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
