export const completeTrip = (passengers:number)=>{

 const completedTrip = {
    id: Date.now(),
    route:"Bole → Piassa",
    date:new Date().toLocaleDateString(),
    startTime:"8:00 AM",
    endTime:new Date().toLocaleTimeString(),
    distance:"12.5 km",
    passengers,
    status:"Completed",
    rating:5
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


};