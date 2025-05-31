import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import DashBoard from "./components/DashBoard";
import Navbar from "./components/Navbar";
import NotFoundPage from "./components/NotFoundPage";
import ApiProvider from "./contexts/ApiProvider";
import AuthProvider from "./contexts/AuthContext";

const App = () => {
  return (
    <Router>
      <ApiProvider>
        <AuthProvider>
            <Navbar />
            <Routes>
              <Route
                path="/"
                element={<DashBoard />}
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </AuthProvider>
      </ApiProvider>
    </Router>
  );
};

export default App;
