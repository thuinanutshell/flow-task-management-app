import { createContext, useContext, useEffect, useReducer } from "react";
import authService from "../services/auth";

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const ActionTypes = {
  SET_LOADING: "SET_LOADING",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  CLEAR_ERROR: "CLEAR_ERROR",
  UPDATE_USER: "UPDATE_USER",
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case ActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app load
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const isAuth = authService.isAuthenticated();
        const user = authService.getCurrentUser();

        if (isAuth && user) {
          dispatch({
            type: ActionTypes.LOGIN_SUCCESS,
            payload: { user },
          });
        } else {
          dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        dispatch({
          type: ActionTypes.LOGIN_FAILURE,
          payload: "Failed to initialize authentication",
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      const response = await authService.login(credentials);

      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: {
          user: response.data.user,
        },
      });

      return response;
    } catch (error) {
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: error.message || "Login failed",
      });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      const response = await authService.register(userData);

      // Your backend returns token and user data on successful registration
      if (response.success && response.data.token) {
        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: {
            user: response.data.user,
          },
        });
      } else {
        // Registration successful but no auto-login
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }

      return response;
    } catch (error) {
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: error.message || "Registration failed",
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Try to logout from server first
      await authService.logoutFromServer();
    } catch (error) {
      console.error("Server logout failed:", error);
      authService.logout();
    } finally {
      // Always clear local state
      dispatch({ type: ActionTypes.LOGOUT });
    }
  };

  // Google OAuth login
  const googleLogin = async (idToken) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      const response = await authService.googleLogin(idToken);

      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: {
          user: response.data.user,
        },
      });

      return response;
    } catch (error) {
      dispatch({
        type: ActionTypes.LOGIN_FAILURE,
        payload: error.message || "Google login failed",
      });
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    const response = await authService.updateProfile(profileData);

    dispatch({
      type: ActionTypes.UPDATE_USER,
      payload: response.data,
    });

    return response;
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  // Update user profile
  const updateUser = (userData) => {
    dispatch({
      type: ActionTypes.UPDATE_USER,
      payload: userData,
    });
  };

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    googleLogin,
    clearError,
    updateUser,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

// HOC for protecting routes
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      window.location.href = "/login";
      return null;
    }

    return <Component {...props} />;
  };
};

export default AuthContext;
