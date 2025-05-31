import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  TextField,
  Typography
} from "@mui/material";
import { useState } from "react";
import { useApi } from "../../contexts/ApiProvider";
import TaskCard from "../tasks/TaskCard";
import EditListDialog from "./EditListDialog";

const ListCard = ({ list, onListUpdated, onListDeleted, showAlert }) => {
  const api = useApi();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  const handleAddTask = async () => {
    if (!newTaskName.trim()) {
      showAlert("Task name cannot be empty", "error");
      return;
    }

    try {
      const response = await api.post("/add_task", {
        name: newTaskName,
        list_id: list.id
      });

      if (response.ok) {
        onListUpdated({
          ...list,
          tasks: [...list.tasks, response.body.task]
        });
        setNewTaskName("");
        setIsAddingTask(false);
      } else {
        showAlert(response.body.message || "Failed to add task", "error");
      }
    } catch (error) {
      showAlert("Error adding task", "error");
    }
  };

  const handleTaskUpdated = (updatedTask) => {
    onListUpdated({
      ...list,
      tasks: list.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    });
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/delete_list/${list.id}`);
      if (response.ok) {
        onListDeleted(); // This should trigger the parent's deletion handler
        showAlert("List deleted successfully", "success");
      } else {
        showAlert(response.body.message || "Failed to delete list", "error");
      }
    } catch (error) {
      showAlert("Error deleting list", "error");
    }
  };

  return (
    <Card sx={{ 
      minWidth: 300, 
      maxWidth: 300,
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {list.name}
          </Typography>
          <Box>
            <IconButton size="small" onClick={() => setOpenEditDialog(true)}>
              <EditIcon fontSize="small" />
            </IconButton>
            {/* Fixed: Now calls handleDelete instead of onListDeleted */}
            <IconButton size="small" onClick={handleDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Tasks list */}
        <Box sx={{ 
          minHeight: 100,
          maxHeight: 400,
          overflowY: 'auto',
          mb: 2
        }}>
          {list.tasks?.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={(taskId) => {
                onListUpdated({
                  ...list,
                  tasks: list.tasks.filter(t => t.id !== taskId)
                });
              }}
              showAlert={showAlert}
            />
          ))}
        </Box>

        {/* Add task input */}
        {isAddingTask ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              autoFocus
              placeholder="Task name"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <Button 
              size="small" 
              variant="contained" 
              onClick={handleAddTask}
            >
              Add
            </Button>
          </Box>
        ) : (
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => setIsAddingTask(true)}
            sx={{ justifyContent: 'flex-start' }}
          >
            Add task
          </Button>
        )}
      </CardContent>

      <EditListDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        list={list}
        onListUpdated={onListUpdated}
        showAlert={showAlert}
      />
    </Card>
  );
};

export default ListCard;