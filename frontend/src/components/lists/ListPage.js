import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useApi } from "../../contexts/ApiProvider";
import TasksContainer from "./TasksContainer";

const ListPage = ({ showAlert }) => {
  const { listId } = useParams();
  const api = useApi();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await api.get(`/tasks?list_id=${listId}`);
      if (response.ok) {
        setTasks(response.body.tasks);
      } else {
        showAlert("Failed to load tasks", "error");
      }
    };
    fetchTasks();
  }, [listId, api, showAlert]);

  return (
    <div>
      <TasksContainer 
        tasks={tasks} 
        listId={listId} 
        onTasksUpdated={setTasks}
        showAlert={showAlert}
      />
    </div>
  );
};

export default ListPage;