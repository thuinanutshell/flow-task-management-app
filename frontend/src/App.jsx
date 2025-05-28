import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import LogInForm from './components/auth/LogIn';
import SignUpForm from './components/auth/SignUp';
import FolderList from './components/folder/FolderList';
import Navbar from './components/NavBar';
import { AuthProvider } from './context/authContext';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<LogInForm />} />
            <Route path="/register" element={<SignUpForm />} />
            <Route 
              path="/folders" 
              element={
                <ProtectedRoute>
                  <FolderList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <FolderList />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;