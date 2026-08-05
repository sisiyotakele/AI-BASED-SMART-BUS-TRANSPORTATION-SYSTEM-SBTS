import "../styles/NotificationPopup.css";

function NotificationPopup({ notification }: any) {
  if (!notification) return null;

  return (
    <div className="popup">

      <strong>{notification.type}</strong>

      <p>{notification.message}</p>

      <span>{notification.time}</span>

    </div>
  );
}

export default NotificationPopup;