/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dashboard } from './components/Dashboard';
import { DataProvider, useData } from './context/DataContext';

function AppContent() {
  const { isLoaded } = useData();

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-mono text-slate-400">Loading portfolio data from secure storage...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
