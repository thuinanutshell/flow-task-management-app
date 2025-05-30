import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useApi } from "../../contexts/ApiProvider";

const EditListDialog = ({ open, onClose, list, onListUpdated, showAlert }) => {
  const [name, setName] = useState("");
  const api = useApi();

  useEffect(() => {
    if (list) {
      setName(list.name);
    }
  }, [list]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert("List name cannot be empty", "error");
      return;
    }

    try {
      const response = await api.patch("/update_list_name", {
        id: list.id,
        name
      });
      if (response.ok) {
        onListUpdated();
      } else {
        showAlert(response.body.message || "Failed to update list", "error");
      }
    } catch (error) {
      showAlert("Error updating list", "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit List</DialogTitle>
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
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditListDialog;