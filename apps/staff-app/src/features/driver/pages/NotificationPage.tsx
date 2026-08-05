import { FaBell, FaRoute, FaCarCrash, FaExclamationTriangle, FaBullhorn } from "react-icons/fa";
import "../styles/Notification.css";

function NotificationPage({ notifications, setNotifications }: any) {


  const savedSettings = localStorage.getItem("driverSettings");

  const settings = savedSettings 
    ? JSON.parse(savedSettings)
    : null;


  const filteredNotifications = settings
    ? notifications.filter((n:any)=>{

        if(n.type === "Route Updates")
          return settings.notifications.trip;


        if(n.type === "Traffic Alerts")
          return settings.notifications.traffic;


        if(n.type === "Emergency Messages")
          return settings.notifications.emergency;


        if(n.type === "Dispatch Communications")
          return settings.notifications.incident;


        return true;

      })
    : notifications;


  const markAsRead = (id: number) => {

    setNotifications((prev: any[]) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, read: true }
          : n
      )
    );

  };



  const getIcon = (type: string) => {

    switch(type) {

      case "Route Updates":
        return <FaRoute />;

      case "Traffic Alerts":
        return <FaCarCrash />;

      case "Emergency Messages":
        return <FaExclamationTriangle />;

      case "Dispatch Communications":
        return <FaBullhorn />;

      default:
        return <FaBell />;

    }

  };



  return (

    <div className="notification-container">


      <div className="notification-card">


        <h3>
          Notifications
        </h3>



        {
          notifications.length === 0 && (

            <p className="empty">
              No notifications yet
            </p>

          )
        }




        {
          filteredNotifications.map((n:any)=>(


            <div

              key={n.id}

              className={`notification-item ${
                n.read ? "read" : "unread"
              }`}

              onClick={() => markAsRead(n.id)}

            >



              <div className="icon">

                {getIcon(n.type)}

              </div>





              <div className="content">


                <span className="notification-type">

                  {n.type || "General"}

                </span>


                <p>
                  {n.message}
                </p>


                <span>
                  {n.time}
                </span>



              </div>





              {
                !n.read && (

                  <div className="dot"/>

                )
              }



            </div>



          ))
        }




      </div>


    </div>

  );

}


export default NotificationPage;