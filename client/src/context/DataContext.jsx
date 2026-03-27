import { createContext, useContext } from 'react';

const DataContext = createContext(null);

export function DataProvider({ children, value }) {
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
