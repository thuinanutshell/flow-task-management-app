import { useState } from 'react';
import { createFolder } from './folderService';

import {
    Alert,
    Box,
    Button,
    TextField,
    Typography,
} from '@mui/material';

const FolderForm = ({ onFolderCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const newFolder = await createFolder({ name, description });
      onFolderCreated(newFolder);
      setName('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Failed to create folder');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Create New Folder
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          label="Folder Name"
          variant="outlined"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flexGrow: 1 }}
          size="small"
        />
        <Button type="submit" variant="contained" size="medium">
          Save
        </Button>
      </Box>

      <TextField
        label="Description (optional)"
        variant="outlined"
        multiline
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        size="small"
      />
    </Box>
  );
};

export default FolderForm;
