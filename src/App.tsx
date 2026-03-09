/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dashboard } from './components/Dashboard';
import { DataProvider } from './context/DataContext';

export default function App() {
  return (
    <DataProvider>
      <Dashboard />
    </DataProvider>
  );
}
