import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useContext } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const Navbar = () => {
  const { username, isLoggedIn, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar position="static" sx={{ mb: 2 }}>
      <Toolbar
        style={{ justifyContent: "space-between", position: "relative" }}
      >
        <Typography variant="h6">Task Management App</Typography>
        {!isMobile && isLoggedIn && (
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <Typography variant="subtitle1">Welcome, {username}</Typography>
          </Box>
        )}
        <Box>
          {isLoggedIn ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ExitToAppIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
