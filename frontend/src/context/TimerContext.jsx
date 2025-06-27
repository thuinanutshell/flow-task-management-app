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
  gain.gain.setValueAtTime(0.1, ctx.currentTime);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

// Timer states based on backend task statuses
const TimerStates = {
  IDLE: "idle",
  NOT_STARTED: "not_started",
  ACTIVE: "active",
  PAUSED: "paused",
  DONE: "done",
};

// Initial state
const initialState = {
  activeTask: null,
  timerState: TimerStates.IDLE,
  timeRemaining: 0,
  elapsedTime: 0,
  totalTimeWorked: 0,
  sessionDuration: 0,
  currentWorkStart: null,
  currentPlannedEnd: null,
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
function timerReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_ACTIVE_TIMER: {
      return {
        ...state,
        activeTask: action.payload.task,
        timerState: TimerStates.ACTIVE,
        sessionDuration: action.payload.duration_minutes,
        timeRemaining: action.payload.duration_minutes * 60,
        elapsedTime: 0,
        totalTimeWorked: action.payload.total_time_worked,
        currentWorkStart: action.payload.current_work_start,
        currentPlannedEnd: action.payload.current_planned_end,
        isExpired: false,
        showExpirationModal: false,
      };
    }

    case ActionTypes.UPDATE_TIMER: {
      if (state.timerState !== TimerStates.ACTIVE) return state;

      const newElapsed = state.elapsedTime + 1;
      const newRemaining = Math.max(0, state.timeRemaining - 1);
      const willExpire = newRemaining === 0 && !state.isExpired;

      return {
        ...state,
        elapsedTime: newElapsed,
        timeRemaining: newRemaining,
        isExpired: willExpire,
        showExpirationModal: willExpire,
      };
    }

    case ActionTypes.PAUSE_TIMER: {
      return {
        ...state,
        timerState: TimerStates.PAUSED,
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
        timeRemaining: 0,
        isExpired: false,
        showExpirationModal: false,
      };
    }

    case ActionTypes.EXTEND_TIMER: {
      return {
        ...state,
        timeRemaining: action.payload.additionalMinutes * 60,
        sessionDuration:
          state.sessionDuration + action.payload.additionalMinutes,
        isExpired: false,
        showExpirationModal: false,
        currentPlannedEnd: action.payload.newPlannedEnd,
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
        timeRemaining: backendData.remaining_minutes
          ? backendData.remaining_minutes * 60
          : 0,
        elapsedTime: backendData.elapsed_minutes
          ? backendData.elapsed_minutes * 60
          : 0,
        isExpired: backendData.is_expired || false,
      };
    }

    default:
      return state;
  }
}

// Create context
const TimerContext = createContext();

// Timer Provider Component
export const TimerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(timerReducer, initialState);

  useEffect(() => {
    let interval = null;
    if (state.timerState === TimerStates.ACTIVE && !state.isExpired) {
      interval = setInterval(() => {
        dispatch({ type: ActionTypes.UPDATE_TIMER });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.timerState, state.isExpired]);

  useEffect(() => {
    if (
      state.isExpired &&
      state.timerState === TimerStates.ACTIVE &&
      state.showExpirationModal
    ) {
      playBeep();
    }
  }, [state.isExpired, state.timerState, state.showExpirationModal]);

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

  const pauseTimer = async () => {
    try {
      if (!state.activeTask) return;
      if (state.timerState !== TimerStates.ACTIVE)
        throw new Error("No active timer to pause");

      const response = await taskService.pauseTimer(state.activeTask.id);
      dispatch({
        type: ActionTypes.PAUSE_TIMER,
        payload: response.data,
      });

      notifications.show({
        title: "Timer Paused",
        message: `Break time! You worked for ${Math.floor(state.elapsedTime / 60)} minutes`,
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

  const completeTask = async (mentalState, reflection) => {
    try {
      if (!state.activeTask) return;
      if (state.timerState !== TimerStates.ACTIVE)
        throw new Error("No active timer to complete");
      if (!mentalState?.trim()) throw new Error("Mental state is required");
      if (!reflection?.trim()) throw new Error("Reflection is required");

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

  const hideExpirationModal = () => {
    dispatch({ type: ActionTypes.HIDE_EXPIRATION_MODAL });
  };

  const resetTimer = () => {
    dispatch({ type: ActionTypes.RESET_TIMER });
  };

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

    const interval = setInterval(checkExpiration, 30000);
    return () => clearInterval(interval);
  }, [state.activeTask, state.timerState, state.isExpired]);

  const value = {
    activeTask: state.activeTask,
    timerState: state.timerState,
    timeRemaining: state.timeRemaining,
    elapsedTime: state.elapsedTime,
    totalTimeWorked: state.totalTimeWorked,
    sessionDuration: state.sessionDuration,
    isExpired: state.isExpired,
    showExpirationModal: state.showExpirationModal,
    isTimerActive: state.timerState === TimerStates.ACTIVE,
    startTimer,
    pauseTimer,
    completeTask,
    continueTimer,
    hideExpirationModal,
    resetTimer,
    syncWithBackend,
    getFormattedTimeRemaining: () => {
      const minutes = Math.floor(state.timeRemaining / 60);
      const seconds = state.timeRemaining % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    },
    getFormattedElapsedTime: () => {
      const minutes = Math.floor(state.elapsedTime / 60);
      const seconds = state.elapsedTime % 60;
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
