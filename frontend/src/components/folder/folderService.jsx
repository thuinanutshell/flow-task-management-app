const API_BASE = 'http://127.0.0.1:5000/folder';

export const createFolder = async (folderData) => {
  const response = await fetch(`${API_BASE}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(folderData),
  });
  
  if (!response.ok) {
    throw new Error(await response.text());
  }
  
  return await response.json();
};

export const getAllFolders = async () => {
  const response = await fetch(`${API_BASE}/all`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch folders');
  }
  
  return await response.json();
};

export const getFolder = async (folderId) => {
  const response = await fetch(`${API_BASE}/read/${folderId}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Folder not found');
  }
  
  return await response.json();
};

export const updateFolder = async (folderId, updates) => {
  const response = await fetch(`${API_BASE}/update/${folderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update folder');
  }
  
  return await response.json();
};

export const deleteFolder = async (folderId) => {
  const response = await fetch(`${API_BASE}/delete/${folderId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete folder');
  }
  
  return await response.json();
};