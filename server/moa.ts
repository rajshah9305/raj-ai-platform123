/**
 * RAJ AI PLATFORM - Mixture of Agents (MOA) Implementation
 * Developed by RAJ SHAH
 * 
 * MOA is a multi-layer agent architecture where:
 * 1. A main model generates an initial response
 * 2. Layer agents refine the response through multiple cycles
 * 3. Each layer agent uses different models/prompts to enhance output
 * 4. The final response combines all refinements
 * 
 * Based on: https://github.com/skapadia3214/groq-moa
 */

import { getGroqCompletion, streamGroqCompletion } from "./groq";

export interface MOAConfig {
  mainModel?: string;
  numCycles?: number;
  layerAgents?: LayerAgentConfig[];
  temperature?: number;
}

export interface LayerAgentConfig {
  model: string;
  systemPrompt: string;
  name: string;
}

export interface MOAResult {
  initialResponse: string;
  layerOutputs: Array<{
    layer: number;
    agentName: string;
    output: string;
  }>;
  finalResponse: string;
  totalTokens?: number;
}

// Default layer agent configurations
const DEFAULT_LAYER_AGENTS: LayerAgentConfig[] = [
  {
    name: "Refiner",
    model: "openai/gpt-oss-120b",
    systemPrompt:
      "You are a refinement agent. Review the given response and improve it by enhancing clarity, accuracy, and completeness. Provide an improved version that maintains the original intent while being more polished.",
  },
  {
    name: "Enhancer",
    model: "openai/gpt-oss-120b",
    systemPrompt:
      "You are an enhancement agent. Take the provided response and add valuable details, examples, or context that would make it more helpful and comprehensive.",
  },
  {
    name: "Validator",
    model: "openai/gpt-oss-120b",
    systemPrompt:
      "You are a validation agent. Review the response for accuracy, consistency, and coherence. Provide a final polished version that is factually correct and well-structured.",
  },
];

/**
 * Execute MOA with streaming support
 */
export async function* streamMOA(
  userPrompt: string,
  systemPrompt: string,
  config: MOAConfig = {}
): AsyncGenerator<{ type: "initial" | "layer" | "final"; content: string; layer?: number; agentName?: string }, void, unknown> {
  const {
    mainModel = "openai/gpt-oss-120b",
    numCycles = 2,
    layerAgents = DEFAULT_LAYER_AGENTS,
    temperature = 70,
  } = config;

  // Step 1: Generate initial response from main model
  let currentResponse = "";
  yield { type: "initial", content: "Generating initial response..." };

  for await (const chunk of streamGroqCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { model: mainModel, temperature }
  )) {
    currentResponse += chunk;
    yield { type: "initial", content: chunk };
  }

  yield { type: "initial", content: "\n\n--- Refining through layers ---\n\n" };

  // Step 2: Refine through layer agents (multiple cycles)
  for (let cycle = 0; cycle < numCycles; cycle++) {
    for (const layerAgent of layerAgents) {
      yield {
        type: "layer",
        content: `\n[Layer ${cycle + 1}: ${layerAgent.name}] `,
        layer: cycle + 1,
        agentName: layerAgent.name,
      };

      let layerOutput = "";
      const layerPrompt = `Previous response:\n\n${currentResponse}\n\nUser's original request: ${userPrompt}`;

      for await (const chunk of streamGroqCompletion(
        [
          { role: "system", content: layerAgent.systemPrompt },
          { role: "user", content: layerPrompt },
        ],
        { model: layerAgent.model, temperature }
      )) {
        layerOutput += chunk;
        yield {
          type: "layer",
          content: chunk,
          layer: cycle + 1,
          agentName: layerAgent.name,
        };
      }

      // Combine current response with layer output
      currentResponse = combineResponses(currentResponse, layerOutput);
    }
  }

  // Step 3: Final response
  yield { type: "final", content: "\n\n--- Final Response ---\n\n" };
  yield { type: "final", content: currentResponse };
}

/**
 * Execute MOA without streaming (returns complete result)
 */
export async function executeMOA(
  userPrompt: string,
  systemPrompt: string,
  config: MOAConfig = {}
): Promise<MOAResult> {
  const {
    mainModel = "openai/gpt-oss-120b",
    numCycles = 2,
    layerAgents = DEFAULT_LAYER_AGENTS,
    temperature = 70,
  } = config;

  const layerOutputs: MOAResult["layerOutputs"] = [];

  // Step 1: Generate initial response
  const initialResponse = await getGroqCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { model: mainModel, temperature }
  );

  let currentResponse = initialResponse;

  // Step 2: Refine through layer agents
  for (let cycle = 0; cycle < numCycles; cycle++) {
    for (const layerAgent of layerAgents) {
      const layerPrompt = `Previous response:\n\n${currentResponse}\n\nUser's original request: ${userPrompt}`;

      const layerOutput = await getGroqCompletion(
        [
          { role: "system", content: layerAgent.systemPrompt },
          { role: "user", content: layerPrompt },
        ],
        { model: layerAgent.model, temperature }
      );

      layerOutputs.push({
        layer: cycle + 1,
        agentName: layerAgent.name,
        output: layerOutput,
      });

      // Combine responses
      currentResponse = combineResponses(currentResponse, layerOutput);
    }
  }

  return {
    initialResponse,
    layerOutputs,
    finalResponse: currentResponse,
  };
}

/**
 * Combine previous response with layer output intelligently
 */
function combineResponses(previous: string, layerOutput: string): string {
  // Simple combination: use the layer output as it should be an improved version
  // In a more sophisticated implementation, you could merge or select best parts
  return layerOutput || previous;
}

/**
 * Get task-specific MOA configuration
 */
export function getMOAConfigForTaskType(taskType: string): Partial<MOAConfig> {
  switch (taskType) {
    case "summarization":
      return {
        layerAgents: [
          {
            name: "Summarizer",
            model: "llama-3.3-70b-versatile",
            systemPrompt:
              "You are a summarization expert. Refine the summary to be more concise, clear, and comprehensive while preserving all key information.",
          },
          {
            name: "Clarity Agent",
            model: "llama-3.1-8b-instant",
            systemPrompt:
              "Improve the summary's clarity and readability while maintaining accuracy.",
          },
        ],
        numCycles: 2,
      };

    case "analysis":
      return {
        layerAgents: [
          {
            name: "Analyst",
            model: "llama-3.3-70b-versatile",
            systemPrompt:
              "You are an analysis expert. Enhance the analysis with deeper insights, patterns, and actionable recommendations.",
          },
          {
            name: "Data Validator",
            model: "llama-3.3-70b-versatile",
            systemPrompt:
              "Validate the analysis for accuracy and add supporting evidence or examples.",
          },
        ],
        numCycles: 2,
      };

    case "research":
      return {
        layerAgents: [
          {
            name: "Researcher",
            model: "llama-3.3-70b-versatile",
            systemPrompt:
              "You are a research specialist. Expand the research with additional relevant information and sources.",
          },
          {
            name: "Synthesizer",
            model: "llama-3.1-8b-instant",
            systemPrompt:
              "Synthesize the research findings into a coherent, well-organized response.",
          },
        ],
        numCycles: 2,
      };

    case "content_generation":
      return {
        layerAgents: [
          {
            name: "Writer",
            model: "llama-3.3-70b-versatile",
            systemPrompt:
              "You are a professional writer. Enhance the content with better structure, flow, and engagement.",
          },
          {
            name: "Editor",
            model: "llama-3.1-8b-instant",
            systemPrompt:
              "Edit the content for clarity, grammar, and style while maintaining the original message.",
          },
        ],
        numCycles: 2,
      };

    default:
      return {
        layerAgents: DEFAULT_LAYER_AGENTS,
        numCycles: 2,
      };
  }
}

