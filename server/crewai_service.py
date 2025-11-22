#!/usr/bin/env python3
"""
RAJ AI PLATFORM - CrewAI Service
Developed by RAJ SHAH

Python backend for multi-agent NLP processing
"""
import os
import sys
import json
from typing import List, Dict, Any

try:
    from crewai import Agent, Task, Crew, Process, LLM
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"CrewAI not installed: {str(e)}. Please run: pip install -r requirements.txt"
    }), file=sys.stdout)
    sys.exit(1)

# Get Groq API key
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY environment variable is required")

# Set a dummy OPENAI_API_KEY to prevent CrewAI from trying to use OpenAI
# This is needed because CrewAI checks for OpenAI by default
if not os.getenv("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = "dummy-key-to-disable-openai"

def create_groq_llm(temperature: float = 0.7) -> LLM:
    """Create a CrewAI LLM instance configured for Groq"""
    return LLM(
        model="groq/openai/gpt-oss-120b",
        api_key=groq_api_key,
        temperature=temperature,
        max_tokens=8192
    )

def create_researcher_agent(llm: LLM) -> Agent:
    """Create a research-focused agent"""
    return Agent(
        role="Research Analyst",
        goal="Conduct thorough research and gather comprehensive information on given topics",
        backstory="""You are an expert research analyst with years of experience in 
        information gathering and analysis. You excel at finding relevant data, 
        identifying patterns, and synthesizing complex information into clear insights.""",
        llm=llm,
        verbose=False,
        allow_delegation=False
    )

def create_writer_agent(llm: LLM) -> Agent:
    """Create a content writing agent"""
    return Agent(
        role="Content Writer",
        goal="Create engaging, well-structured content based on research and analysis",
        backstory="""You are a professional content writer with expertise in crafting 
        compelling narratives. You transform complex information into clear, engaging 
        content that resonates with the target audience.""",
        llm=llm,
        verbose=False,
        allow_delegation=False
    )

def create_analyst_agent(llm: LLM) -> Agent:
    """Create a data analysis agent"""
    return Agent(
        role="Data Analyst",
        goal="Analyze data, identify trends, and provide actionable insights",
        backstory="""You are a skilled data analyst with expertise in statistical 
        analysis and pattern recognition. You excel at extracting meaningful insights 
        from complex datasets and presenting them clearly.""",
        llm=llm,
        verbose=False,
        allow_delegation=False
    )

def create_summarizer_agent(llm: LLM) -> Agent:
    """Create a summarization agent"""
    return Agent(
        role="Content Summarizer",
        goal="Distill complex information into concise, accurate summaries",
        backstory="""You are an expert at condensing large volumes of information 
        into clear, concise summaries. You identify key points and present them in 
        an easily digestible format without losing critical details.""",
        llm=llm,
        verbose=False,
        allow_delegation=False
    )

def create_coder_agent(llm: LLM) -> Agent:
    """Create a code generation agent"""
    return Agent(
        role="Software Developer",
        goal="Generate clean, efficient, and well-documented code",
        backstory="""You are an experienced software developer with expertise in 
        multiple programming languages. You write clean, maintainable code following 
        best practices and industry standards.""",
        llm=llm,
        verbose=False,
        allow_delegation=False
    )

def execute_nlp_task(task_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute an NLP task using CrewAI agents
    
    Args:
        task_config: Dictionary containing:
            - task_type: Type of task (summarization, analysis, research, etc.)
            - input_data: Input text or data
            - temperature: LLM temperature (0-100, default 70)
            - max_tokens: Maximum tokens (default 8192)
            - agent_config: Optional custom agent configuration
    
    Returns:
        Dictionary with result and metadata
    """
    try:
        task_type = task_config.get("task_type", "custom")
        input_data = task_config.get("input_data", "")
        temperature = task_config.get("temperature", 70) / 100.0
        
        # Initialize LLM
        llm = create_groq_llm(temperature=temperature)
        
        # Select agents based on task type
        if task_type == "summarization":
            agent = create_summarizer_agent(llm)
            task_description = f"Summarize the following content:\n\n{input_data}"
        elif task_type == "analysis":
            agent = create_analyst_agent(llm)
            task_description = f"Analyze the following data and provide insights:\n\n{input_data}"
        elif task_type == "research":
            agent = create_researcher_agent(llm)
            task_description = f"Research and provide comprehensive information about:\n\n{input_data}"
        elif task_type == "content_generation":
            agent = create_writer_agent(llm)
            task_description = f"Create engaging content based on:\n\n{input_data}"
        elif task_type == "code_generation":
            agent = create_coder_agent(llm)
            task_description = f"Generate code for:\n\n{input_data}"
        else:
            # Custom task - use researcher as default
            agent = create_researcher_agent(llm)
            task_description = input_data
        
        # Create task
        task = Task(
            description=task_description,
            expected_output="A comprehensive and well-structured response",
            agent=agent
        )
        
        # Create crew and execute
        crew = Crew(
            agents=[agent],
            tasks=[task],
            process=Process.sequential,
            verbose=False
        )
        
        result = crew.kickoff()
        
        return {
            "success": True,
            "result": str(result),
            "agent_type": agent.role,
            "task_type": task_type
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "task_type": task_config.get("task_type", "unknown")
        }

def execute_multi_agent_task(task_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a complex task using multiple agents in collaboration
    
    Args:
        task_config: Dictionary containing task configuration
    
    Returns:
        Dictionary with result and metadata
    """
    try:
        input_data = task_config.get("input_data", "")
        temperature = task_config.get("temperature", 70) / 100.0
        
        # Initialize LLM
        llm = create_groq_llm(temperature=temperature)
        
        # Create multiple agents
        researcher = create_researcher_agent(llm)
        analyst = create_analyst_agent(llm)
        writer = create_writer_agent(llm)
        
        # Create tasks for each agent
        research_task = Task(
            description=f"Research and gather information about: {input_data}",
            expected_output="Comprehensive research findings with key facts and data",
            agent=researcher
        )
        
        analysis_task = Task(
            description="Analyze the research findings and identify key insights and patterns",
            expected_output="Detailed analysis with actionable insights",
            agent=analyst
        )
        
        writing_task = Task(
            description="Create a well-structured report based on the research and analysis",
            expected_output="Professional report with clear structure and engaging content",
            agent=writer
        )
        
        # Create crew with sequential process
        crew = Crew(
            agents=[researcher, analyst, writer],
            tasks=[research_task, analysis_task, writing_task],
            process=Process.sequential,
            verbose=False
        )
        
        result = crew.kickoff()
        
        return {
            "success": True,
            "result": str(result),
            "agents_used": ["researcher", "analyst", "writer"],
            "task_type": "multi_agent"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "task_type": "multi_agent"
        }

if __name__ == "__main__":
    # CLI interface for testing
    # Only print JSON to stdout (this is what the Node.js process will parse)
    if len(sys.argv) > 1:
        config_json = sys.argv[1]
        config = json.loads(config_json)
        
        if config.get("multi_agent"):
            result = execute_multi_agent_task(config)
        else:
            result = execute_nlp_task(config)
        
        # Print only JSON to stdout (this is what the Node.js process will parse)
        print(json.dumps(result), file=sys.stdout)
        sys.stdout.flush()
    else:
        print(json.dumps({"error": "No configuration provided"}), file=sys.stdout)
        sys.stdout.flush()
