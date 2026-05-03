//requirements
/*
- recursive tree rendering
- expand collapse folder
- create new file
- create new folder
- rename file
- rename folder
- delete file
- delete folder
*/

import { useState, createContext, useContext, Children } from 'react';
import './App.css';
import json from './assets/data.json';

const FileOperations = createContext();

const Folder = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const { handleDelete, handleAdd, handleRename } = useContext(FileOperations);

  const handleExpanded = () => {
    setExpanded((prev) => !prev);
  };

  const onAddClicked = (id, isFolder) => {
    setExpanded(true);
    const name = prompt('Enter new file name');
    if (!name?.trim()) return;
    handleAdd(id, {
      id: Date.now(),
      name: name,
      isFolder: isFolder,
    });
  };

  const onRenameClicked = (id) => {
    const name = prompt('Give new name');
    if (!name?.trim()) return;
    handleRename(id, name);
  };

  return (
    <div className="list-item">
      <span>
        {item.isFolder && (
          <button onClick={handleExpanded}>{!expanded ? '+' : '-'}</button>
        )}
      </span>
      <button onClick={() => handleDelete(item.id)}>
        {item.isFolder ? 'Delete Folder' : 'Delete File'}
      </button>
      <span>
        {item.isFolder && (
          <button
            onClick={() => {
              onAddClicked(item.id, false);
            }}
          >
            Add File
          </button>
        )}
      </span>
      <span>
        {item.isFolder && (
          <button
            onClick={() => {
              onAddClicked(item.id, true);
            }}
          >
            Add Folder
          </button>
        )}
      </span>
      <button onClick={() => onRenameClicked(item.id)}>
        {item.isFolder ? 'Rename Folder' : 'Rename File'}
      </button>
      <div>{item.name}</div>
      {expanded &&
        item.isFolder &&
        item?.children.map((child) => {
          return <Folder key={child.id} item={child} />;
        })}
    </div>
  );
};

const List = ({ data }) => {
  return (
    <div>
      {data.map((item) => (
        <Folder key={item.id} item={item} />
      ))}
    </div>
  );
};

function App() {
  const [data, setData] = useState(json);

  const deleteNode = (tree, id) => {
    return tree
      .filter((node) => node.id !== id)
      .map((node) => {
        if (node.isFolder && node.children) {
          return {
            ...node,
            children: deleteNode(node.children, id),
          };
        }
        return node;
      });
  };

  const addNode = (tree, id, newNode) => {
    return tree.map((node) => {
      if (node.id == id && node.isFolder) {
        return {
          ...node,
          children: [...(node.children || []), newNode],
        };
      }

      if (node.isFolder && node.children) {
        return {
          ...node,
          children: addNode(node.children, id, newNode),
        };
      }

      return node;
    });
  };

  const renameNode = (tree, id, newName) => {
    return tree.map((node) => {
      if (node.id == id) {
        return {
          ...node,
          name: newName,
        };
      }

      if (node.isFolder && node.children) {
        return {
          ...node,
          children: renameNode(node.children, id, newName),
        };
      }

      return node;
    });
  };

  const handleDelete = (id) => {
    setData((prev) => deleteNode(prev, id));
  };

  const handleAdd = (id, item) => {
    setData((prev) => addNode(prev, id, item));
  };

  const handleRename = (id, newName) => {
    setData((prev) => renameNode(prev, id, newName));
  };

  return (
    <>
      <h1>File and Folder structure</h1>
      <FileOperations.Provider
        value={{ handleDelete, handleAdd, handleRename }}
      >
        <List data={data} />
      </FileOperations.Provider>
    </>
  );
}

export default App;
