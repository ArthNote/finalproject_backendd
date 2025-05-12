"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_1 = require("better-auth/node");
const auth_1 = require("./lib/auth");
const users_1 = __importDefault(require("./routes/users"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const friends_1 = __importDefault(require("./routes/friends"));
const chats_1 = __importDefault(require("./routes/chats"));
const messages_1 = __importDefault(require("./routes/messages"));
const projects_1 = __importDefault(require("./routes/projects"));
const teams_1 = __importDefault(require("./routes/teams"));
const schedule_1 = __importDefault(require("./routes/schedule"));
const goals_1 = __importDefault(require("./routes/goals"));
const mood_1 = __importDefault(require("./routes/mood"));
const pomodoro_1 = __importDefault(require("./routes/pomodoro"));
const schedulerPrefs_1 = __importDefault(require("./routes/schedulerPrefs"));
const contact_1 = __importDefault(require("./routes/contact"));
const socket_1 = require("./lib/socket");
dotenv_1.default.config();
const PORT = process.env.PORT || 8080;
socket_1.app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_WEB_URL
        : "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
        "Accept",
        "Accept-Version",
        "Content-Length",
        "Content-MD5",
        "Date",
        "X-Api-Version",
        "Set-Cookie",
    ],
}));
socket_1.app.options("*", (0, cors_1.default)());
socket_1.app.all("/api/auth/*", (0, node_1.toNodeHandler)(auth_1.auth));
socket_1.app.use(express_1.default.json({ limit: "50mb" }));
socket_1.app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
socket_1.app.use(express_1.default.json());
socket_1.app.options("*", (req, res) => {
    res.status(200).end();
});
socket_1.app.use("/api/users", users_1.default);
socket_1.app.use("/api/subscriptions", subscriptions_1.default);
socket_1.app.use("/api/tasks", tasks_1.default);
socket_1.app.use("/api/friends", friends_1.default);
socket_1.app.use("/api/chats", chats_1.default);
socket_1.app.use("/api/messages", messages_1.default);
socket_1.app.use("/api/projects", projects_1.default);
socket_1.app.use("/api/teams", teams_1.default);
socket_1.app.use("/api/schedule", schedule_1.default);
socket_1.app.use("/api/goals", goals_1.default);
socket_1.app.use("/api/mood", mood_1.default);
socket_1.app.use("/api/pomodoro", pomodoro_1.default);
socket_1.app.use("/api/scheduler-prefs", schedulerPrefs_1.default);
socket_1.app.use("/api/contact", contact_1.default);
socket_1.server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
