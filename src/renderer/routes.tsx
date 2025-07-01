import { Route } from 'react-router-dom';

import { Router } from 'lib/electron-router-dom';

import { MainApp } from './components/MainApp';

export function AppRoutes() {
  return <Router main={<Route path="/" element={<MainApp />} />} />;
}
