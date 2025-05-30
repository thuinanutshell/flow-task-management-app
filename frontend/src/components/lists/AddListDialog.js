import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useState } from "react";
import { useApi } from "../../contexts/ApiProvider";

const AddListDialog = ({ open, onClose, onListAdded, showAlert }) => {
  const [name, setName] = useState("");
  const api = useApi();

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert("List name cannot be empty", "error");
      return;
    }

    try {
      const response = await api.post("/add_list", { name });
      if (response.ok) {
        onListAdded(response.body.list);
        setName("");
        onClose();
      } else {
        showAlert(response.body.message || "Failed to add list", "error");
      }
    } catch (error) {
      showAlert("Error adding list", "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create New List</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="List Name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddListDialog;