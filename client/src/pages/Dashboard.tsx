import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  Play,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Bot,
  FileText,
  Zap,
  Calendar,
  Timer,
  Type,
  AlignLeft,
  Settings,
  Gauge,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";
import { Streamdown } from "streamdown";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<
    | "summarization"
    | "analysis"
    | "research"
    | "content_generation"
    | "code_generation"
    | "translation"
    | "custom"
  >("summarization");
  const [inputData, setInputData] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [temperature, setTemperature] = useState(0.7);
  const [multiAgent, setMultiAgent] = useState(false);
  const [useMOA, setUseMOA] = useState(false);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "details">("tasks");
  const [streamingTaskId, setStreamingTaskId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: tasks, isLoading: tasksLoading } = trpc.nlp.getTasks.useQuery({
    limit: 50,
  });
  const { data: selectedTaskData, isLoading: selectedTaskLoading } =
    trpc.nlp.getTask.useQuery(
      { id: selectedTask! },
      { 
        enabled: !!selectedTask && streamingTaskId !== selectedTask,
        refetchInterval: streamingTaskId === selectedTask ? false : undefined,
      }
    );

  const createTask = trpc.nlp.createTask.useMutation({
    onSuccess: task => {
      toast.success("Task created successfully!");
      utils.nlp.getTasks.invalidate();
      setTitle("");
      setDescription("");
      setInputData("");
      
      // Select the new task and switch to details tab for real-time preview
      setSelectedTask(task.id);
      setActiveTab("details");
      setStreamingTaskId(task.id);
      
      // Use MOA if enabled, otherwise use CrewAI or direct execution
      if (useMOA) {
        streamTask.mutate({
          taskId: task.id,
          temperature: temperature * 100,
          useMOA: true,
        });
      } else if (multiAgent) {
        executeTask.mutate({
          taskId: task.id,
          temperature: temperature * 100,
          multiAgent: true,
        });
      } else {
        // Use streaming for standard mode too
        streamTask.mutate({
          taskId: task.id,
          temperature: temperature * 100,
          useMOA: false,
        });
      }
    },
    onError: error => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });

  const executeTask = trpc.nlp.executeTask.useMutation({
    onSuccess: result => {
      toast.success(
        `Task completed in ${(result.processingTime / 1000).toFixed(2)}s`
      );
      utils.nlp.getTasks.invalidate();
      if (selectedTask) {
        utils.nlp.getTask.invalidate({ id: selectedTask });
      }
    },
    onError: error => {
      toast.error(`Task execution failed: ${error.message}`);
      utils.nlp.getTasks.invalidate();
    },
  });

  const streamTask = trpc.nlp.streamTask.useMutation({
    onSuccess: result => {
      setStreamingTaskId(null);
      toast.success(
        `Task completed in ${(result.processingTime / 1000).toFixed(2)}s`
      );
      utils.nlp.getTasks.invalidate();
      if (selectedTask) {
        utils.nlp.getTask.invalidate({ id: selectedTask });
      }
    },
    onError: error => {
      setStreamingTaskId(null);
      toast.error(`Task execution failed: ${error.message}`);
      utils.nlp.getTasks.invalidate();
      if (selectedTask) {
        utils.nlp.getTask.invalidate({ id: selectedTask });
      }
    },
  });

  // Poll for real-time updates during streaming
  const { data: streamingTaskData } = trpc.nlp.getTask.useQuery(
    { id: streamingTaskId! },
    {
      enabled: !!streamingTaskId,
      refetchInterval: streamingTaskId ? 500 : false, // Poll every 500ms during streaming
    }
  );

  const deleteTask = trpc.nlp.deleteTask.useMutation({
    onSuccess: () => {
      toast.success("Task deleted");
      utils.nlp.getTasks.invalidate();
      if (selectedTask) {
        setSelectedTask(null);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !inputData) {
      toast.error("Please fill in all required fields");
      return;
    }
    createTask.mutate({
      title,
      description,
      taskType,
      inputData,
      priority,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "bg-green-50 text-green-700 border-green-300 font-medium",
      processing: "bg-orange-50 text-orange-700 border-orange-300 font-medium",
      failed: "bg-red-50 text-red-700 border-red-300 font-medium",
      pending: "bg-gray-50 text-gray-700 border-gray-300 font-medium",
    };
    return (
      <Badge
        variant="outline"
        className={`${variants[status] || variants.pending} capitalize`}
      >
        {status}
      </Badge>
    );
  };

  const getTaskTypeIcon = (taskType: string) => {
    const icons: Record<string, React.ReactNode> = {
      summarization: <FileText className="w-4 h-4" />,
      analysis: <Zap className="w-4 h-4" />,
      research: <Sparkles className="w-4 h-4" />,
      content_generation: <FileText className="w-4 h-4" />,
      code_generation: <Zap className="w-4 h-4" />,
      translation: <FileText className="w-4 h-4" />,
      custom: <Sparkles className="w-4 h-4" />,
    };
    return icons[taskType] || <FileText className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container py-4 sm:py-5 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-6">
          <Link href="/" className="min-w-0 group">
            <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-transform hover:scale-105">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-black truncate">
                {APP_TITLE}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <span className="text-sm sm:text-base text-gray-600 hidden sm:inline font-medium">
              Welcome
            </span>
          </div>
        </div>
      </nav>

      <div className="container py-6 sm:py-8 lg:py-10 px-4 sm:px-6">
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-black tracking-tight">
            NLP Dashboard
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
            Create and manage your AI-powered NLP tasks with real-time processing and multi-agent collaboration
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {/* Task Creation Form */}
          <div className="lg:col-span-1">
            <Card
              className={`border-gray-200 bg-white lg:sticky lg:top-28 shadow-xl hover:shadow-2xl transition-shadow duration-300 relative ${
                createTask.isPending || executeTask.isPending
                  ? "opacity-95"
                  : ""
              }`}
            >
              {(createTask.isPending || executeTask.isPending) && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
                    <p className="text-sm font-medium text-gray-700">
                      {createTask.isPending
                        ? "Creating task..."
                        : "Processing task..."}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Please wait</p>
                  </div>
                </div>
              )}
              <CardHeader className="px-5 py-4 bg-gradient-to-br from-orange-50 via-orange-50/50 to-white border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500 text-white shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-black">
                      Create New Task
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-gray-600 mt-1">
                      Configure and submit your NLP task
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 py-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Task Title */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="title"
                      className="text-xs font-semibold text-black flex items-center gap-2"
                    >
                      <Type className="w-4 h-4 text-gray-500" />
                      Task Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g., Summarize quarterly report"
                      required
                      className="h-10 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-xs font-semibold text-black flex items-center gap-2"
                    >
                      <AlignLeft className="w-4 h-4 text-gray-500" />
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Describe what you want to accomplish..."
                      rows={2}
                      required
                      className="resize-none text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors"
                    />
                  </div>

                  {/* Task Type and Priority in one row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="taskType"
                        className="text-xs font-semibold text-black flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        Task Type
                      </Label>
                      <Select
                        value={taskType}
                        onValueChange={(v: any) => setTaskType(v)}
                      >
                        <SelectTrigger
                          id="taskType"
                          className="h-10 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="summarization">
                            📄 Summarization
                          </SelectItem>
                          <SelectItem value="analysis">📊 Analysis</SelectItem>
                          <SelectItem value="research">🔍 Research</SelectItem>
                          <SelectItem value="content_generation">
                            ✍️ Content Generation
                          </SelectItem>
                          <SelectItem value="code_generation">
                            💻 Code Generation
                          </SelectItem>
                          <SelectItem value="translation">
                            🌐 Translation
                          </SelectItem>
                          <SelectItem value="custom">⚙️ Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="priority"
                        className="text-xs font-semibold text-black"
                      >
                        Priority
                      </Label>
                      <Select
                        value={priority}
                        onValueChange={(v: any) => setPriority(v)}
                      >
                        <SelectTrigger
                          id="priority"
                          className="h-10 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">🟢 Low</SelectItem>
                          <SelectItem value="medium">🟡 Medium</SelectItem>
                          <SelectItem value="high">🔴 High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Input Text */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="inputData"
                      className="text-xs font-semibold text-black flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-gray-500" />
                      Input Text
                    </Label>
                    <Textarea
                      id="inputData"
                      value={inputData}
                      onChange={e => setInputData(e.target.value)}
                      placeholder="Paste your text here..."
                      rows={4}
                      required
                      className="resize-y min-h-[110px] text-xs border-gray-300 focus:border-orange-500 focus:ring-orange-500 font-mono transition-colors"
                    />
                    <p className="text-xs text-gray-500 pl-1">
                      {inputData.length} characters
                    </p>
                  </div>

                  {/* Temperature Slider */}
                  <div className="space-y-2.5 p-4 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="temperature"
                        className="text-xs font-semibold text-black flex items-center gap-2"
                      >
                        <Gauge className="w-4 h-4 text-gray-500" />
                        Temperature
                      </Label>
                      <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg shadow-sm">
                        {temperature.toFixed(1)}
                      </span>
                    </div>
                    <input
                      id="temperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={temperature}
                      onChange={e => setTemperature(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      style={{
                        background: `linear-gradient(to right, rgb(249 115 22) 0%, rgb(249 115 22) ${temperature * 100}%, rgb(229 231 235) ${temperature * 100}%, rgb(229 231 235) 100%)`,
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 px-1">
                      <span>0.0</span>
                      <span>0.5</span>
                      <span>1.0</span>
                    </div>
                  </div>

                  {/* Multi-Agent Toggle */}
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <input
                        id="multiAgent"
                        type="checkbox"
                        checked={multiAgent}
                        onChange={e => {
                          setMultiAgent(e.target.checked);
                          if (e.target.checked) setUseMOA(false);
                        }}
                        disabled={useMOA}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 focus:ring-2 cursor-pointer disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="multiAgent"
                          className="text-xs font-semibold text-black cursor-pointer flex items-center gap-2"
                        >
                          <Users className="w-4 h-4 text-gray-500" />
                          Multi-Agent Processing (CrewAI)
                        </Label>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          Enable collaborative AI agents for complex tasks
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MOA (Mixture of Agents) Toggle */}
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-50/50 rounded-xl border border-orange-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <input
                        id="useMOA"
                        type="checkbox"
                        checked={useMOA}
                        onChange={e => {
                          setUseMOA(e.target.checked);
                          if (e.target.checked) setMultiAgent(false);
                        }}
                        disabled={multiAgent}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 focus:ring-2 cursor-pointer disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="useMOA"
                          className="text-xs font-semibold text-black cursor-pointer flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-orange-500" />
                          Mixture of Agents (MOA)
                        </Label>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          Use multi-layer agent refinement for enhanced quality responses
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={createTask.isPending || executeTask.isPending || streamTask.isPending}
                  >
                    {createTask.isPending || executeTask.isPending || streamTask.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="flex items-center gap-2">
                          <span>Processing</span>
                          <span className="flex gap-1">
                            <span
                              className="w-1 h-1 bg-white rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></span>
                            <span
                              className="w-1 h-1 bg-white rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></span>
                            <span
                              className="w-1 h-1 bg-white rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></span>
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Create & Execute Task
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Task List and Details */}
          <div className="lg:col-span-2">
            <Tabs
              value={activeTab}
              onValueChange={value => {
                setActiveTab(value as "tasks" | "details");
                if (value === "tasks") {
                  setSelectedTask(null);
                }
              }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-white border border-gray-200 shadow-sm">
                  <TabsTrigger
                    value="tasks"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    All Tasks
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    disabled={!selectedTask}
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all disabled:opacity-50"
                  >
                    Task Details
                  </TabsTrigger>
                </TabsList>
                {selectedTask && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTask(null);
                      setActiveTab("tasks");
                    }}
                    className="text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                  >
                    Back to Tasks
                  </Button>
                )}
              </div>

              <TabsContent value="tasks" className="space-y-4">
                {tasksLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Card
                        key={i}
                        className="border-gray-200 bg-white shadow-sm"
                      >
                        <CardHeader className="px-5 sm:px-6 py-5 sm:py-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-3">
                              <div className="flex items-start gap-3.5">
                                <Skeleton className="w-10 h-10 rounded-xl" />
                                <div className="flex-1 min-w-0 space-y-2">
                                  <Skeleton className="h-5 w-3/4" />
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-2/3" />
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3.5 ml-[3.25rem]">
                                <Skeleton className="h-5 w-20 rounded-md" />
                                <Skeleton className="h-5 w-16 rounded-md" />
                                <Skeleton className="h-5 w-24 rounded-md" />
                              </div>
                            </div>
                            <div className="flex items-start gap-2 shrink-0">
                              <Skeleton className="h-6 w-16 rounded-full" />
                              <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : tasks && tasks.length > 0 ? (
                  <div className="space-y-3">
                    {tasks.map(task => (
                      <Card
                        key={task.id}
                        className={`border-gray-200 bg-white hover:border-orange-300 hover:shadow-lg transition-all duration-300 cursor-pointer group relative ${
                          task.status === "processing"
                            ? "ring-2 ring-orange-300 ring-offset-2 animate-pulse"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedTask(task.id);
                          setActiveTab("details");
                        }}
                      >
                        {task.status === "processing" && (
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-orange-100 rounded-full text-xs font-medium text-orange-700">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Processing</span>
                          </div>
                        )}
                        <CardHeader className="px-5 sm:px-6 py-5 sm:py-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-3">
                              <div className="flex items-start gap-3.5">
                                <div className="mt-0.5 p-2 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-all duration-300 shadow-sm group-hover:shadow-md">
                                  {getTaskTypeIcon(task.taskType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    {getStatusIcon(task.status)}
                                    <CardTitle className="text-base sm:text-lg font-semibold text-black group-hover:text-orange-600 transition-colors line-clamp-1">
                                      {task.title}
                                    </CardTitle>
                                  </div>
                                  <CardDescription className="text-sm sm:text-base text-gray-600 line-clamp-2 leading-relaxed">
                                    {task.description}
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3.5 text-xs sm:text-sm text-gray-500 ml-[3.25rem]">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium capitalize">
                                    {task.taskType.replace("_", " ")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="capitalize font-medium">
                                    {task.priority}
                                  </span>
                                  <span className="text-gray-400">
                                    priority
                                  </span>
                                </div>
                                {task.processingTime && (
                                  <div className="flex items-center gap-1.5">
                                    <Timer className="w-3.5 h-3.5" />
                                    <span>
                                      {(task.processingTime / 1000).toFixed(2)}s
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>
                                    {new Date(
                                      task.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 shrink-0">
                              <div className="hidden sm:block pt-1">
                                {getStatusBadge(task.status)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  deleteTask.mutate({ id: task.id });
                                }}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="sm:hidden mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            {getStatusBadge(task.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                deleteTask.mutate({ id: task.id });
                              }}
                              className="h-9 px-4 text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mr-1.5" />
                              Delete
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-gray-200 bg-white shadow-md">
                    <CardContent className="py-20 text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center shadow-inner">
                        <Sparkles className="w-10 h-10 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-bold text-black mb-3">
                        No tasks yet
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                        Create your first NLP task to get started with
                        AI-powered processing
                      </p>
                      <Button
                        onClick={() =>
                          document.getElementById("title")?.focus()
                        }
                        className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Task
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="details">
                {selectedTaskLoading ? (
                  <Card className="border-gray-200 bg-white shadow-lg">
                    <CardHeader className="px-6 sm:px-8 py-6 border-b border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-lg" />
                            <Skeleton className="h-8 w-3/4" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 sm:px-8 py-6 space-y-6">
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-40 w-full rounded-xl" />
                      </div>
                      <div className="pt-6 border-t border-gray-200 space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-2">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : selectedTaskData ? (
                  <div className="space-y-5">
                    <Card className="border-gray-200 bg-white shadow-lg">
                      <CardHeader className="px-6 sm:px-8 py-6 border-b border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                                {getTaskTypeIcon(
                                  (streamingTaskId === selectedTask && streamingTaskData?.taskType) || 
                                  selectedTaskData?.taskType || 
                                  "custom"
                                )}
                              </div>
                              <CardTitle className="text-2xl font-bold text-black break-words">
                                {(streamingTaskId === selectedTask && streamingTaskData?.title) || 
                                 selectedTaskData?.title || 
                                 "Loading..."}
                              </CardTitle>
                            </div>
                            <CardDescription className="text-base text-gray-600 break-words leading-relaxed">
                              {(streamingTaskId === selectedTask && streamingTaskData?.description) || 
                               selectedTaskData?.description || 
                               ""}
                            </CardDescription>
                          </div>
                          <div className="shrink-0">
                            {getStatusBadge(
                              (streamingTaskId === selectedTask && streamingTaskData?.status) || 
                              selectedTaskData?.status || 
                              "pending"
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 sm:px-8 py-6 space-y-6">
                        <div>
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className="p-1.5 rounded-lg bg-gray-100">
                              <FileText className="w-4 h-4 text-gray-600" />
                            </div>
                            <Label className="text-sm font-semibold text-black">
                              Input
                            </Label>
                          </div>
                          <div className="mt-2 p-5 bg-gray-50 rounded-xl border border-gray-200 overflow-x-auto shadow-sm">
                            <pre className="whitespace-pre-wrap text-sm text-gray-800 break-words font-mono leading-relaxed">
                              {(streamingTaskId === selectedTask && streamingTaskData?.inputData) || 
                               selectedTaskData?.inputData || 
                               ""}
                            </pre>
                          </div>
                        </div>

                        {(selectedTaskData.outputData || 
                          (streamingTaskId === selectedTask && streamingTaskData?.outputData)) && (
                          <div>
                            <div className="flex items-center gap-2.5 mb-4">
                              <div className="p-1.5 rounded-lg bg-orange-100">
                                <Sparkles className="w-4 h-4 text-orange-600" />
                              </div>
                              <Label className="text-sm font-semibold text-black">
                                Output
                                {streamingTaskId === selectedTask && (
                                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-orange-600">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Streaming...
                                  </span>
                                )}
                              </Label>
                            </div>
                            <div className="mt-2 p-6 bg-gradient-to-br from-orange-50 via-orange-50/80 to-orange-50/50 rounded-xl border-2 border-orange-200 overflow-x-auto shadow-md">
                              <div className="prose prose-sm max-w-none">
                                <Streamdown>
                                  {streamingTaskId === selectedTask && streamingTaskData?.outputData
                                    ? streamingTaskData.outputData
                                    : selectedTaskData.outputData}
                                </Streamdown>
                                {streamingTaskId === selectedTask && (
                                  <span className="inline-block w-2 h-4 ml-1 bg-orange-500 animate-pulse" />
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedTaskData.errorMessage && (
                          <div>
                            <div className="flex items-center gap-2.5 mb-4">
                              <div className="p-1.5 rounded-lg bg-red-100">
                                <XCircle className="w-4 h-4 text-red-600" />
                              </div>
                              <Label className="text-sm font-semibold text-red-700">
                                Error
                              </Label>
                            </div>
                            <div className="mt-2 p-5 bg-red-50 rounded-xl border-2 border-red-200 text-red-800 text-sm break-words leading-relaxed shadow-sm">
                              {selectedTaskData.errorMessage}
                            </div>
                          </div>
                        )}

                        <div className="pt-6 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-black mb-5">
                            Task Information
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Task Type
                              </Label>
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded bg-gray-100 text-gray-700">
                                  {getTaskTypeIcon(selectedTaskData.taskType)}
                                </div>
                                <p className="text-sm font-medium text-black capitalize">
                                  {selectedTaskData.taskType.replace("_", " ")}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Priority
                              </Label>
                              <p className="text-sm font-medium text-black capitalize">
                                {selectedTaskData.priority}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Created
                              </Label>
                              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                <Calendar className="w-3.5 h-3.5" />
                                <p>
                                  {new Date(
                                    selectedTaskData.createdAt
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {selectedTaskData.completedAt && (
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Completed
                                </Label>
                                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                  <p>
                                    {new Date(
                                      selectedTaskData.completedAt
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}
                            {selectedTaskData.processingTime && (
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Processing Time
                                </Label>
                                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                  <Timer className="w-3.5 h-3.5" />
                                  <p>
                                    {(
                                      selectedTaskData.processingTime / 1000
                                    ).toFixed(2)}
                                    s
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : selectedTask ? (
                  <Card className="border-gray-200 bg-white shadow-md">
                    <CardContent className="py-20 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                      </div>
                      <h3 className="text-lg font-semibold text-black mb-2">
                        Loading task details
                      </h3>
                      <p className="text-sm text-gray-600">
                        Please wait while we fetch the task information...
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

