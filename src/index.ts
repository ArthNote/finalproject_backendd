import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import usersRouter from "./routes/users";
import subscriptionsRouter from "./routes/subscriptions";
import tasksRouter from "./routes/tasks";
import friendsRouter from "./routes/friends";
import chatsRouter from "./routes/chats";
import messagesRouter from "./routes/messages";
import projectsRouter from "./routes/projects";
import teamsRouter from "./routes/teams";
import scheduleRouter from "./routes/schedule";
import goalsRouter from "./routes/goals";
import moodRouter from "./routes/mood";
import pomodoroRouter from "./routes/pomodoro";
import schedulerPrefsRouter from "./routes/schedulerPrefs";
import contactRouter from "./routes/contact";

import { app, server as socketServer } from "./lib/socket";

dotenv.config();

const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
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
  })
);

app.options("*", cors());

app.all("/api/auth/*", toNodeHandler(auth));


app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json());

app.options("*", (req, res) => {
  res.status(200).end();
});

app.use("/api/users", usersRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/chats", chatsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/mood", moodRouter);
app.use("/api/pomodoro", pomodoroRouter);
app.use("/api/scheduler-prefs", schedulerPrefsRouter);
app.use("/api/contact", contactRouter);

socketServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
