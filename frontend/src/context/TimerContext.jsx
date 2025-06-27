import { notifications } from "@mantine/notifications";
import { createContext, useContext, useEffect, useReducer } from "react";
import { taskService } from "../services/tasks";

// 🔊 Web Audio API alarm sound
function playBeep(frequency = 880, duration = 0.5) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(0.1, ctx.currentTime); // Volume

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

// Timer states based on backend task statuses
const TimerStates = {
  IDLE: "idle", // No active timer
  NOT_STARTED: "not_started",
  ACTIVE: "active", // Timer running
  PAUSED: "paused", // Timer paused
  DONE: "done", // Task completed
};

// Initial state
const initialState = {
  activeTask: null,
  timerState: TimerStates.IDLE,
  sessionDuration: 0, // planned session duration in minutes
  currentWorkStart: null, // when current session started (Date object)
  currentPlannedEnd: null, // when current session should end (Date object)
  totalTimeWorked: 0, // total minutes worked across all sessions
  isExpired: false,
  showExpirationModal: false,
};

// Action types
const ActionTypes = {
  SET_ACTIVE_TIMER: "SET_ACTIVE_TIMER",
  UPDATE_TIMER: "UPDATE_TIMER",
  PAUSE_TIMER: "PAUSE_TIMER",
  COMPLETE_TIMER: "COMPLETE_TIMER",
  RESET_TIMER: "RESET_TIMER",
  EXTEND_TIMER: "EXTEND_TIMER",
  HIDE_EXPIRATION_MODAL: "HIDE_EXPIRATION_MODAL",
  SYNC_WITH_BACKEND: "SYNC_WITH_BACKEND",
};

// Reducer function
const timerReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_ACTIVE_TIMER:
      const startTime = new Date(action.payload.current_work_start);
      const endTime = new Date(action.payload.current_planned_end);

      console.log("🔵 SET_ACTIVE_TIMER Debug:", {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        now: new Date().toISOString(),
        durationMinutes: action.payload.duration_minutes,
        isEndTimeValid: endTime > startTime,
        timeUntilEnd: Math.floor((endTime - new Date()) / 1000 / 60),
      });

      return {
        ...state,
        activeTask: action.payload.task,
        timerState: TimerStates.ACTIVE,
        sessionDuration: action.payload.duration_minutes,
        totalTimeWorked: action.payload.total_time_worked,
        currentWorkStart: startTime,
        currentPlannedEnd: endTime,
        isExpired: false,
        showExpirationModal: false,
      };

    case ActionTypes.UPDATE_TIMER: {
      if (state.timerState !== TimerStates.ACTIVE || !state.currentPlannedEnd) {
        return state;
      }

      const now = new Date();
      const plannedEnd = new Date(state.currentPlannedEnd);
      const willExpire = now >= plannedEnd && !state.isExpired;

      return {
        ...state,
        isExpired: willExpire,
        showExpirationModal: willExpire,
      };
    }

    case ActionTypes.PAUSE_TIMER: {
      return {
        ...state,
        timerState: TimerStates.PAUSED,
        totalTimeWorked: action.payload.total_time_worked,
        currentWorkStart: null,
        currentPlannedEnd: null,
        isExpired: false,
        showExpirationModal: false,
      };
    }

    case ActionTypes.COMPLETE_TIMER: {
      return {
        ...state,
        timerState: TimerStates.DONE,
        totalTimeWorked: action.payload.total_time_worked,
        currentWorkStart: null,
        currentPlannedEnd: null,
        isExpired: false,
        showExpirationModal: false,
      };
    }

    case ActionTypes.EXTEND_TIMER: {
      return {
        ...state,
        sessionDuration:
          state.sessionDuration + action.payload.additionalMinutes,
        isExpired: false,
        showExpirationModal: false,
        currentPlannedEnd: new Date(action.payload.newPlannedEnd),
      };
    }

    case ActionTypes.HIDE_EXPIRATION_MODAL: {
      return {
        ...state,
        showExpirationModal: false,
      };
    }

    case ActionTypes.RESET_TIMER: {
      return {
        ...initialState,
      };
    }

    case ActionTypes.SYNC_WITH_BACKEND: {
      const backendData = action.payload;
      return {
        ...state,
        activeTask: backendData.task,
        timerState:
          backendData.status === "active"
            ? TimerStates.ACTIVE
            : backendData.status === "paused"
              ? TimerStates.PAUSED
              : backendData.status === "done"
                ? TimerStates.DONE
                : TimerStates.IDLE,
        totalTimeWorked: backendData.total_time_worked,
        currentWorkStart: backendData.current_work_start
          ? new Date(backendData.current_work_start)
          : null,
        currentPlannedEnd: backendData.current_planned_end
          ? new Date(backendData.current_planned_end)
          : null,
        isExpired: backendData.is_expired || false,
      };
    }

    default:
      return state;
  }
};

// Create context
const TimerContext = createContext();

// Timer Provider Component
export const TimerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(timerReducer, initialState);

  // Timer countdown effect - Check expiration every second
  useEffect(() => {
    let interval = null;

    if (
      state.timerState === TimerStates.ACTIVE &&
      !state.isExpired &&
      state.currentPlannedEnd
    ) {
      interval = setInterval(() => {
        dispatch({ type: ActionTypes.UPDATE_TIMER });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.timerState, state.isExpired, state.currentPlannedEnd]);

  // Handle timer expiration - Play sound when timer expires
  useEffect(() => {
    if (
      state.isExpired &&
      state.timerState === TimerStates.ACTIVE &&
      state.showExpirationModal
    ) {
      playBeep();
    }
  }, [state.isExpired, state.timerState, state.showExpirationModal]);

  // Start timer for a task
  const startTimer = async (task, durationMinutes = null) => {
    try {
      const duration = durationMinutes || task.planned_duration || 25;

      const response = await taskService.startWorkSession(task.id, duration);

      dispatch({
        type: ActionTypes.SET_ACTIVE_TIMER,
        payload: {
          task,
          ...response.data,
        },
      });

      notifications.show({
        title: "Timer Started",
        message: `Working on "${task.name}" for ${duration} minutes`,
        color: "blue",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to start timer",
        color: "red",
      });
      throw error;
    }
  };

  // Pause timer
  const pauseTimer = async () => {
    try {
      if (!state.activeTask) return;

      if (state.timerState !== TimerStates.ACTIVE) {
        throw new Error("No active timer to pause");
      }

      const response = await taskService.pauseTimer(state.activeTask.id);

      // Calculate elapsed time for display
      const elapsedMinutes = getCurrentSessionElapsedMinutes();

      dispatch({
        type: ActionTypes.PAUSE_TIMER,
        payload: response.data,
      });

      notifications.show({
        title: "Timer Paused",
        message: `Break time! You worked for ${elapsedMinutes} minutes`,
        color: "orange",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to pause timer",
        color: "red",
      });
      throw error;
    }
  };

  // Complete task (requires mental state and reflection)
  const completeTask = async (mentalState, reflection) => {
    try {
      if (!state.activeTask) return;

      if (state.timerState !== TimerStates.ACTIVE) {
        throw new Error("No active timer to complete");
      }

      // Validate mandatory fields
      if (!mentalState || !mentalState.trim()) {
        throw new Error("Mental state is required when completing a task");
      }
      if (!reflection || !reflection.trim()) {
        throw new Error("Reflection is required when completing a task");
      }

      const response = await taskService.completeTask(
        state.activeTask.id,
        mentalState,
        reflection,
      );

      dispatch({
        type: ActionTypes.COMPLETE_TIMER,
        payload: response.data,
      });

      notifications.show({
        title: "Task Completed! 🎉",
        message: `Great work on "${state.activeTask.name}"!`,
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to complete task",
        color: "red",
      });
      throw error;
    }
  };

  // Continue/extend timer when expired
  const continueTimer = async (additionalMinutes) => {
    try {
      if (!state.activeTask) return;

      const response = await taskService.extendTimer(
        state.activeTask.id,
        additionalMinutes,
      );

      dispatch({
        type: ActionTypes.EXTEND_TIMER,
        payload: {
          additionalMinutes,
          newPlannedEnd: response.data.current_planned_end,
        },
      });

      notifications.show({
        title: "Timer Extended",
        message: `Added ${additionalMinutes} more minutes to "${state.activeTask.name}"`,
        color: "blue",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to extend timer",
        color: "red",
      });
      throw error;
    }
  };

  // Hide expiration modal
  const hideExpirationModal = () => {
    dispatch({ type: ActionTypes.HIDE_EXPIRATION_MODAL });
  };

  // Reset timer
  const resetTimer = () => {
    dispatch({ type: ActionTypes.RESET_TIMER });
  };

  // Sync with backend (for page refresh recovery)
  const syncWithBackend = async (taskId) => {
    try {
      const response = await taskService.getTimerStatus(taskId);
      dispatch({
        type: ActionTypes.SYNC_WITH_BACKEND,
        payload: response.data,
      });
    } catch (error) {
      console.error("Failed to sync with backend:", error);
    }
  };

  // Helper function to get current session elapsed minutes
  const getCurrentSessionElapsedMinutes = () => {
    if (!state.currentWorkStart || state.timerState !== TimerStates.ACTIVE) {
      return 0;
    }

    const now = new Date();
    const elapsedMs = now - state.currentWorkStart;
    return Math.floor(elapsedMs / (1000 * 60));
  };

  // Helper function to get remaining minutes
  const getCurrentSessionRemainingMinutes = () => {
    if (!state.currentPlannedEnd || state.timerState !== TimerStates.ACTIVE) {
      return 0;
    }

    const now = new Date();
    const endTime = new Date(state.currentPlannedEnd);
    const remainingMs = endTime - now;
    const remainingMinutes = Math.max(0, Math.floor(remainingMs / (1000 * 60)));

    // Debug logging
    if (remainingMinutes === 0 && remainingMs > -60000) {
      // Within 1 minute of expiry
      console.log("⏰ Timer near expiry:", {
        now: now.toISOString(),
        endTime: endTime.toISOString(),
        remainingMs,
        remainingMinutes,
        isExpired: state.isExpired,
      });
    }

    return remainingMinutes;
  };

  // Check for expired timers periodically
  useEffect(() => {
    if (!state.activeTask || state.timerState !== TimerStates.ACTIVE) return;

    const checkExpiration = async () => {
      try {
        const response = await taskService.checkTimerExpired(
          state.activeTask.id,
        );
        if (response.data.is_expired && !state.isExpired) {
          dispatch({ type: ActionTypes.UPDATE_TIMER });
        }
      } catch (error) {
        console.error("Failed to check timer expiration:", error);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkExpiration, 30000);
    return () => clearInterval(interval);
  }, [state.activeTask, state.timerState, state.isExpired]);

  // Context value
  const value = {
    // State
    activeTask: state.activeTask,
    timerState: state.timerState,
    totalTimeWorked: state.totalTimeWorked,
    sessionDuration: state.sessionDuration,
    isExpired: state.isExpired,
    showExpirationModal: state.showExpirationModal,
    isTimerActive: state.timerState === TimerStates.ACTIVE,

    // Computed values
    timeRemaining: getCurrentSessionRemainingMinutes() * 60, // in seconds for backward compatibility
    elapsedTime: getCurrentSessionElapsedMinutes() * 60, // in seconds for backward compatibility

    // Actions
    startTimer,
    pauseTimer,
    completeTask,
    continueTimer,
    hideExpirationModal,
    resetTimer,
    syncWithBackend,

    // Helper functions
    getFormattedTimeRemaining: () => {
      const minutes = getCurrentSessionRemainingMinutes();
      const seconds = Math.floor(
        (getCurrentSessionRemainingMinutes() * 60) % 60,
      );
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    },

    getFormattedElapsedTime: () => {
      const minutes = getCurrentSessionElapsedMinutes();
      const seconds = Math.floor((getCurrentSessionElapsedMinutes() * 60) % 60);
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    },
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
};

// Custom hook to use timer context
export const useTimer = () => {
  const context = useContext(TimerContext);

  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }

  return context;
};

export default TimerContext;
