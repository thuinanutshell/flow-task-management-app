import { Box, Button, TextField } from '@mui/material';
import { useState } from 'react';
import { createFolder } from './folderService';

const AddFolder = ({ onFolderAdded }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    try {
      const newFolder = await createFolder({ name });
      onFolderAdded(newFolder);
      setName('');
    } catch (err) {
      setError(err.message || 'Failed to create folder');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3, display: 'flex', gap: 2 }}>
      <TextField
        label="New Folder Name"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        size="small"
        error={!!error}
        helperText={error}
      />
      <Button type="submit" variant="contained" size="medium">
        Add
      </Button>
    </Box>
  );
};

export default AddFolder;
