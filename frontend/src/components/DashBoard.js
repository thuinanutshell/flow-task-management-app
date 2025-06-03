import { Box, Button, Container, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import AlertMessage from "../components/auth/AlertMessage";
import { useApi } from "../contexts/ApiProvider";
import { AuthContext } from "../contexts/AuthContext";
import AddListDialog from "./lists/AddListDialog";
import ListsContainer from "./lists/ListsContainer";

const Dashboard = () => {
  const { username, isLoggedIn } = useContext(AuthContext);
  const api = useApi();
  const [lists, setLists] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchLists();
    }
  }, [isLoggedIn]);

  const fetchLists = async () => {
    try {
      const response = await api.get("/lists/"); //trailing slash is very important here!
      if (response.ok) {
        setLists(response.body.lists);
      } else {
        showAlert("Failed to fetch lists", "error");
      }
    } catch (error) {
      showAlert("Error fetching lists", "error");
    }
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleAddList = () => {
    setOpenAddDialog(true);
  };

  const handleListAdded = () => {
    fetchLists();
    setOpenAddDialog(false);
    showAlert("List added successfully", "success");
  };

  const handleListDeleted = (deletedId) => {
    setLists(prevLists => prevLists.filter(list => list.id !== deletedId));
    showAlert("List deleted successfully", "success");
  };


  if (!isLoggedIn) {
    return (
      <Container>
        <Typography variant="h5">Please log in to view your dashboard</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Your Lists</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleAddList}
        >
          Add New List
        </Button>
      </Box>

      <ListsContainer 
        lists={lists} 
        onListUpdated={fetchLists}
        onListDeleted={handleListDeleted}
        showAlert={showAlert}
      />

      <AddListDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onListAdded={handleListAdded}
        showAlert={showAlert}
      />

      <AlertMessage
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={handleCloseAlert}
      />
    </Container>
  );
};

export default Dashboard;