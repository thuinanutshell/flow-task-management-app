import { useEffect, useState } from 'react';
import AddFolder from './AddFolder';
import FolderItem from './FolderItem';
import { getAllFolders } from './folderService';

const FolderList = () => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const data = await getAllFolders();
        setFolders(data);
      } catch (err) {
        setError(err.message || 'Failed to load folders');
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, []);

  const handleFolderAdded = (newFolder) => {
    setFolders(prev => [...prev, newFolder]);
  };

  if (loading) return <div>Loading folders...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <AddFolder onFolderAdded={handleFolderAdded} />
      {folders.length === 0 ? (
        <p>No folders yet. Add one above!</p>
      ) : (
        folders.map(folder => <FolderItem key={folder.id} folder={folder} />)
      )}
    </div>
  );
};

export default FolderList;
