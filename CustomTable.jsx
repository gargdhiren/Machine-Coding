// - Fetch table data from API and render rows dynamically using column configuration
// - Show loading state while API request is in progress
// - Show error state with proper fallback if API request fails
// - Show empty state when no rows match current filters/search
// - Implement global search across relevant fields (case-insensitive)
// - Add debounced search to avoid filtering on every keystroke
// - Implement column sorting with cycle: ASC → DESC → RESET
// - Support column-specific filtering like department dropdown/status filter
// - Ensure search + filter + sort work together correctly
// - Keep transformed rows as derived state using useMemo, not separate stored state
// - Avoid unnecessary rerenders and stale state bugs
// - Use proper semantic table structure (table, thead, tbody, tr, td)
// - Keep the table reusable instead of hardcoding for one dataset
// - Be ready to discuss handling large datasets (server-side pagination/sorting/filtering, virtualization)
// - Bonus: add pagination with page numbers and next/previous controls

import {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  useMemo,
  act,
} from 'react';
import './App.css';

const FilterOperationsContext = createContext();

const HeaderRow = ({ columns }) => {
  const { handleFiltering } = useContext(FilterOperationsContext);
  //in case of throttling
  // const throttleRef = useRef(false);
  // const timeoutRef = useRef(null);

  // const throttledFiltering = (column) => {
  //   if (throttleRef.current) return;
  //   if (timeoutRef.current) {
  //     clearTimeout(timeoutRef.current);
  //   }
  //   handleFiltering(column);
  //   throttleRef.current = true;
  //   timeoutRef.current = setTimeout(() => {
  //     throttleRef.current = false;
  //   }, 300);
  // };

  return (
    <thead>
      <tr>
        {columns.map((column) => {
          return (
            <th key={column.name}>
              {column.name}
              {column.isFilter && (
                <button onClick={() => handleFiltering(column)}>Sort</button>
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

const TableRow = ({ user }) => {
  return (
    <tr>
      <td>{user.firstName}</td>
      <td>{user.lastName}</td>
      <td>{user.email}</td>
      <td>{user.age}</td>
      <td>{user.company?.department || '-'}</td>
    </tr>
  );
};

const Table = ({ tableColumns, users }) => {
  return (
    <>
      <table>
        <HeaderRow columns={tableColumns} />
        <tbody>
          {users.map((user) => {
            return <TableRow key={user.id} user={user} />;
          })}
        </tbody>
      </table>
    </>
  );
};

function App() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currDepartment, setCurrDepartment] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [columnFilterConfig, setColumnFilterConfig] = useState({
    key: null,
    type: null,
  });
  const controllerRef = useRef(null);
  const loadingRef = useRef(false);
  const tableColumns = [
    {
      name: 'firstName',
      isFilter: true,
    },
    {
      name: 'lastName',
      isFilter: true,
    },
    {
      name: 'email',
    },
    {
      name: 'age',
      isFilter: true,
    },
    {
      name: 'department',
      isDropDownFilter: true,
    },
  ];

  const departments = useMemo(() => {
    let result = users.map((user) => user.company?.department).filter(Boolean);
    return ['ALL', ...new Set(result)];
  }, [users]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [search]);

  const filteredAndSortedUsers = useMemo(() => {
    const filteredUsers = users.filter((user) => {
      const isSelectedDepartment =
        currDepartment === 'ALL' || user.company?.department === currDepartment;

      const query = debouncedSearch.trim().toLowerCase();
      const isSearchedName =
        query === '' ||
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query);

      return isSearchedName && isSelectedDepartment;
    });

    const currFilterType = columnFilterConfig.type;

    if (currFilterType === null) return filteredUsers;

    const activeColumn = columnFilterConfig.key;

    return filteredUsers.sort((a, b) => {
      if (currFilterType === 'ASCENDING') {
        if (activeColumn === 'firstName' || activeColumn === 'lastName')
          return a[activeColumn].localeCompare(b[activeColumn]);

        return a[activeColumn] - b[activeColumn];
      } else {
        if (activeColumn === 'firstName' || activeColumn === 'lastName')
          return b[activeColumn].localeCompare(a[activeColumn]);

        return b[activeColumn] - a[activeColumn];
      }
    });
  }, [users, debouncedSearch, currDepartment, columnFilterConfig]);

  const handleFiltering = (column) => {
    const columnName = column.name;

    setColumnFilterConfig((prev) => {
      if (prev.key !== columnName) {
        return {
          key: columnName,
          type: 'ASCENDING',
        };
      }

      if (prev.type === 'ASCENDING') {
        return {
          key: columnName,
          type: 'DESCENDING',
        };
      }

      if (prev.type === 'DESCENDING') {
        return {
          key: null,
          type: null,
        };
      }

      return {
        key: null,
        type: 'ASCENDING',
      };
    });
  };

  const fetchUser = async () => {
    if (loadingRef.current) return;

    const controller = new AbortController();
    setLoading(true);
    loadingRef.current = true;
    setError(null);

    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = controller;

    try {
      const res = await fetch('https://dummyjson.com/users', {
        signal: controller.signal,
      });
      const data = await res.json();
      setUsers(data.users);
    } catch (error) {
      if (error && error.name !== 'AbortError') {
        setError(error.message);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    fetchUser();

    return () => {
      controllerRef.current?.abort();
      loadingRef.current = false;
      setError(null);
      setLoading(false);
    };
  }, []);

  return (
    //adding context just to practice and do by prop drilling
    <FilterOperationsContext.Provider value={{ handleFiltering }}>
      <h1>Custom Table</h1>
      {loading ? (
        <h2>Loading...</h2>
      ) : error ? (
        <h2>{'Error: ' + error}</h2>
      ) : (
        <div>
          <input
            placeholder="Search name..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div>
            <label htmlFor="sort">Choose a Department Filter:</label>
            <select
              id="sort"
              name="sort"
              value={currDepartment}
              onChange={(e) => setCurrDepartment(e.target.value)}
            >
              {departments.map((department) => {
                return (
                  <option key={department} value={department}>
                    {department}
                  </option>
                );
              })}
            </select>
          </div>
          {filteredAndSortedUsers.length === 0 ? (
            <h2>No Users Found</h2>
          ) : (
            <Table tableColumns={tableColumns} users={filteredAndSortedUsers} />
          )}
        </div>
      )}
    </FilterOperationsContext.Provider>
  );
}

export default App;
