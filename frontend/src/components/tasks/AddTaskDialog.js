import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useState } from "react";
import { useApi } from "../../contexts/ApiProvider";

const AddTaskDialog = ({ open, onClose, listId, onTaskAdded, showAlert }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const api = useApi();

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert("Task name cannot be empty", "error");
      return;
    }

    try {
      const response = await api.post("/add_task", {
        name,
        description,
        list_id: listId
      });
      
      if (response.ok) {
        onTaskAdded(response.body.task);
        setName("");
        setDescription("");
        onClose();
      } else {
        showAlert(response.body.message || "Failed to add task", "error");
      }
    } catch (error) {
      showAlert("Error adding task", "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Task</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Task Name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          variant="outlined"
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} color="primary">
          Add Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTaskDialog;