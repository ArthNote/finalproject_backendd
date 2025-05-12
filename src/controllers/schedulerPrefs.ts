import { Request, Response } from "express";

import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../lib/prisma";

export interface SchedulerModeType {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isBuiltIn: boolean;
  isPreferred: boolean;
  config: {
    considerMood?: boolean;
    defaultDuration: number;
    maxTasksPerDay: number;
    maxHoursPerDay: number;
    energyLevels: {
      highEnergyHours: string[];
      mediumEnergyHours: string[];
      lowEnergyHours: string[];
    };
    priorityLimits: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
    timeSlotInterval: number;
    breakBetweenTasks: number;
    dailySchedule: Array<{
      day: number;
      availableFrom: string;
      availableTo: string;
      blockedIntervals?: Array<{
        start: string;
        end: string;
        recurring?: boolean;
      }>;
    }>;
    optimization: {
      respectFixedAppointments: boolean;
      addBreaks: {
        enabled: boolean;
        lunchBreak?: {
          start: string;
          duration: number;
        };
        shortBreaks?: {
          frequency: number;
          duration: number;
        };
      };
      optimizeFocusTime: boolean;
    };
  };
}

// Built-in scheduling modes that are always available
export const BUILT_IN_MODES: SchedulerModeType[] = [
  {
    id: "default",
    name: "Standard",
    description: "Balanced schedule with regular breaks",
    isDefault: true,
    isBuiltIn: true,
    isPreferred: true,
    config: {
      defaultDuration: 45,
      maxTasksPerDay: 6,
      considerMood: true,
      maxHoursPerDay: 7,
      energyLevels: {
        highEnergyHours: ["08:00", "09:00", "10:00", "14:00"],
        mediumEnergyHours: ["11:00", "15:00", "16:00"],
        lowEnergyHours: ["13:00", "17:00", "18:00"],
      },
      priorityLimits: {
        urgent: 2,
        high: 2,
        medium: 3,
        low: 3,
      },
      timeSlotInterval: 15,
      breakBetweenTasks: 10,
      dailySchedule: [
        {
          day: 1,
          availableFrom: "08:00",
          availableTo: "18:00",
          blockedIntervals: [{ start: "12:00", end: "13:00" }],
        },
        {
          day: 2,
          availableFrom: "08:00",
          availableTo: "18:00",
          blockedIntervals: [{ start: "12:00", end: "13:00" }],
        },
        {
          day: 3,
          availableFrom: "08:00",
          availableTo: "18:00",
          blockedIntervals: [{ start: "12:00", end: "13:00" }],
        },
        {
          day: 4,
          availableFrom: "08:00",
          availableTo: "18:00",
          blockedIntervals: [{ start: "12:00", end: "13:00" }],
        },
        {
          day: 5,
          availableFrom: "08:00",
          availableTo: "18:00",
          blockedIntervals: [{ start: "12:00", end: "13:00" }],
        },
      ],
      optimization: {
        respectFixedAppointments: true,
        addBreaks: {
          enabled: true,
          lunchBreak: {
            start: "12:00",
            duration: 60,
          },
          shortBreaks: {
            frequency: 90,
            duration: 10,
          },
        },
        optimizeFocusTime: true,
      },
    },
  },
  {
    id: "productivity",
    name: "Productivity Focus",
    description: "Optimized for deep work and maximum productivity",
    isDefault: false,
    isBuiltIn: true,
    isPreferred: false,
    config: {
      defaultDuration: 50,
      maxTasksPerDay: 5,
      maxHoursPerDay: 8,
      considerMood: false,
      energyLevels: {
        highEnergyHours: ["08:00", "09:00", "10:00", "14:00", "15:00"],
        mediumEnergyHours: ["11:00", "16:00", "17:00"],
        lowEnergyHours: ["13:00", "18:00"],
      },
      priorityLimits: {
        urgent: 2,
        high: 3,
        medium: 2,
        low: 1,
      },
      timeSlotInterval: 25,
      breakBetweenTasks: 5,
      dailySchedule: [
        {
          day: 1,
          availableFrom: "07:00",
          availableTo: "19:00",
          blockedIntervals: [{ start: "12:30", end: "13:00" }],
        },
        {
          day: 2,
          availableFrom: "07:00",
          availableTo: "19:00",
          blockedIntervals: [{ start: "12:30", end: "13:00" }],
        },
        {
          day: 3,
          availableFrom: "07:00",
          availableTo: "19:00",
          blockedIntervals: [{ start: "12:30", end: "13:00" }],
        },
        {
          day: 4,
          availableFrom: "07:00",
          availableTo: "19:00",
          blockedIntervals: [{ start: "12:30", end: "13:00" }],
        },
        {
          day: 5,
          availableFrom: "07:00",
          availableTo: "19:00",
          blockedIntervals: [{ start: "12:30", end: "13:00" }],
        },
      ],
      optimization: {
        respectFixedAppointments: true,
        addBreaks: {
          enabled: true,
          lunchBreak: {
            start: "12:30",
            duration: 30,
          },
          shortBreaks: {
            frequency: 120,
            duration: 5,
          },
        },
        optimizeFocusTime: true,
      },
    },
  },
  {
    id: "wellbeing",
    name: "Wellbeing Focus",
    description: "Balanced workday with plenty of breaks",
    isDefault: false,
    isBuiltIn: true,
    isPreferred: false,

    config: {
      defaultDuration: 30,
      maxTasksPerDay: 5,
      considerMood: true,
      maxHoursPerDay: 6,
      energyLevels: {
        highEnergyHours: ["09:00", "10:00", "15:00"],
        mediumEnergyHours: ["11:00", "14:00", "16:00"],
        lowEnergyHours: ["08:00", "12:00", "17:00"],
      },
      priorityLimits: {
        urgent: 1,
        high: 2,
        medium: 3,
        low: 3,
      },
      timeSlotInterval: 15,
      breakBetweenTasks: 15,
      dailySchedule: [
        {
          day: 1,
          availableFrom: "09:00",
          availableTo: "17:00",
          blockedIntervals: [{ start: "12:00", end: "13:30" }],
        },
        {
          day: 2,
          availableFrom: "09:00",
          availableTo: "17:00",
          blockedIntervals: [{ start: "12:00", end: "13:30" }],
        },
        {
          day: 3,
          availableFrom: "09:00",
          availableTo: "17:00",
          blockedIntervals: [{ start: "12:00", end: "13:30" }],
        },
        {
          day: 4,
          availableFrom: "09:00",
          availableTo: "17:00",
          blockedIntervals: [{ start: "12:00", end: "13:30" }],
        },
        {
          day: 5,
          availableFrom: "09:00",
          availableTo: "17:00",
          blockedIntervals: [{ start: "12:00", end: "13:30" }],
        },
      ],
      optimization: {
        respectFixedAppointments: true,
        addBreaks: {
          enabled: true,
          lunchBreak: {
            start: "12:00",
            duration: 90,
          },
          shortBreaks: {
            frequency: 60,
            duration: 15,
          },
        },
        optimizeFocusTime: false,
      },
    },
  },
];

// Get all scheduler modes (built-in + user's custom)
export async function getSchedulerModes(req: Request, res: Response) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: headers,
  });
  if (!session) {
    return res.status(401).send({
      message: "Unauthorized",
      success: false,
    });
  }

  try {
    // Get custom modes from database
    const userModes = await db.schedulerMode.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    // Transform database models to our expected type
    const customModes: SchedulerModeType[] = userModes.map((mode) => ({
      id: mode.id,
      name: mode.name,
      description: mode.description || "",
      isDefault: false,
      isBuiltIn: false,
      isPreferred: mode.isPreferred,
      config: mode.config as SchedulerModeType["config"],
    }));

    // Combine built-in and custom modes
    const allModes = [...BUILT_IN_MODES, ...customModes];

    return res.status(200).json({
      success: true,
      modes: allModes,
    });
  } catch (error) {
    console.error("Error fetching scheduler modes:", error);
    return res.status(500).json({
      message: "Error fetching scheduler modes",
      success: false,
      error: error,
    });
  }
}

// Create a new scheduler mode
export async function createSchedulerMode(req: Request, res: Response) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: headers,
  });
  if (!session) {
    return res.status(401).send({
      message: "Unauthorized",
      success: false,
    });
  }

  try {
    const { name, description, config, isPreferred } = req.body;

    if (!name || !config) {
      return res.status(400).json({
        message: "Name and configuration are required",
        success: false,
      });
    }

    // Create the new mode
    const newMode = await db.schedulerMode.create({
      data: {
        name,
        description,
        config,
        isPreferred: isPreferred || false,
        userId: session.user.id,
      },
    });

    // If this mode is preferred, unmark other modes
    if (isPreferred) {
      await db.schedulerMode.updateMany({
        where: {
          userId: session.user.id,
          id: { not: newMode.id },
        },
        data: { isPreferred: false },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Scheduler mode created successfully",
      mode: {
        id: newMode.id,
        name: newMode.name,
        description: newMode.description || "",
        isDefault: false,
        isBuiltIn: false,
        isPreferred: newMode.isPreferred,
        config: newMode.config as SchedulerModeType["config"],
      },
    });
  } catch (error) {
    console.error("Error creating scheduler mode:", error);
    return res.status(500).json({
      message: "Error creating scheduler mode",
      success: false,
      error: error,
    });
  }
}

// Update an existing scheduler mode
export async function updateSchedulerMode(req: Request, res: Response) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: headers,
  });
  if (!session) {
    return res.status(401).send({
      message: "Unauthorized",
      success: false,
    });
  }

  try {
    const { id } = req.params;
    const { name, description, config, isPreferred } = req.body;

    // Check if the mode exists and belongs to the user
    const existingMode = await db.schedulerMode.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingMode) {
      return res.status(404).json({
        message: "Scheduler mode not found or access denied",
        success: false,
      });
    }

    // Update the mode
    const updatedMode = await db.schedulerMode.update({
      where: { id },
      data: {
        name: name || existingMode.name,
        description:
          description !== undefined ? description : existingMode.description,
        config: config || existingMode.config,
        isPreferred:
          isPreferred !== undefined ? isPreferred : existingMode.isPreferred,
      },
    });

    // If this mode is now preferred, unmark other modes
    if (isPreferred) {
      await db.schedulerMode.updateMany({
        where: {
          userId: session.user.id,
          id: { not: id },
        },
        data: { isPreferred: false },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Scheduler mode updated successfully",
      mode: {
        id: updatedMode.id,
        name: updatedMode.name,
        description: updatedMode.description || "",
        isDefault: false,
        isBuiltIn: false,
        isPreferred: updatedMode.isPreferred,
        config: updatedMode.config as SchedulerModeType["config"],
      },
    });
  } catch (error) {
    console.error("Error updating scheduler mode:", error);
    return res.status(500).json({
      message: "Error updating scheduler mode",
      success: false,
      error: error,
    });
  }
}

// Delete a scheduler mode
export async function deleteSchedulerMode(req: Request, res: Response) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: headers,
  });
  if (!session) {
    return res.status(401).send({
      message: "Unauthorized",
      success: false,
    });
  }

  try {
    const { id } = req.params;

    // Check if the mode exists and belongs to the user
    const existingMode = await db.schedulerMode.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingMode) {
      return res.status(404).json({
        message: "Scheduler mode not found or access denied",
        success: false,
      });
    }

    // Delete the mode
    await db.schedulerMode.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Scheduler mode deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting scheduler mode:", error);
    return res.status(500).json({
      message: "Error deleting scheduler mode",
      success: false,
      error: error,
    });
  }
}

// Set a scheduler mode as the preferred one
export async function setPreferredMode(req: Request, res: Response) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: headers,
  });
  if (!session) {
    return res.status(401).send({
      message: "Unauthorized",
      success: false,
    });
  }

  try {
    const { id } = req.params;
    const { isBuiltIn } = req.body;

    console.log(`Setting preferred mode: ${id}, isBuiltIn: ${isBuiltIn}`);

    // First, unmark all existing preferred modes
    await db.schedulerMode.updateMany({
      where: {
        userId: session.user.id,
      },
      data: { isPreferred: false },
    });

    // If it's not a built-in mode, update it to be preferred
    if (!isBuiltIn) {
      // Check if the mode exists and belongs to the user
      const existingMode = await db.schedulerMode.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      });

      if (!existingMode) {
        return res.status(404).json({
          message: "Scheduler mode not found or access denied",
          success: false,
        });
      }

      // Update the mode to be preferred
      await db.schedulerMode.update({
        where: { id },
        data: { isPreferred: true },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Preferred scheduler mode set successfully",
      preferredModeId: id,
    });
  } catch (error) {
    console.error("Error setting preferred mode:", error);
    return res.status(500).json({
      message: "Error setting preferred mode",
      success: false,
      error: error,
    });
  }
}

// Get the current preferred scheduler mode
export async function getPreferredMode(req: Request, res: Response) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: headers,
  });
  if (!session) {
    return res.status(401).send({
      message: "Unauthorized",
      success: false,
    });
  }

  try {
    // First check custom modes
    const preferredCustomMode = await db.schedulerMode.findFirst({
      where: {
        userId: session.user.id,
        isPreferred: true,
      },
    });

    if (preferredCustomMode) {
      return res.status(200).json({
        success: true,
        mode: {
          id: preferredCustomMode.id,
          name: preferredCustomMode.name,
          description: preferredCustomMode.description || "",
          isDefault: false,
          isBuiltIn: false,
          isPreferred: true,
          config: preferredCustomMode.config as SchedulerModeType["config"],
        },
      });
    }

    // If no custom preferred mode, return the default built-in mode
    const defaultMode = BUILT_IN_MODES.find((mode) => mode.isDefault);

    return res.status(200).json({
      success: true,
      mode: defaultMode,
    });
  } catch (error) {
    console.error("Error fetching preferred mode:", error);
    return res.status(500).json({
      message: "Error fetching preferred mode",
      success: false,
      error: error,
    });
  }
}
