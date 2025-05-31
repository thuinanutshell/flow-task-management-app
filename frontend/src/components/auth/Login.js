import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../contexts/ApiProvider";
import { AuthContext } from "../../contexts/AuthContext";
import AlertMessage from "./AlertMessage";

const Login = () => {
  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });

  const [alert, setAlert] = useState({
    key: Date.now(),
    open: false,
    message: "",
    severity: "error",
  });

  const navigate = useNavigate();
  const api = useApi();
  const { login, isLoggedIn } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const triggerAlert = (message, severity) => {
    setAlert({ key: Date.now(), open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/login", formData);
      if (response.ok) {
        login(response.body.username);
        triggerAlert(
          "Login successful! Redirecting you to home page",
          "success"
        );
      } else {
        triggerAlert(response.body.message, "error");
      }
    } catch (error) {
      triggerAlert(
        error.message || "Server error, please try again later.",
        "error"
      );
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: 400,
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
            Login
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <Stack spacing={2.5}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="login"
                label="Email or Username"
                name="login"
                value={formData.login}
                onChange={handleChange}
                autoFocus
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />
              
              <TextField
                variant="outlined"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "rgba(0, 0, 0, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />
            </Stack>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{
                mt: 3,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Login
            </Button>
          </Box>
          
          {alert.open && (
            <Box sx={{ width: "100%", mt: 2 }}>
              <AlertMessage
                key={alert.key}
                open={alert.open}
                message={alert.message}
                severity={alert.severity}
                onClose={handleCloseAlert}
              />
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;