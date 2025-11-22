import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ENV } from "./_core/env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CrewAITaskConfig {
  taskType:
    | "summarization"
    | "analysis"
    | "research"
    | "content_generation"
    | "code_generation"
    | "translation"
    | "custom";
  inputData: string;
  temperature?: number;
  maxTokens?: number;
  multiAgent?: boolean;
}

export interface CrewAIResult {
  success: boolean;
  result?: string;
  error?: string;
  agentType?: string;
  agentsUsed?: string[];
  taskType?: string;
}

// Python path - works on both Unix and Windows
const isWindows = process.platform === "win32";
const PYTHON_VENV_PATH = path.join(
  process.cwd(),
  "venv",
  isWindows ? "Scripts" : "bin",
  isWindows ? "python.exe" : "python"
);

// Fallback to system python if venv doesn't exist
const SYSTEM_PYTHON = isWindows ? "python" : "python3";
const CREWAI_SERVICE_PATH = path.join(__dirname, "crewai_service.py");

export async function executeCrewAITask(
  config: CrewAITaskConfig
): Promise<CrewAIResult> {
  return new Promise((resolve, reject) => {
    const taskConfig = {
      task_type: config.taskType,
      input_data: config.inputData,
      temperature: config.temperature ?? 70,
      max_tokens: config.maxTokens ?? 8192,
      multi_agent: config.multiAgent ?? false,
    };

    const configJson = JSON.stringify(taskConfig);

    // Try venv python first, fallback to system python
    const pythonPath = fs.existsSync(PYTHON_VENV_PATH) ? PYTHON_VENV_PATH : SYSTEM_PYTHON;
    
    const pythonProcess = spawn(
      pythonPath,
      [CREWAI_SERVICE_PATH, configJson],
      {
        env: {
          ...process.env,
          GROQ_API_KEY: ENV.groqApiKey,
          OPENAI_API_KEY: "dummy-key-to-disable-openai",
        },
      }
    );

    let outputData = "";
    let errorData = "";

    pythonProcess.stdout.on("data", data => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on("data", data => {
      errorData += data.toString();
    });

    pythonProcess.on("close", code => {
      if (code !== 0) {
        reject(
          new Error(`CrewAI process exited with code ${code}: ${errorData}`)
        );
        return;
      }

      try {
        // Extract JSON from output - find the last valid JSON line
        const lines = outputData.trim().split("\n");
        let result: CrewAIResult | null = null;

        // Try to find JSON starting from the last line and working backwards
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (!line) continue;

          // Check if line looks like JSON (starts with { or [)
          if (line.startsWith("{") || line.startsWith("[")) {
            try {
              result = JSON.parse(line);
              break;
            } catch (e) {
              // Not valid JSON, continue searching
              continue;
            }
          }
        }

        // If no JSON found in lines, try parsing the entire output
        if (!result) {
          try {
            result = JSON.parse(outputData.trim());
          } catch (e) {
            // If that fails, try to extract JSON from the output
            const jsonMatch = outputData.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              result = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error(
                `No valid JSON found in output. Output: ${outputData.substring(0, 500)}`
              );
            }
          }
        }

        if (result) {
          resolve(result);
        } else {
          throw new Error(
            `Failed to parse JSON from output: ${outputData.substring(0, 500)}`
          );
        }
      } catch (error) {
        reject(
          new Error(
            `Failed to parse CrewAI output: ${error instanceof Error ? error.message : String(error)}. Output: ${outputData.substring(0, 500)}`
          )
        );
      }
    });

    pythonProcess.on("error", error => {
      reject(new Error(`Failed to start CrewAI process: ${error.message}`));
    });
  });
}

export async function* streamCrewAITask(
  config: CrewAITaskConfig
): AsyncGenerator<string, void, unknown> {
  // For streaming, we'll execute the task and yield chunks of the result
  // This is a simplified version - full streaming would require modifying the Python service
  const result = await executeCrewAITask(config);

  if (!result.success || !result.result) {
    throw new Error(result.error || "Task execution failed");
  }

  // Simulate streaming by yielding words
  const words = result.result.split(" ");
  for (const word of words) {
    yield word + " ";
    // Small delay to simulate streaming
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
