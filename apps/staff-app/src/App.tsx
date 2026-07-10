import { AppLayout } from './shared/AppLayout';
import { LoginPage } from './shared/LoginPage';

export function App() {
  return [LoginPage(), AppLayout('driver')].join(' | ');
}