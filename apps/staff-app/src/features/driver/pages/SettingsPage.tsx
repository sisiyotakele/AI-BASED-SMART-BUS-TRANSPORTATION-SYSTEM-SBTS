import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SettingsPage.css";

import {
  FaUser,
  FaBell,
  FaMapMarkerAlt,
  FaBus,
  FaMoon,
  FaSignOutAlt,
  FaSave
} from "react-icons/fa";


const SettingsPage = () => {

const navigate = useNavigate();
const [saved, setSaved] = useState(false);
const [account, setAccount] = useState({
  name: "Biruk Awel",
  phone: "+251900000000",
  email: "driver@sbfms.com",
});
useEffect(() => {

  const savedSettings = localStorage.getItem("driverSettings");

  const savedTheme = localStorage.getItem("theme");


 if(savedSettings){

    const data = JSON.parse(savedSettings);

    if(data.account){
      setAccount(data.account);
    }
    setNotifications(data.notifications);

    setPreferences({

      ...data.preferences,

      darkMode: savedTheme === "dark"

    });

  }


  if(savedTheme === "dark"){

    document.body.classList.add("dark");

  }


}, []);
const saveSettings = () => {

 const data = {
    account,
    notifications,
    preferences
};

  localStorage.setItem(
    "driverSettings",
    JSON.stringify(data)
  );


  // Save GPS status separately
  localStorage.setItem(
    "gpsEnabled",
    preferences.gps.toString()
  );


  setSaved(true);


  setTimeout(() => {

    setSaved(false);

  },3000);

};
const logout = () => {

  // remove saved data
  localStorage.removeItem("driverSettings");
  localStorage.removeItem("notifications");
  localStorage.removeItem("incidents");
  localStorage.removeItem("theme");

  // remove dark mode
  document.body.classList.remove("dark");

  // go back to login
  navigate("/");

};
  const [notifications, setNotifications] = useState({
    trip: true,
    traffic: true,
    incident: false,
    emergency: true,
  });


  const [preferences, setPreferences] = useState({
    gps: true,
    autoStart: false,
    stopAlerts: true,
    darkMode: false,
  });


  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
const togglePreference = (key: keyof typeof preferences) => {

  setPreferences(prev => {

    const updated = {
      ...prev,
      [key]: !prev[key]
    };


    // Dark mode control
    if(key === "darkMode"){

      if(updated.darkMode){

        document.body.classList.add("dark");

      } else {

        document.body.classList.remove("dark");

      }

      localStorage.setItem(
        "theme",
        updated.darkMode ? "dark" : "light"
      );

    }


    return updated;

  });

};

  


  return (

    <div className="settings-container">


      {/* HEADER */}
      <div className="settings-header">

        <h1>Settings</h1>

        <p>
          Manage your driver account and application preferences
        </p>

      </div>


{saved && (

<div className="settings-success">

Settings saved successfully ✅

</div>

)}
      {/* PROFILE SETTINGS */}
      <div className="settings-card">

        <h2>
          <FaUser />
          Account Information
        </h2>


        <div className="settings-grid">


          <div className="settings-field">
            <label>Full Name</label>
            <input
 value={account.name}
 onChange={(e)=>setAccount({
   ...account,
   name:e.target.value
 })}
/>
          </div>


          <div className="settings-field">
            <label>Phone Number</label>
            <input
 value={account.phone}
 onChange={(e)=>setAccount({
   ...account,
   phone:e.target.value
 })}
/>
          </div>


          <div className="settings-field">
            <label>Email</label>
            <input
 value={account.email}
 onChange={(e)=>setAccount({
   ...account,
   email:e.target.value
 })}
/>
          </div>


        </div>


        <button 
className="settings-save-btn"
onClick={saveSettings}
>
          <FaSave />
          Save Changes
        </button>


      </div>





      {/* NOTIFICATIONS */}
      <div className="settings-card">


        <h2>
          <FaBell />
          Notification Preferences
        </h2>



        <SettingToggle
          title="Trip Updates"
          description="Receive assignment and route updates"
          active={notifications.trip}
          onClick={() => toggleNotification("trip")}
        />


        <SettingToggle
          title="Traffic Alerts"
          description="AI traffic prediction warnings"
          active={notifications.traffic}
          onClick={() => toggleNotification("traffic")}
        />


        <SettingToggle
          title="Incident Alerts"
          description="Emergency and incident notifications"
          active={notifications.incident}
          onClick={() => toggleNotification("incident")}
        />


        <SettingToggle
          title="Emergency Messages"
          description="Important safety messages"
          active={notifications.emergency}
          onClick={() => toggleNotification("emergency")}
        />


      </div>





      {/* GPS */}
      <div className="settings-card">


        <h2>
          <FaMapMarkerAlt />
          GPS & Location
        </h2>



        <SettingToggle
          title="Real-Time GPS Tracking"
          description="Allows SBFMS to monitor your current route"
          active={preferences.gps}
          onClick={() => togglePreference("gps")}
        />


      </div>





      {/* TRIP PREFERENCES */}
      <div className="settings-card">


        <h2>
          <FaBus />
          Trip Preferences
        </h2>



        <SettingToggle
          title="Auto Start Trip"
          description="Automatically start assigned trips"
          active={preferences.autoStart}
          onClick={() => togglePreference("autoStart")}
        />


        <SettingToggle
          title="Stop Alerts"
          description="Receive upcoming stop notifications"
          active={preferences.stopAlerts}
          onClick={() => togglePreference("stopAlerts")}
        />


      </div>





      {/* APPEARANCE */}
      <div className="settings-card">


        <h2>
          <FaMoon />
          Appearance
        </h2>



        <SettingToggle
          title="Dark Mode"
          description="Change application appearance"
          active={preferences.darkMode}
          onClick={() => togglePreference("darkMode")}
        />


      </div>





      {/* LOGOUT */}
      <div className="settings-card">


        <button 
  className="settings-logout-btn"
  onClick={logout}
>

          <FaSignOutAlt />

          Logout

        </button>


      </div>



    </div>

  );

};





type ToggleProps = {

  title:string;
  description:string;
  active:boolean;
  onClick:()=>void;

};



const SettingToggle = ({
  title,
  description,
  active,
  onClick
}:ToggleProps)=>{


return (

<div className="settings-row">


<div>

<h3>{title}</h3>

<p>{description}</p>

</div>


<div
className={`settings-switch ${active ? "active":""}`}
onClick={onClick}
>


<div className="settings-circle"></div>


</div>


</div>

);


};



export default SettingsPage;

