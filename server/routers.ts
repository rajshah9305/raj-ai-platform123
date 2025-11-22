import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createNlpTask,
  updateNlpTask,
  getNlpTaskById,
  getUserNlpTasks,
  deleteNlpTask,
  createAgentConfig,
  getUserAgentConfigs,
  getPublicAgentConfigs,
  incrementAgentConfigUsage,
  getTaskLogs,
  getUserPreferences,
  upsertUserPreferences,
  getUserSavedResults,
  createSavedResult,
  ensureDefaultUser,
} from "./db";
import { executeCrewAITask } from "./crewai";
import { streamGroqCompletion } from "./groq";
import { streamMOA, executeMOA, getMOAConfigForTaskType } from "./moa";
import { TRPCError } from "@trpc/server";

// Default userId to use when auth is disabled
const DEFAULT_USER_ID = 1;

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,

  nlp: router({
    createTask: protectedProcedure
      .input(
        z.object({
          title: z
            .string()
            .min(1, "Title is required")
            .max(255, "Title cannot exceed 255 characters")
            .trim(),
          description: z.string().min(1, "Description is required").trim(),
          taskType: z.enum([
            "summarization",
            "analysis",
            "research",
            "content_generation",
            "code_generation",
            "translation",
            "custom",
          ]),
          inputData: z.string().min(1, "Input data is required").trim(),
          priority: z
            .enum(["low", "medium", "high"])
            .optional()
            .default("medium"),
          agentConfig: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Ensure default user exists before creating task
          await ensureDefaultUser();

          const task = await createNlpTask({
            userId: DEFAULT_USER_ID,
            title: input.title.trim(),
            description: input.description.trim(),
            taskType: input.taskType,
            inputData: input.inputData.trim(),
            priority: input.priority,
            agentConfig: input.agentConfig,
            status: "pending",
          });
          return task;
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("[tRPC] Error in createTask:", error);
          }

          let errorMessage = "Unknown error occurred";
          let errorCode: "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" =
            "INTERNAL_SERVER_ERROR";

          if (error instanceof Error) {
            errorMessage = error.message;

            // Check for validation errors
            if (
              errorMessage.includes("required") ||
              errorMessage.includes("Invalid") ||
              errorMessage.includes("cannot be empty") ||
              errorMessage.includes("exceed")
            ) {
              errorCode = "BAD_REQUEST";
            }
          }

          throw new TRPCError({
            code: errorCode,
            message: errorMessage,
            cause: error,
          });
        }
      }),

    executeTask: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          temperature: z.number().min(0).max(100).optional(),
          multiAgent: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const task = await getNlpTaskById(input.taskId);
        if (!task)
          throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
        await updateNlpTask(task.id, { status: "processing" });
        const startTime = Date.now();
        try {
          const result = await executeCrewAITask({
            taskType: task.taskType,
            inputData: task.inputData,
            temperature: input.temperature,
            multiAgent: input.multiAgent,
          });
          const processingTime = Date.now() - startTime;
          if (result.success && result.result) {
            await updateNlpTask(task.id, {
              status: "completed",
              outputData: result.result,
              processingTime,
              completedAt: new Date(),
            });
            return { success: true, result: result.result, processingTime };
          } else {
            await updateNlpTask(task.id, {
              status: "failed",
              errorMessage: result.error || "Unknown error",
              processingTime,
            });
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: result.error || "Task execution failed",
            });
          }
        } catch (error) {
          const processingTime = Date.now() - startTime;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          await updateNlpTask(task.id, {
            status: "failed",
            errorMessage,
            processingTime,
          });
          throw error;
        }
      }),

    streamTask: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          temperature: z.number().min(0).max(100).optional(),
          useMOA: z.boolean().optional().default(false),
        })
      )
      .mutation(async ({ input }) => {
        const task = await getNlpTaskById(input.taskId);
        if (!task)
          throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
        await updateNlpTask(task.id, { status: "processing", outputData: "" });
        const startTime = Date.now();
        let fullResult = "";
        let lastUpdateTime = Date.now();
        const UPDATE_INTERVAL = 500; // Update database every 500ms
        
        try {
          const systemPrompt = getSystemPromptForTaskType(task.taskType);
          
          if (input.useMOA) {
            // Use MOA (Mixture of Agents) for enhanced responses
            const moaConfig = getMOAConfigForTaskType(task.taskType);
            for await (const chunk of streamMOA(
              task.inputData,
              systemPrompt,
              {
                ...moaConfig,
                temperature: input.temperature,
              }
            )) {
              fullResult += chunk.content;
              
              // Update database incrementally for real-time preview
              const now = Date.now();
              if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                await updateNlpTask(task.id, {
                  outputData: fullResult,
                });
                lastUpdateTime = now;
              }
            }
          } else {
            // Use standard Groq streaming
            for await (const chunk of streamGroqCompletion(
              [
                { role: "system", content: systemPrompt },
                { role: "user", content: task.inputData },
              ],
              { temperature: input.temperature }
            )) {
              fullResult += chunk;
              
              // Update database incrementally for real-time preview
              const now = Date.now();
              if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                await updateNlpTask(task.id, {
                  outputData: fullResult,
                });
                lastUpdateTime = now;
              }
            }
          }
          
          // Final update with complete result
          const processingTime = Date.now() - startTime;
          await updateNlpTask(task.id, {
            status: "completed",
            outputData: fullResult,
            processingTime,
            completedAt: new Date(),
          });
          return { success: true, result: fullResult, processingTime };
        } catch (error) {
          const processingTime = Date.now() - startTime;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          await updateNlpTask(task.id, {
            status: "failed",
            errorMessage,
            processingTime,
            outputData: fullResult || undefined, // Save partial result if available
          });
          throw error;
        }
      }),

    executeMOA: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          temperature: z.number().min(0).max(100).optional(),
          numCycles: z.number().min(1).max(5).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const task = await getNlpTaskById(input.taskId);
        if (!task)
          throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
        await updateNlpTask(task.id, { status: "processing" });
        const startTime = Date.now();
        try {
          const systemPrompt = getSystemPromptForTaskType(task.taskType);
          const moaConfig = getMOAConfigForTaskType(task.taskType);
          
          const result = await executeMOA(
            task.inputData,
            systemPrompt,
            {
              ...moaConfig,
              temperature: input.temperature,
              numCycles: input.numCycles,
            }
          );
          
          const processingTime = Date.now() - startTime;
          await updateNlpTask(task.id, {
            status: "completed",
            outputData: result.finalResponse,
            processingTime,
            completedAt: new Date(),
          });
          
          return {
            success: true,
            result: result.finalResponse,
            initialResponse: result.initialResponse,
            layerOutputs: result.layerOutputs,
            processingTime,
          };
        } catch (error) {
          const processingTime = Date.now() - startTime;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          await updateNlpTask(task.id, {
            status: "failed",
            errorMessage,
            processingTime,
          });
          throw error;
        }
      }),

    getTasks: protectedProcedure
      .input(
        z.object({ limit: z.number().min(1).max(100).optional() }).optional()
      )
      .query(async ({ input }) =>
        getUserNlpTasks(DEFAULT_USER_ID, input?.limit)
      ),

    getTask: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const task = await getNlpTaskById(input.id);
        if (!task)
          throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
        return task;
      }),

    deleteTask: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteNlpTask(input.id, DEFAULT_USER_ID);
        return { success: true };
      }),

    getTaskLogs: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        const task = await getNlpTaskById(input.taskId);
        if (!task)
          throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
        return getTaskLogs(input.taskId);
      }),
  }),

  agents: router({
    createConfig: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          agentType: z.enum([
            "researcher",
            "writer",
            "analyst",
            "summarizer",
            "coder",
            "translator",
            "custom",
          ]),
          systemPrompt: z.string().min(1),
          temperature: z.number().min(0).max(100).optional(),
          maxTokens: z.number().min(1).max(32000).optional(),
          isPublic: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) =>
        createAgentConfig({
          userId: DEFAULT_USER_ID,
          name: input.name,
          description: input.description,
          agentType: input.agentType,
          systemPrompt: input.systemPrompt,
          temperature: input.temperature || 70,
          maxTokens: input.maxTokens || 8192,
          isPublic: input.isPublic || false,
        })
      ),

    getUserConfigs: protectedProcedure.query(async () =>
      getUserAgentConfigs(DEFAULT_USER_ID)
    ),
    getPublicConfigs: publicProcedure.query(async () =>
      getPublicAgentConfigs()
    ),
    incrementUsage: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await incrementAgentConfigUsage(input.id);
        return { success: true };
      }),
  }),

  preferences: router({
    get: protectedProcedure.query(async () =>
      getUserPreferences(DEFAULT_USER_ID)
    ),
    update: protectedProcedure
      .input(
        z.object({
          defaultAgentConfig: z.number().optional(),
          theme: z.enum(["light", "dark", "system"]).optional(),
          defaultTaskType: z.string().optional(),
          notificationsEnabled: z.boolean().optional(),
          autoSaveResults: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await upsertUserPreferences({ userId: DEFAULT_USER_ID, ...input });
        return { success: true };
      }),
  }),

  results: router({
    save: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          title: z.string().min(1).max(255),
          content: z.string().min(1),
          format: z.enum(["json", "markdown", "text", "pdf"]),
          fileUrl: z.string().optional(),
          isPublic: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) =>
        createSavedResult({
          userId: DEFAULT_USER_ID,
          taskId: input.taskId,
          title: input.title,
          content: input.content,
          format: input.format,
          fileUrl: input.fileUrl,
          isPublic: input.isPublic || false,
        })
      ),

    getUserResults: protectedProcedure.query(async () =>
      getUserSavedResults(DEFAULT_USER_ID)
    ),
  }),
});

export type AppRouter = typeof appRouter;

function getSystemPromptForTaskType(taskType: string): string {
  const prompts: Record<string, string> = {
    summarization:
      "You are an expert at condensing complex information into clear, concise summaries. Identify key points and present them in an easily digestible format.",
    analysis:
      "You are a skilled data analyst. Analyze the provided information, identify trends and patterns, and provide actionable insights.",
    research:
      "You are an expert research analyst. Conduct thorough research, gather comprehensive information, and synthesize findings into clear insights.",
    content_generation:
      "You are a professional content writer. Create engaging, well-structured content that resonates with the target audience.",
    code_generation:
      "You are an experienced software developer. Generate clean, efficient, and well-documented code following best practices.",
    translation:
      "You are an expert translator. Provide accurate translations while preserving the original meaning and tone.",
    custom:
      "You are a helpful AI assistant. Provide comprehensive and accurate responses to user queries.",
  };
  return prompts[taskType] || prompts.custom;
}
