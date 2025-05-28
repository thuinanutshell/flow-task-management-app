import { Card, CardContent, Typography } from '@mui/material';

const FolderItem = ({ folder }) => {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" component="div">
          {folder.name}
        </Typography>
        {folder.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {folder.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default FolderItem;
