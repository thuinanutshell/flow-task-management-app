import { Box, Button, Grid } from "@mui/material";
import AddListDialog from "./AddListDialog";
import ListCard from './ListCard';

const ListsContainer = ({ lists, onListUpdated, onListAdded, onListDeleted, showAlert }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {lists.map((list) => (
          <Grid item xs={12} sm={6} md={4} lg={4} key={list.id}>
            <Box sx={{ height: '100%' }}>
              <ListCard
                list={list}
                onListUpdated={(updatedList) => onListUpdated(updatedList)}
                onListDeleted={() => onListDeleted(list.id)}
                showAlert={showAlert}
              />
            </Box>
          </Grid>
        ))}
        
        {/* Add List Dialog Trigger */}
        <Grid item xs={12} sm={6} md={4} lg={4}>
          <Box sx={{ height: '100%', minHeight: 300 }}>
            <AddListDialog 
              onListAdded={onListAdded}
              showAlert={showAlert}
              trigger={(openDialog) => (
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    height: '100%',
                    minHeight: 300,
                    borderStyle: 'dashed',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    '&:hover': {
                      borderStyle: 'dashed',
                      borderColor: 'primary.dark',
                      backgroundColor: 'primary.50'
                    }
                  }}
                  onClick={openDialog}
                >
                  + Add another list
                </Button>
              )}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ListsContainer;