import { useState } from "react";
import "../styles/MyTripPage.css";

function MyTripPage({ location }: any) {

  const [passengers, setPassengers] = useState(35);

  const [tripStatus, setTripStatus] = useState("Not Started");

  const [delayReason, setDelayReason] = useState("");
  const [delayMessage, setDelayMessage] = useState("");
  const [delaySubmitted, setDelaySubmitted] = useState(false);


  const totalSeats = 50;


  const occupancyPercentage = Math.round(
    (passengers / totalSeats) * 100
  );


  const getOccupancyStatus = () => {

    if (occupancyPercentage === 0) {
      return "Empty";
    }

    if (occupancyPercentage < 50) {
      return "Low";
    }

    if (occupancyPercentage < 80) {
      return "Medium";
    }

    return "Full";
  };



  // ================= TRIP CONTROL =================

  const startTrip = () => {
    setTripStatus("Running");
  };


  const pauseTrip = () => {
    setTripStatus("Paused");
  };


  const resumeTrip = () => {
    setTripStatus("Running");
  };


  const endTrip = () => {

    const confirmEnd = window.confirm(
      "Are you sure you want to end the trip?"
    );


    if (!confirmEnd) {
      return;
    }


    const completedTrip = {

      id: Date.now(),

      route: "Bole → Piassa",

      date: new Date().toLocaleDateString(),

      startTime: "8:00 AM",

      endTime: new Date().toLocaleTimeString(),

      distance: "12.5 km",

      passengers: passengers,
      

      status: "Completed",
      rating: 5

    };


    const oldTrips = JSON.parse(
      localStorage.getItem("completedTrips") || "[]"
    );


    localStorage.setItem(
      "completedTrips",
      JSON.stringify([
        ...oldTrips,
        completedTrip
      ])
    );


    setTripStatus("Completed");


    alert("Trip completed and saved ✅");

  };



  // ================= DELAY REPORT =================

  const submitDelayReport = () => {

    if (!delayReason) {

      alert(
        "Please select delay reason"
      );

      return;

    }


    setDelaySubmitted(true);


    console.log({

      reason: delayReason,

      message: delayMessage,

      time: new Date().toLocaleString()

    });

  };



  return (

    <div className="my-trip-page">

      <div className="trip-grid">


        {/* CURRENT TRIP */}

        <div className="trip-card">

          <h3>Current Trip</h3>


          <p>
            <strong>Route:</strong> Bole → Piassa
          </p>


          <p>
  <strong>Status:</strong>
</p>

<span
  className={`status ${tripStatus
    .toLowerCase()
    .replace(" ", "-")}`}
>
  {tripStatus}
</span>


          <p>
            <strong>Start Time:</strong> 8:00 AM
          </p>


          <p>
            <strong>Current Location:</strong>
          </p>


          <p>
            Latitude: {location?.latitude || "Waiting..."}
          </p>


          <p>
            Longitude: {location?.longitude || "Waiting..."}
          </p>


        </div>



        {/* TRIP CONTROL */}

        <div className="trip-card">

          <h3>🚍 Trip Control</h3>


          <p>
            <strong>Status:</strong> {tripStatus}
          </p>

<button
  className="start-btn"
  onClick={startTrip}
  disabled={tripStatus !== "Not Started"}
>
  ▶ Start Trip
</button>


<button
  className="pause-btn"
  onClick={pauseTrip}
  disabled={tripStatus !== "Running"}
>
  ⏸ Pause
</button>


<button
  className="resume-btn"
  onClick={resumeTrip}
  disabled={tripStatus !== "Paused"}
>
  ▶ Resume
</button>


<button
  className="end-btn"
  onClick={endTrip}
  disabled={
    tripStatus === "Completed" ||
    tripStatus === "Not Started"
  }
>
  🛑 End Trip
</button>

        </div>
                {/* UPCOMING TRIPS */}

        <div className="trip-card">

          <h3>
            Upcoming Trips
          </h3>


          <p>
            <strong>Trip 1</strong>
          </p>


          <p>
            <strong>Route:</strong> Bole → Megenagna
          </p>


          <p>
            <strong>Date:</strong> 22 July 2026
          </p>


          <p>
            <strong>Time:</strong> 10:30 AM
          </p>


          <p>
            <strong>Status:</strong> Scheduled 🟡
          </p>

        </div>




        {/* ROUTE DETAILS */}

        <div className="trip-card">

          <h3>
            Route Details
          </h3>


          <p>
            <strong>Start Point:</strong> Bole
          </p>


          <p>
            <strong>Destination:</strong> Piassa
          </p>


          <p>
            <strong>Distance:</strong> 12.5 km
          </p>


          <p>
            <strong>Estimated Time:</strong> 25 mins
          </p>


          <p>
            <strong>Stops:</strong> 5 Stops
          </p>

        </div>




        {/* PASSENGER COUNT */}

        <div className="trip-card">

          <h3>
            Passenger Count
          </h3>


          <p>
            <strong>{passengers}</strong> Passengers onboard
          </p>


          <button
            onClick={() =>
              setPassengers(
                Math.min(
                  totalSeats,
                  passengers + 1
                )
              )
            }
          >
            + Add
          </button>


          <button
            style={{
              marginLeft:"10px"
            }}
            onClick={() =>
              setPassengers(
                Math.max(
                  0,
                  passengers - 1
                )
              )
            }
          >
            - Remove
          </button>

        </div>




        {/* BUS OCCUPANCY */}

        <div className="trip-card">

          <h3>
            Bus Occupancy
          </h3>


          <p>
            <strong>{passengers}</strong> / {totalSeats} Seats Filled
          </p>


          <div className="occupancy-bar">

            <div
              className="occupancy-fill"
              style={{
                width:`${occupancyPercentage}%`
              }}
            >
              {occupancyPercentage}%
            </div>

          </div>


          <p>
            <strong>Status:</strong> {getOccupancyStatus()}
          </p>

        </div>




        {/* NAVIGATION */}

        <div className="trip-card">

          <h3>
            Navigation
          </h3>


          <p>
            <strong>From:</strong> Current Location
          </p>


          <p>
            <strong>To:</strong> Piassa
          </p>


          <button
            onClick={() => {

              if(
                location?.latitude &&
                location?.longitude
              ){

                const url =
                `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=Piassa`;

                window.open(
                  url,
                  "_blank"
                );

              }
              else{

                alert(
                  "Waiting for GPS..."
                );

              }

            }}
          >
            Start Navigation
          </button>

        </div>




        {/* STOP LIST */}

        <div className="trip-card">

          <h3>
            Stop List
          </h3>


          {
            [
              "Bole",
              "Atlas",
              "Megenagna",
              "Kazanchis",
              "Piassa"
            ].map(
              (stop,index)=>{

                const currentIndex = 1;


                return (

                  <div
                    key={index}
                    className={
                      index < currentIndex
                      ? "stop completed"
                      :
                      index === currentIndex
                      ? "stop current"
                      :
                      "stop upcoming"
                    }
                  >

                    {stop}

                  </div>

                );

              }
            )
          }

        </div>




        {/* DELAY REPORT */}

        <div className="trip-card">

          <h3>
            ⏱️ Delay Reporting
          </h3>


          <label>
            Delay Reason
          </label>


          <select

            value={delayReason}

            onChange={
              (e)=>
              setDelayReason(
                e.target.value
              )
            }

          >

            <option value="">
              Select reason
            </option>


            <option value="Traffic">
              Heavy Traffic
            </option>


            <option value="Bus Problem">
              Bus Mechanical Problem
            </option>


            <option value="Passenger Issue">
              Passenger Issue
            </option>


            <option value="Weather">
              Bad Weather
            </option>


          </select>



          <textarea

            placeholder="Describe the delay..."

            value={delayMessage}

            onChange={
              (e)=>
              setDelayMessage(
                e.target.value
              )
            }

          />



          <button
            onClick={submitDelayReport}
          >

            Submit Delay Report

          </button>



          {
            delaySubmitted && (

              <p>
                ✅ Delay report submitted
              </p>

            )
          }


        </div>



      </div>

    </div>

  );

}


export default MyTripPage;