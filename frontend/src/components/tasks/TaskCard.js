import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Checkbox,
    IconButton,
    Typography
} from "@mui/material";
import { useApi } from "../../contexts/ApiProvider";

const TaskCard = ({ task, onTaskUpdated, onTaskDeleted, showAlert }) => {
  const api = useApi();

  const handleComplete = async () => {
    try {
      const response = await api.patch(`/tasks/${task.id}/update`, {
        is_completed: !task.is_completed
      });
      
      if (response.ok) {
        onTaskUpdated(response.body.task);
      } else {
        showAlert("Failed to update task", "error");
      }
    } catch (error) {
      showAlert("Error updating task", "error");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/tasks/${task.id}/delete`);
      if (response.ok) {
        onTaskDeleted(task.id);
      } else {
        showAlert("Failed to delete task", "error");
      }
    } catch (error) {
      showAlert("Error deleting task", "error");
    }
  };

  return (
    <Box sx={{
      p: 1,
      mb: 1,
      borderRadius: 1,
      backgroundColor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center'
    }}>
      <Checkbox
        size="small"
        checked={task.is_completed}
        onChange={handleComplete}
      />
      <Typography
        variant="body2"
        sx={{
          flexGrow: 1,
          textDecoration: task.is_completed ? 'line-through' : 'none',
          color: task.is_completed ? 'text.secondary' : 'text.primary'
        }}
      >
        {task.name}
      </Typography>
      <IconButton size="small" onClick={handleDelete}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default TaskCard;