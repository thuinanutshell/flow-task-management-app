import { Box, Button } from "@mui/material";
import AddListDialog from "./AddListDialog";
import ListCard from './ListCard';

const ListsContainer = ({ lists, onListUpdated, onListAdded, onListDeleted, showAlert }) => {
  return (
    <Box sx={{
      display: 'flex',
      gap: 3,
      p: 3,
      overflowX: 'auto',
      minHeight: 'calc(100vh - 64px)'
    }}>
      {lists.map((list) => (
        <ListCard
          key={list.id}
          list={list}
          onListUpdated={(updatedList) => onListUpdated(updatedList)}
          onListDeleted={() => onListDeleted(list.id)}
          showAlert={showAlert}
        />
      ))}
      
      {/* Add List Dialog Trigger */}
      <Box sx={{ minWidth: 300 }}>
        <AddListDialog 
          onListAdded={onListAdded}
          showAlert={showAlert}
          trigger={(openDialog) => (
            <Button
              fullWidth
              variant="outlined"
              sx={{
                height: '100%',
                minHeight: 200,
                borderStyle: 'dashed'
              }}
              onClick={openDialog}
            >
              + Add another list
            </Button>
          )}
        />
      </Box>
    </Box>
  );
};

export default ListsContainer;