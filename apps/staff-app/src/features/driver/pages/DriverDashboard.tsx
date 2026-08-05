import { Outlet, useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import NotificationPopup from "../components/NotificationPopup";

import "../styles/DriverDashboard.css";

import { useState, useEffect } from "react";

import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTools,
  FaExchangeAlt
} from "react-icons/fa";


import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";


// FIX marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});



function DriverDashboard({ notifications }: any) {

  const location = useLocation();
  const navigate = useNavigate();

  const [showMaintenance, setShowMaintenance] = useState(false);

  const [maintenanceType, setMaintenanceType] = useState("");

  const [maintenanceDescription, setMaintenanceDescription] = useState("");

  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [showHandover, setShowHandover] = useState(false);

const [handoverDriver, setHandoverDriver] = useState("");

const [fuelLevel, setFuelLevel] = useState("");

const [busCondition, setBusCondition] = useState("");

const [handoverNotes, setHandoverNotes] = useState("");

const [handoverMessage, setHandoverMessage] = useState("");
  const [popup, setPopup] = useState<any>(null);
  const [prevCount, setPrevCount] = useState(0);

  useEffect(() => {
    if (notifications && notifications.length > prevCount) {
      const newNotification = notifications.find((n: any) => !n.read);

      if (newNotification) {
        setPopup(newNotification);
        setTimeout(() => setPopup(null), 4000);
      }

      setPrevCount(notifications.length);
    }
  }, [notifications]);
  const submitMaintenance = () => {

  if(!maintenanceType){

    alert("Please select maintenance type");
    return;

  }


  const request = {

    id: Date.now(),

    type: maintenanceType,

    description: maintenanceDescription,

    date: new Date().toLocaleString(),

    status:"Pending"

  };


  const oldRequests = JSON.parse(
    localStorage.getItem("maintenanceRequests") || "[]"
  );


  localStorage.setItem(
    "maintenanceRequests",
    JSON.stringify([
      ...oldRequests,
      request
    ])
  );


  setMaintenanceMessage(
    "Maintenance request submitted ✅"
  );


  setMaintenanceType("");

  setMaintenanceDescription("");

};
const submitHandover = () => {

  if(!handoverDriver || !fuelLevel || !busCondition){

    alert("Please fill required fields");

    return;

  }


  const handover = {

    id: Date.now(),

    bus: "SBTS-BUS-114",

    driver: handoverDriver,

    fuel: fuelLevel,

    condition: busCondition,

    notes: handoverNotes,

    date: new Date().toLocaleString(),

    status:"Completed"

  };


  const oldRecords = JSON.parse(
    localStorage.getItem("handoverRecords") || "[]"
  );


  localStorage.setItem(
    "handoverRecords",
    JSON.stringify([
      ...oldRecords,
      handover
    ])
  );


  setHandoverMessage(
    "Shift handover completed ✅"
  );


  setHandoverDriver("");

  setFuelLevel("");

  setBusCondition("");

  setHandoverNotes("");

};

 return (
  <div className="dashboard">

    <Sidebar notifications={notifications} />

    <div className="main-content">

      <Header notifications={notifications} />

      <NotificationPopup notification={popup} />


      <div className="page-content">

        {location.pathname === "/dashboard" ? (

          <div className="dashboard-grid">


            {/* ================= TODAY ASSIGNMENT ================= */}

            <div className="card assignment-card">

              <h2>Today's Assignment</h2>


              <div className="assignment-grid">

                <div>
                  <span>Bus Number</span>
                  <p>SBTS-BUS-114</p>
                </div>


                <div>
                  <span>Plate Number</span>
                  <p>3-81254 AA</p>
                </div>


                <div>
                  <span>Route</span>
                  <p>Route 12</p>
                </div>


                <div>
                  <span>Shift Time</span>
                  <p>06:30 - 14:30</p>
                </div>


                <div>
                  <span>Trip ID</span>
                  <p>TRP-2025-0917</p>
                </div>


                <div>
                  <span>Bus Model</span>
                  <p>Yutong</p>
                </div>


              </div>

            </div>





            {/* ================= LIVE ROUTE MAP ================= */}


            <div className="card map-card">


              <h2>Live Route Map</h2>


              <div className="map-container">


                <MapContainer

                  center={[9.03,38.74]}

                  zoom={13}

                  style={{
                    height:"100%",
                    width:"100%"
                  }}

                >

                  <TileLayer

                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

                  />


                  <Marker position={[9.03,38.74]}>

                    <Popup>
                      Bus Location
                    </Popup>

                  </Marker>


                </MapContainer>


              </div>


            </div>







            {/* ================= AI + QUICK ACTION ================= */}


            <div className="middle-section">



              {/* AI TRAFFIC */}


              <div className="card traffic-card">


                <div className="traffic-header">


                  <h2>
                    AI TRAFFIC PREDICTION
                  </h2>


                  <span className="ai-badge">
                    AI
                  </span>


                </div>



                <div className="traffic-content">


                  <div className="circle">


                    <span>
                      65%
                    </span>


                    <small>
                      Load
                    </small>


                  </div>



                  <div className="traffic-details">


                    <h3>
                      Medium
                    </h3>


                    <p className="sub">
                      Traffic congestion level
                    </p>


                    <p className="delay">
                      +8 min estimated delay
                    </p>



                    <div className="info-row">

                      <span>
                        Recommended Speed
                      </span>

                      <strong>
                        35-45 km/h
                      </strong>

                    </div>



                    <div className="info-row">

                      <span>
                        AI Confidence
                      </span>

                      <strong>
                        91%
                      </strong>

                    </div>



                    <div className="info-row">

                      <span>
                        Route Improvement
                      </span>

                      <strong>
                        +6 min via Sarbet
                      </strong>

                    </div>


                  </div>


                </div>




                <div className="route-box">

                  <strong>
                    Suggested Alternate Route
                  </strong>


                  <p>
                    Via Sarbet bypass — saves ~6 min
                  </p>


                </div>



              </div>







              {/* ================= QUICK ACTIONS ================= */}


              <div className="card quick-card">


                <h2>
                  Quick Actions
                </h2>



                <div className="quick-actions">



                  <button
                    className="quick-item complete"
                    onClick={() => {

                      const confirmEnd =
                      window.confirm(
                        "Are you sure you want to complete this trip?"
                      );


                      if(confirmEnd){

                        const completedTrip={

                          id:Date.now(),

                          route:"Bole → Piassa",

                          date:new Date()
                          .toLocaleDateString(),

                          status:"Completed"

                        };


                        const oldTrips =
                        JSON.parse(
                          localStorage.getItem(
                            "completedTrips"
                          ) || "[]"
                        );


                        localStorage.setItem(
                          "completedTrips",
                          JSON.stringify([
                            ...oldTrips,
                            completedTrip
                          ])
                        );


                        alert(
                          "Trip completed and saved ✅"
                        );

                      }

                    }}
                  >

                    <FaCheckCircle/>

                    <div>

                      <strong>
                        Complete Trip
                      </strong>

                      <span>
                        Finish assignment
                      </span>

                    </div>


                  </button>






                  <button

                    className="quick-item report"

                    onClick={()=>
                      navigate(
                        "/dashboard/incidents"
                      )
                    }

                  >

                    <FaExclamationTriangle/>


                    <div>

                      <strong>
                        Report Incident
                      </strong>

                      <span>
                        Emergency report
                      </span>

                    </div>


                  </button>







                  <button

                    className="quick-item maintenance"

                    onClick={()=>
                      setShowMaintenance(true)
                    }

                  >

                    <FaTools/>


                    <div>

                      <strong>
                        Request Maintenance
                      </strong>

                      <span>
                        Request bus service
                      </span>

                    </div>


                  </button>







                  <button

                    className="quick-item handover"

                    onClick={()=>
                      setShowHandover(true)
                    }

                  >

                    <FaExchangeAlt/>


                    <div>

                      <strong>
                        Shift Handover
                      </strong>


                      <span>
                        Transfer vehicle
                      </span>


                    </div>


                  </button>




                </div>


              </div>



            </div>








            {/* ================= UPCOMING SHIFT ================= */}



            <div className="card upcoming-card">


              <div className="upcoming-header">


                <h2>
                  Upcoming Shift
                </h2>


                <span className="next-badge">
                  NEXT
                </span>


              </div>



              <div className="upcoming-body">


                <h3 className="route">
                  Route 8
                </h3>


                <p className="time">
                  15:00 - 23:00
                </p>



                <div className="shift-meta">


                  <div>

                    <span>
                      Bus
                    </span>


                    <p>
                      SBTS-BUS-221
                    </p>


                  </div>



                  <div>

                    <span>
                      Driver Type
                    </span>


                    <p>
                      Evening Shift
                    </p>


                  </div>


                </div>



              </div>


            </div>






          </div>


        ) : (

          <Outlet/>

        )}


      </div>


    </div>


  </div>
);


}


export default DriverDashboard;