import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE } from "@/const";
import {
  ArrowRight,
  Bot,
  Sparkles,
  Zap,
  Brain,
  Code,
  FileText,
  BarChart3,
  Languages,
  Wand2,
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="container py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-base sm:text-xl font-bold text-black truncate">
              {APP_TITLE}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link href="/dashboard">
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm px-3 sm:px-4"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-12 sm:py-16 lg:py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <Badge className="mb-4 sm:mb-6 bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 text-xs sm:text-sm">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by CrewAI & Groq
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-black leading-tight px-2">
            Advanced NLP Processing
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            with Multi-Agent AI
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Harness the power of collaborative AI agents to transform your text
            into actionable insights. Real-time streaming, advanced analysis,
            and production-ready results.
          </p>
          <div className="flex gap-3 sm:gap-4 justify-center px-2">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white text-base sm:text-lg px-6 sm:px-8"
              >
                Start Processing
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">
            Powerful NLP Capabilities
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            Multiple specialized AI agents working together to deliver
            exceptional results
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4">
          <Card className="border-gray-200 hover:shadow-xl transition-shadow bg-white">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Text Summarization</CardTitle>
              <CardDescription>
                Condense lengthy documents into clear, concise summaries while
                preserving key information
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-gray-200 hover:shadow-xl transition-shadow bg-white">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Data Analysis</CardTitle>
              <CardDescription>
                Extract insights, identify patterns, and generate actionable
                recommendations from your data
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-gray-200 hover:shadow-xl transition-shadow bg-white">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Research & Analysis</CardTitle>
              <CardDescription>
                Comprehensive research with multiple agents collaborating to
                gather and synthesize information
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-gray-200 hover:shadow-xl transition-shadow bg-white">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center mb-4">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Content Generation</CardTitle>
              <CardDescription>
                Create engaging, well-structured content tailored to your
                specific requirements
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-gray-200 hover:shadow-xl transition-shadow bg-white">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Code Generation</CardTitle>
              <CardDescription>
                Generate clean, production-ready code with best practices and
                comprehensive documentation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-gray-200 hover:shadow-xl transition-shadow bg-white">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center mb-4">
                <Languages className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Translation</CardTitle>
              <CardDescription>
                Accurate translations preserving context, tone, and cultural
                nuances across languages
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Live Processing Demo */}
      <section className="container py-12 sm:py-16 px-4">
        <Card className="border-gray-200 bg-white">
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-orange-500 flex items-center justify-center">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl">
              Real-Time Streaming
            </CardTitle>
            <CardDescription className="text-sm sm:text-base lg:text-lg">
              Watch AI agents process your requests in real-time with live
              progress updates
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="bg-gray-900 rounded-lg p-4 sm:p-6 font-mono text-xs sm:text-sm text-green-400 overflow-x-auto">
              <div className="flex items-center gap-2 mb-3 sm:mb-4 whitespace-nowrap">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 animate-pulse shrink-0"></div>
                <span>Processing with CrewAI agents...</span>
              </div>
              <div className="space-y-1 sm:space-y-2 text-gray-300">
                <div className="break-words">
                  → Researcher agent analyzing input...
                </div>
                <div className="break-words">
                  → Analyst agent identifying patterns...
                </div>
                <div className="break-words">
                  → Writer agent generating output...
                </div>
                <div className="text-green-400 break-words">
                  ✓ Task completed successfully
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container py-12 sm:py-16 lg:py-20 text-center px-4">
        <div className="max-w-3xl mx-auto bg-orange-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-orange-50">
            Join thousands of users leveraging AI-powered NLP processing for
            their projects
          </p>
          <Link href="/dashboard" className="inline-block w-full sm:w-auto">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto bg-white text-orange-600 hover:bg-orange-50 text-base sm:text-lg px-6 sm:px-8"
            >
              Get Started Now
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 sm:py-8">
        <div className="container text-center text-gray-600 px-4">
          <p className="text-sm sm:text-base">
            © 2025 {APP_TITLE}. Developed by RAJ SHAH. Powered by CrewAI and Groq.
          </p>
        </div>
      </footer>
    </div>
  );
}
