"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTasks = generateTasks;
const genai_1 = require("@google/genai");
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const SYSTEM_PROMPT = `To generate tasks in JSON format for a Kanban-like dashboard, follow these instructions:
- ANALYZE THE REQUEST THOROUGHLY to determine appropriate task breakdown:
  - For simple activities (e.g., "take out trash", "get groceries"), create a single comprehensive task
  - For complex activities (e.g., "prepare for exam", "plan vacation", "home renovation"), create a MINIMUM of 5-10 tasks covering all necessary steps
  - For complex projects, aim for 10+ tasks with detailed breakdowns
  - For multi-stage projects, create hierarchical tasks with parent-child relationships
  
- IMPORTANT: Be GENEROUS with task creation for complex scenarios - users prefer comprehensive task lists over minimal ones
  - Educational tasks (exam prep): Create at least 7-10 distinct study/review sessions
  - Project planning: Break down into at least 8-12 actionable steps
  - Home improvement: Include all preparation, execution, and cleanup tasks (10+ tasks minimum)
  - Travel planning: Break into research, booking, preparation, and trip tasks (at least 10 tasks)
  - For any complex project, ensure at least 10 tasks are created to cover all aspects, you can create as much tasks as you see fit if needed more

- Consider these aspects when generating tasks:
  - Timeline: Break down long-term projects across multiple days/weeks
  - Dependencies: Identify tasks that must be completed before others can begin
  - Specialization: Separate tasks requiring different skills or resources
  - Complexity: Divide complex activities into manageable chunks

- IMPORTANT: Tasks will be optimally scheduled by the algorithm based on:
  - Priority level matching with energy levels (high: high energy hours, medium: medium energy hours, low: low energy hours)
  - Available working hours (9:00-17:00 on weekdays)
  - Personal constraints (e.g., blocked meeting times)
  - Task duration and required breaks between tasks
  - Daily limits on number of tasks and total hours
  
- Tasks should be actionable, clear, and well-structured
- Break down high-level tasks into smaller subtasks where appropriate
- ALWAYS include ALL fields in the response schema even if null or empty
- IMPORTANT: Always include the "date" field in every task:
  - Set an appropriate date based on the task deadline
  - Use null if no specific date is mentioned

- The projectId field should be null always
  
- the default value for resources and tags and assignedTo is an empty array
- the default value for order is 0
- the default value for startTime and endTime is null always
- If the user mentions a date (e.g., "tomorrow", "next week") for an event or deadline:
  - Use the current date provided in the prompt as reference
  - Properly schedule tasks with appropriate deadlines and priorities
  - For test preparation, create a progression of AT LEAST 5-7 study tasks leading up to the test date
  - If a date is mentioned set the status field to "todo" and the scheduled field to true else set the status to "unscheduled" and scheduled to false
  - if user doesnt mention a date set the date to null and scheduled to false
  - if user mentions a date, set the priority to 'urgent' and if user doesn't mention a date set the priority to how you see fit based on the task (high, medium, low)
  
- Only include relevant resources (tutorials, articles, videos) when helpful
- Format response as a direct JSON array of task objects (NOT wrapped in a "tasks" object)
- Analyze any provided context to generate appropriate tasks`;
function generateTasks(prompt, date) {
    return __awaiter(this, void 0, void 0, function* () {
        const today = new Date(date);
        const formattedToday = today.toISOString().split("T")[0];
        const enhancedPrompt = `Today is ${formattedToday}. ${prompt}`;
        const response = yield ai.models.generateContent({
            model: "gemini-2.0-flash-lite",
            contents: enhancedPrompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.ARRAY,
                    items: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            title: {
                                type: genai_1.Type.STRING,
                                description: "Brief description of the task",
                                nullable: false,
                            },
                            projectId: {
                                type: genai_1.Type.STRING,
                                description: "Project ID for task association (optional)",
                                nullable: true,
                            },
                            description: {
                                type: genai_1.Type.STRING,
                                description: "Detailed task description",
                                nullable: false,
                            },
                            priority: {
                                type: genai_1.Type.STRING,
                                description: "Task priority level (high, medium, low, urgent)",
                                nullable: false,
                            },
                            category: {
                                type: genai_1.Type.STRING,
                                description: "Category or project name",
                                nullable: false,
                            },
                            date: {
                                type: genai_1.Type.STRING,
                                description: "Due date for the task in YYYY-MM-DD format",
                                nullable: true,
                            },
                            startTime: {
                                type: genai_1.Type.STRING,
                                description: "Start time for the task in YYYY-MM-DD-HH:mm format",
                                nullable: true,
                            },
                            endTime: {
                                type: genai_1.Type.STRING,
                                description: "End time for the task in YYYY-MM-DD-HH:mm format",
                                nullable: true,
                            },
                            duration: {
                                type: genai_1.Type.NUMBER,
                                description: "Task duration in minutes",
                                nullable: true,
                            },
                            completed: {
                                type: genai_1.Type.BOOLEAN,
                                description: "Whether the task is completed",
                                nullable: false,
                            },
                            scheduled: {
                                type: genai_1.Type.BOOLEAN,
                                description: "Whether the task is scheduled",
                                nullable: false,
                            },
                            parentId: {
                                type: genai_1.Type.STRING,
                                description: "Optional parent task ID for sub-tasks",
                                nullable: true,
                            },
                            resources: {
                                type: genai_1.Type.ARRAY,
                                description: "Array of resources related to the task",
                                items: {
                                    type: genai_1.Type.OBJECT,
                                    properties: {
                                        id: {
                                            type: genai_1.Type.STRING,
                                            description: "Unique identifier for the resource",
                                            nullable: false,
                                        },
                                        name: {
                                            type: genai_1.Type.STRING,
                                            description: "Name of the resource",
                                            nullable: false,
                                        },
                                        type: {
                                            type: genai_1.Type.STRING,
                                            description: "Type of the resource",
                                            nullable: false,
                                        },
                                        category: {
                                            type: genai_1.Type.STRING,
                                            description: "Category of resource (file, link, note)",
                                            nullable: false,
                                        },
                                        url: {
                                            type: genai_1.Type.STRING,
                                            description: "URL of the resource (optional)",
                                            nullable: true,
                                        },
                                    },
                                    required: ["id", "name", "type", "category"],
                                },
                                nullable: false,
                            },
                            tags: {
                                type: genai_1.Type.ARRAY,
                                description: "Optional array of tag strings",
                                items: {
                                    type: genai_1.Type.STRING,
                                },
                                nullable: true,
                            },
                            status: {
                                type: genai_1.Type.STRING,
                                description: "Status for kanban view (optional)",
                                nullable: true,
                            },
                            order: {
                                type: genai_1.Type.NUMBER,
                                description: "Order for kanban sorting (optional)",
                                nullable: false,
                            },
                            assignedTo: {
                                type: genai_1.Type.ARRAY,
                                description: "Array of assigned users",
                                nullable: true,
                                items: {
                                    type: genai_1.Type.OBJECT,
                                    properties: {
                                        id: {
                                            type: genai_1.Type.STRING,
                                            description: "User ID",
                                            nullable: false,
                                        },
                                        name: {
                                            type: genai_1.Type.STRING,
                                            description: "User name",
                                            nullable: false,
                                        },
                                        profilePic: {
                                            type: genai_1.Type.STRING,
                                            description: "User profile picture URL",
                                            nullable: true,
                                        },
                                    },
                                    required: ["id", "name"],
                                },
                            },
                        },
                        required: [
                            "title",
                            "description",
                            "priority",
                            "category",
                            "date",
                            "duration",
                            "completed",
                            "scheduled",
                            "parentId",
                            "resources",
                            "tags",
                            "status",
                            "order",
                            "assignedTo",
                        ],
                    },
                },
            },
        });
        return response.text;
    });
}
