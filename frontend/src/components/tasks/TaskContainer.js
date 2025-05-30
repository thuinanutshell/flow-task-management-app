import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import AddTaskDialog from "./AddTaskDialog";
import TaskCard from "./TaskCard";

const TasksContainer = ({ tasks, listId, onTasksUpdated, showAlert }) => {
  const [openAddDialog, setOpenAddDialog] = useState(false);

  const handleTaskAdded = (newTask) => {
    onTasksUpdated([...tasks, newTask]);
  };

  const handleTaskUpdated = (updatedTask) => {
    onTasksUpdated(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleTaskDeleted = (taskId) => {
    onTasksUpdated(tasks.filter(t => t.id !== taskId));
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={() => setOpenAddDialog(true)}
        >
          Add Task
        </Button>
      </Box>

      {tasks.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No tasks yet. Add your first task!
          </Typography>
        </Box>
      ) : (
        tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            showAlert={showAlert}
          />
        ))
      )}

      <AddTaskDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        listId={listId}
        onTaskAdded={handleTaskAdded}
        showAlert={showAlert}
      />
    </Box>
  );
};

export default TasksContainer;