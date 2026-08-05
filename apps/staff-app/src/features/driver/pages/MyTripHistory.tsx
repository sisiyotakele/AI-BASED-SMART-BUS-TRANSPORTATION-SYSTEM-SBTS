import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useEffect, useState } from "react";
import "../styles/MyTripHistory.css";
function MyTripHistory() {
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [incidentReports, setIncidentReports] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const filteredTrips = completedTrips.filter((trip:any)=>
    trip.route
    .toLowerCase()
    .includes(
      search.toLowerCase()
    )
  );
  // LOAD COMPLETED TRIPS
  useEffect(()=>{
    const loadTrips = ()=>{
      const savedTrips =
        JSON.parse(
          localStorage.getItem("completedTrips") || "[]"
        );
      setCompletedTrips(savedTrips);
    };
    loadTrips();
    window.addEventListener(
      "storage",
      loadTrips
    );
    return ()=>{
      window.removeEventListener(
        "storage",
        loadTrips
      );
    };
  },[]);
  // LOAD INCIDENTS
  useEffect(()=>{
    const loadIncidents = ()=>{
      const savedIncidents =
        JSON.parse(
          localStorage.getItem("incidents") || "[]"
        );
      setIncidentReports(savedIncidents);
    };
    loadIncidents();
    window.addEventListener(
      "storage",
      loadIncidents
    );
    return ()=>{
      window.removeEventListener(
        "storage",
        loadIncidents
      );
    };
  },[]);
  // HELPERS
  const getDistance = (trip:any)=>{
    return Number(
      String(trip.distance)
      .replace(" km","")
    ) || 0;
  };
  const totalDistance =
    completedTrips.reduce(
      (total,trip)=>
        total + getDistance(trip),
      0
    );
  const totalPassengers =
    completedTrips.reduce(
      (total,trip)=>
        total + (trip.passengers || 0),
      0
    );
  const monthlyDistanceProgress =
    Math.min(
      (totalDistance / 500) * 100,
      100
    );
  // STATISTICS
  const weeklyStatistics = {
    totalTrips:
      completedTrips.length,
    distance:
      totalDistance.toFixed(1) + " km",
    passengers:
      totalPassengers.toLocaleString(),
    rating:
      "No rating yet ⭐"
  };
  const monthlyStatistics = {
    totalTrips:
      completedTrips.length,
    distance:
      totalDistance.toFixed(1) + " km",
    passengers:
      totalPassengers.toLocaleString(),
    workingDays:
      new Set(
        completedTrips.map(
          trip=>trip.date
        )
      ).size
  };
  const distanceDriven = {
    today:
      completedTrips
      .filter(
        trip =>
          trip.date ===
          new Date()
          .toLocaleDateString()
      )
      .reduce(
        (total,trip)=>
          total + getDistance(trip),
        0
      )
      .toFixed(1)
      + " km",
    weekly:
      totalDistance.toFixed(1)
      + " km",
    monthly:
      totalDistance.toFixed(1)
      + " km",
    total:
      totalDistance.toFixed(1)
      + " km"
  };
  const passengerTotals = {
    today:
      completedTrips
      .filter(
        trip =>
        trip.date ===
        new Date()
        .toLocaleDateString()
      )
      .reduce(
        (total,trip)=>
          total + (trip.passengers || 0),
        0
      ),
    weekly:
      totalPassengers,
    monthly:
      totalPassengers,
    total:
      totalPassengers
  };
  const tripRatings = {
    average:
      "No ratings ⭐",
    reviews:
      completedTrips.length,
    excellentTrips:
      "0%",
    score:
      "0%"
  };
  const passengerChartData = completedTrips.map((trip)=>({
    date: trip.date,
    passengers: trip.passengers || 0
  }));
  return (
    <div className="history-container">
      {/* COMPLETED TRIPS */}
      <h2>
        ✅ Completed Trips
      </h2>
      <input
        type="text"
        placeholder="Search by route..."
        value={search}
        onChange={(e)=>
          setSearch(e.target.value)
        }
        className="trip-search"
      />
      {
        filteredTrips.length === 0 ?
        (
          <p> 🚍 No completed trips yet</p>
        )
        :
        (
          <table className="trip-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Date</th>
                <th>Time</th>
                <th>Passengers</th>
                <th>Distance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
            {
              filteredTrips.map((trip:any)=>(
                <tr key={trip.id}>
                  <td>{trip.route} </td>
                  <td>{trip.date} </td>
                  <td>
                    {trip.startTime}
                    {" - "}
                    {trip.endTime}
                  </td>
                  <td> {trip.passengers}</td>
                  <td> {trip.distance} </td>
                  <td>
                    <span className="status completed">
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))
            }
            </tbody>
          </table>
        )
      }
      {/* WEEKLY STATISTICS */}
      <div className="weekly-statistics">
        <h2>  📊 Weekly Statistics  </h2>
        <div className="statistics-grid">
          <div className="stat-card">
            <h3> 🚍 Trips</h3>
            <p> {weeklyStatistics.totalTrips}            </p>
          </div>
          <div className="stat-card">
            <h3>  🛣 Distance </h3>

            <p>
              {weeklyStatistics.distance}
            </p>

          </div>





          <div className="stat-card">

            <h3>
              👥 Passengers
            </h3>

            <p>
              {weeklyStatistics.passengers}
            </p>

          </div>





          <div className="stat-card">

            <h3>
              ⭐ Rating
            </h3>

            <p>
              {weeklyStatistics.rating}
            </p>

          </div>



        </div>






        <div className="chart-container">


          <h3>
            Passenger Trend
          </h3>



          <ResponsiveContainer
            width="100%"
            height={250}
          >


            <LineChart data={passengerChartData}>


              <XAxis dataKey="date"/>

              <YAxis/>


              <Tooltip/>


              <Line

                type="monotone"

                dataKey="passengers"

                stroke="#4f46e5"

                strokeWidth={3}

              />


            </LineChart>


          </ResponsiveContainer>



        </div>



      </div>









      {/* MONTHLY STATISTICS */}



      <div className="monthly-statistics">


        <h2>
          📅 Monthly Performance
        </h2>


        <p>
          July 2026 Summary
        </p>





        <div className="statistics-grid">





          <div className="stat-card monthly-card">


            <div className="monthly-icon">
              🚍
            </div>


            <h3>
              Total Trips
            </h3>


            <p className="monthly-value">

              {monthlyStatistics.totalTrips}

            </p>


            <p className="monthly-description">

              Completed trips this month

            </p>


            <p className="monthly-growth">

              ↑ 8% compared to last month

            </p>


          </div>







          <div className="stat-card monthly-card">


            <div className="monthly-icon">
              🛣
            </div>


            <h3>
              Distance
            </h3>


            <p className="monthly-value">

              {monthlyStatistics.distance}

            </p>



            <div className="monthly-progress">


              <div

                className="monthly-progress-fill"

                style={{

                  width:`${monthlyDistanceProgress}%`

                }}

              >


              </div>


            </div>




            <p className="monthly-description">

              Monthly route coverage

            </p>


          </div>









          <div className="stat-card monthly-card">


            <div className="monthly-icon">
              👥
            </div>


            <h3>
              Passengers
            </h3>


            <p className="monthly-value">

              {monthlyStatistics.passengers}

            </p>


            <p className="monthly-description">

              Passengers transported

            </p>


            <p className="monthly-growth">

              ↑ 12% growth

            </p>


          </div>







          <div className="stat-card monthly-card">


            <div className="monthly-icon">
              📅
            </div>


            <h3>
              Working Days
            </h3>


            <p className="monthly-value">

              {monthlyStatistics.workingDays}

            </p>


            <p className="monthly-description">

              Active driving days

            </p>


          </div>





        </div>


      </div>





      {/* DISTANCE DRIVEN */}

<div className="distance-card-section">

  <h2>
    🛣 Distance Driven
  </h2>


  <div className="distance-summary-card">


    <div className="distance-total">

      <h3>
        Total Distance Covered
      </h3>


      <h1>
        {distanceDriven.total}
      </h1>


      <p>
        🚍 Across all completed trips
      </p>


    </div>



    <div className="distance-progress">


      <h3>
        Monthly Target
      </h3>


      <p>
        {distanceDriven.monthly} / 500 km
      </p>


      <div className="distance-progress-bar">


        <div

          className="distance-progress-fill"

          style={{
            width:
            `${Math.min(
              (totalDistance / 500) * 100,
              100
            )}%`
          }}

        >

        </div>


      </div>


      <span>

        {Math.round(
          Math.min(
            (totalDistance / 500) * 100,
            100
          )
        )}% Completed

      </span>


    </div>



  </div>





  <div className="statistics-grid">


    <div className="stat-card">

      <h3>
        📅 Today
      </h3>

      <p>
        {distanceDriven.today}
      </p>

    </div>




    <div className="stat-card">

      <h3>
        📆 This Week
      </h3>

      <p>
        {distanceDriven.weekly}
      </p>

    </div>





    <div className="stat-card">

      <h3>
        🗓 This Month
      </h3>

      <p>
        {distanceDriven.monthly}
      </p>

    </div>





    <div className="stat-card">

      <h3>
        🏁 Total
      </h3>

      <p>
        {distanceDriven.total}
      </p>

    </div>


  </div>


</div>







      {/* PASSENGER TOTALS */}

<div className="passenger-section">


  <h2>
    👥 Passenger Analytics
  </h2>



  <div className="passenger-summary-card">


    <div className="passenger-total">


      <h3>
        Total Passengers Transported
      </h3>


      <h1>
        {passengerTotals.total}
      </h1>


      <p>
        🚍 Across completed trips
      </p>


    </div>





    <div className="passenger-capacity">


      <h3>
        Bus Capacity Usage
      </h3>


      <p>
        {Math.min(
          Math.round(
            (passengerTotals.total / 5000) * 100
          ),
          100
        )}% Utilized
      </p>



      <div className="passenger-progress-bar">


        <div

          className="passenger-progress-fill"

          style={{
            width:
            `${Math.min(
              Math.round(
                (passengerTotals.total / 5000) * 100
              ),
              100
            )}%`
          }}

        >

        </div>


      </div>



    </div>


  </div>





  <div className="statistics-grid">



    <div className="stat-card">

      <h3>
        📅 Today
      </h3>

      <p>
        {passengerTotals.today}
      </p>

    </div>





    <div className="stat-card">

      <h3>
        📆 This Week
      </h3>

      <p>
        {passengerTotals.weekly}
      </p>

    </div>





    <div className="stat-card">

      <h3>
        🗓 This Month
      </h3>

      <p>
        {passengerTotals.monthly}
      </p>

    </div>





    <div className="stat-card">

      <h3>
        🏁 Total
      </h3>

      <p>
        {passengerTotals.total}
      </p>

    </div>


  </div>



</div>
              







      {/* TRIP RATINGS */}


<div className="rating-section">


  <h2>
    ⭐ Driver Performance Rating
  </h2>




  <div className="rating-summary-card">



    <div className="overall-rating">


      <h3>
        Overall Rating
      </h3>


      <h1>
        {tripRatings.average}
      </h1>


      <div className="stars">

        ⭐⭐⭐⭐⭐

      </div>


      <p>
        Based on passenger feedback
      </p>


    </div>






    <div className="rating-performance">


      <div className="performance-item">

        <span>
          Reviews
        </span>

        <strong>
          {tripRatings.reviews}
        </strong>

      </div>




      <div className="performance-item">

        <span>
          Excellent Trips
        </span>

        <strong>
          {tripRatings.excellentTrips}
        </strong>

      </div>





      <div className="performance-item">

        <span>
          Performance Score
        </span>

        <strong>
          {tripRatings.score}
        </strong>

      </div>


    </div>



  </div>



</div>
{/* INCIDENT REPORTS */}


<div className="incident-history-section">


  <h2>
    🚨 Incident Management
  </h2>



  <div className="incident-summary-card">


    <div>

      <h3>
        Total Incidents
      </h3>

      <h1>
        {incidentReports.length}
      </h1>

      <p>
        Reported driving incidents
      </p>

    </div>




    <div>

      <h3>
        Current Status
      </h3>


      <p className="incident-status-summary">

        {incidentReports.length === 0
        ?
        "No Active Issues ✅"
        :
        "Requires Attention ⚠️"
        }

      </p>


    </div>


  </div>





  {
    incidentReports.length === 0 ?

    (

      <p>
        No incident reports yet
      </p>

    )

    :

    (

      incidentReports.map((incident:any)=>(


        <div

          className="professional-incident-card"

          key={incident.id}

        >


          <div className="incident-header">


            <h3>

              🚨 {incident.type}

            </h3>



            <span

              className={
                incident.status === "Resolved"
                ?
                "incident-resolved"
                :
                "incident-pending"
              }

            >

              {incident.status}

            </span>


          </div>




          <div className="incident-details">


            <p>
              📅 <strong>Date:</strong> {incident.date}
            </p>


            <p>
              📍 <strong>Location:</strong> {incident.location}
            </p>


            <p>
              📝 <strong>Description:</strong> {incident.description}
            </p>


          </div>




        </div>


      ))

    )

  }


</div>


                 

             





    </div>


  );


}


export default MyTripHistory;