import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from "react-leaflet";

import * as L from "leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "../styles/RouteMapPage.css";


// 🚌 Bus icon
const busIcon = new L.Icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",

  iconSize: [55, 55],

  iconAnchor: [27, 27],

  popupAnchor: [0, -25],
});

// 📍 Stop icon
const stopIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize:[25,41],
  iconAnchor:[12,41]
});


// 🟢 Current stop
const currentStopIcon = new L.Icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/447/447031.png",

  iconSize:[35,35]
});


// 🔵 Next stop
const nextStopIcon = new L.Icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/684/684908.png",

  iconSize:[30,30]
});


// Follow bus movement
function FollowBus(
{
 position
}:{
 position:[number,number]
}
){

const map = useMap();


useEffect(()=>{

map.setView(
 position,
 map.getZoom(),
 {
 animate:true
 }
);


},[position,map]);


return null;

}



function RouteMapPage(){


const stops:[number,number][]=[

[9.0320,38.7469],

[9.0200,38.7500],

[9.0100,38.7600],

[8.9900,38.7800]

];


const stopNames=[

"Mexico Square",

"Stadium",

"Bole Road",

"Bole Airport"

];



// ================= STATES =================


const TOTAL_DISTANCE = 12.5;


const [busLocation,setBusLocation]
=
useState<[number,number]>(stops[0]);


const [currentStop,setCurrentStop]
=
useState(0);



const [speed,setSpeed]
=
useState(35);



const [distance,setDistance]
=
useState(TOTAL_DISTANCE);



const [eta,setEta]
=
useState(
Math.ceil((TOTAL_DISTANCE / 35) * 60)
);



const [tripProgress,setTripProgress]
=
useState(0);



// 🚦 AI Traffic

const [trafficStatus,setTrafficStatus]
=
useState("Normal Traffic");


const [trafficDelay,setTrafficDelay]
=
useState(0);


const [trafficSuggestion,setTrafficSuggestion]
=
useState(
"Continue current route"
);




// ================= BUS MOVEMENT =================


useEffect(()=>{


let stopIndex = 0;

let progress = 0;



const interval = setInterval(()=>{


const start = stops[stopIndex];

const end = stops[stopIndex+1];



if(!end){

clearInterval(interval);

return;

}



const lat =
start[0] +
(end[0]-start[0])
*
progress;



const lng =
start[1] +
(end[1]-start[1])
*
progress;



setBusLocation([
lat,
lng
]);




// SPEED

const randomSpeed =
Math.floor(
Math.random()*(45-25)+25
);


setSpeed(randomSpeed);




// DISTANCE + ETA + PROGRESS


setDistance(prevDistance=>{


const updatedDistance =
Math.max(
prevDistance - 0.01,
0
);



const percentage =
(
(TOTAL_DISTANCE-updatedDistance)
/ TOTAL_DISTANCE
)
*100;



setTripProgress(percentage);



if(updatedDistance > 0){


const calculatedETA =
(updatedDistance/randomSpeed)*60;


setEta(
Math.ceil(calculatedETA)
);


}
else{

setEta(0);

}



return Number(
updatedDistance.toFixed(2)
);


});



progress += 0.005;



if(progress>=1){

progress=0;

stopIndex++;

setCurrentStop(stopIndex);

}



},100);



return ()=>clearInterval(interval);


},[]);




// ================= AI TRAFFIC =================


useEffect(()=>{


const trafficInterval =
setInterval(()=>{


const trafficLevels=[


{
status:"Normal Traffic",
delay:0,
suggestion:"Continue current route"
},


{
status:"Moderate Traffic",
delay:5,
suggestion:"Reduce speed near intersection"
},


{
status:"Heavy Traffic",
delay:10,
suggestion:"Consider alternative route"
}


];



const randomTraffic =
trafficLevels[
Math.floor(
Math.random()*trafficLevels.length
)
];



setTrafficStatus(randomTraffic.status);

setTrafficDelay(randomTraffic.delay);

setTrafficSuggestion(
randomTraffic.suggestion
);



},5000);



return ()=>clearInterval(trafficInterval);



},[]);



const totalStops = stops.length;

const completedStops = currentStop;

const remainingStops =
totalStops-currentStop-1;


const progressPercentage =
tripProgress;
return(

<div className="route-map-page">


<h1>Route Map</h1>


<div className="route-layout-vertical">



{/* =========================
    TODAY'S ROUTE
========================= */}


<div className="route-info-card">


<h2>Today's Route</h2>


<p>
<strong>Route:</strong>
Addis Ababa → Bole
</p>


<p>
<strong>Bus:</strong>
SBTS-102
</p>


<p>
<strong>Driver:</strong>
Abebe
</p>


<p>
<strong>Total Distance:</strong>
12.5 km
</p>


<h3>Bus Stops</h3>


<ul>

{
stopNames.map((stop,index)=>(

<li key={index}>

{
index < currentStop
?
"✓ "
:
index === currentStop
?
"🟢 "
:
"→ "
}

{stop}

</li>

))

}

</ul>


</div>





{/* =========================
    TRIP PROGRESS
========================= */}



<div className="progress-card">


<h2>Trip Progress</h2>


<p className="status-text">

🟢 Trip Running

</p>



<div className="progress-bar">


<div

className="progress-fill"

style={{
width:`${progressPercentage}%`
}}

>


</div>


</div>



<div className="progress-details">


<p>

<strong>
Completed:
</strong>

{progressPercentage.toFixed(0)}%

</p>



<p>

<strong>
Remaining:
</strong>

{distance} km

</p>



</div>


</div>





{/* =========================
    LIVE ROUTE MAP
========================= */}



<div className="map-card">


<h2>
Live Route Map
</h2>



<MapContainer

center={busLocation}

zoom={13}

className="real-map"

>


<FollowBus

position={busLocation}

/>



<TileLayer

url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

/>





{/* BUS */}


<Marker

position={busLocation}

icon={busIcon}

>


<Popup>
  <strong>🚌 SBTS-102</strong>
  <br/>
  Status: Running
  <br/>
  Speed: {speed} km/h
  <br/>
  Next Stop:
  {stopNames[currentStop + 1]}
</Popup>

</Marker>






{/* STOPS */}



{
stops.map((stop,index)=>(


<Marker

key={index}

position={stop}

icon={

index === currentStop

?

currentStopIcon

:

index === currentStop+1

?

nextStopIcon

:

stopIcon

}

>


<Popup>


{

index === currentStop

?

"🟢 Current Stop: "
+ stopNames[index]


:

index === currentStop+1

?

"🔵 Next Stop: "
+ stopNames[index]


:

"📍 "
+ stopNames[index]


}



</Popup>


</Marker>


))

}






{/* ROUTE LINE */}


<Polyline

positions={stops}

/>



</MapContainer>


</div>







{/* =========================
    NEXT STOP
========================= */}



<div className="next-stop-card">


<h2>
Next Stop
</h2>


<p>

📍

<strong>

{
stopNames[currentStop+1]
||
"Trip Completed"
}

</strong>


</p>



<p>

🚌 Speed:

{speed}

km/h

</p>



<p>

⏱ ETA:

{eta}

minutes

</p>



<p>

📏 Distance:

{distance}

km

</p>


</div>







{/* =========================
    AI TRAFFIC
========================= */}



<div className="traffic-card">


<h2>
AI Traffic Prediction
</h2>



<p>

🚦

{trafficStatus}

</p>



<p>

⏱ Delay:

+

{trafficDelay}

minutes

</p>



<p>

🤖 Suggestion:

{trafficSuggestion}

</p>



</div>





</div>


</div>


);

}


export default RouteMapPage;