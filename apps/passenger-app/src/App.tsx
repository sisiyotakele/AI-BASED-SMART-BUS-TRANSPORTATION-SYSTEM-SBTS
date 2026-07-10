import { LoginPage } from './features/auth/LoginPage';
import { LiveMapView } from './features/trip-tracking/LiveMapView';
import { NotificationList } from './features/notifications/NotificationList';
import { RouteSearchPage } from './features/route-search/RouteSearchPage';

export function App() {
  return [LoginPage(), RouteSearchPage(), LiveMapView(), NotificationList()].join(' | ');
}