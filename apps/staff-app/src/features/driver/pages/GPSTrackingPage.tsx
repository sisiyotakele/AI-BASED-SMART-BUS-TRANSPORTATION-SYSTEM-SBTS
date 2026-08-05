import { useEffect, useRef, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import * as L from "leaflet";

import "leaflet/dist/leaflet.css";

import "../styles/GPSTrackingPage.css";


// 📍 GPS marker icon
const gpsIcon = new L.Icon({

  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/684/684908.png",

  iconSize: [40,40],

});




// 🔄 Auto follow map movement
function FollowLocation({
  position,
}:{
  position:[number,number]
}){

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




// Save map reference
function SaveMapReference({

  mapRef

}:{

  mapRef: React.MutableRefObject<L.Map | null>;

}){


  const map = useMap();


  useEffect(()=>{

    mapRef.current = map;


  },[map,mapRef]);



  return null;

}





function GPSTrackingPage(){



// =========================
// STATES
// =========================


const [tracking,setTracking] =
useState(false);



const [location,setLocation] =
useState<[number,number]>([
9.032,
38.7469
]);



const [accuracy,setAccuracy] =
useState(0);



const [lastUpdate,setLastUpdate] =
useState("--");



const [watchId,setWatchId] =
useState<number | null>(null);



const [path,setPath] =
useState<[number,number][]>([]);



const [speed,setSpeed] =
useState(0);



const [heading,setHeading] =
useState(0);



const [gpsError,setGpsError] =
useState("");



// Map reference

const mapRef =
useRef<L.Map | null>(null);






// =========================
// START TRACKING
// =========================


const startTracking = ()=>{


if(tracking){
return;
}



if(!navigator.geolocation){


setGpsError(
"GPS is not supported by this device"
);


return;

}



setGpsError("");

setPath([]);




const id =
navigator.geolocation.watchPosition(


(position)=>{


const lat =
position.coords.latitude;


const lng =
position.coords.longitude;



const newPosition:
[number,number] =
[
lat,
lng
];



setLocation(newPosition);



setPath((prev)=>
[
...prev,
newPosition
]
);



setAccuracy(
position.coords.accuracy
);



setSpeed(
position.coords.speed || 0
);



setHeading(
position.coords.heading || 0
);



setLastUpdate(
new Date().toLocaleTimeString()
);



},



(error)=>{


setGpsError(
error.message
);


},



{


enableHighAccuracy:true,

maximumAge:1000,

timeout:5000


}



);



setWatchId(id);

setTracking(true);


};








// =========================
// STOP TRACKING
// =========================


const stopTracking = ()=>{


if(watchId !== null){


navigator.geolocation.clearWatch(
watchId
);


}



setTracking(false);


};








// =========================
// CENTER MAP
// =========================


const centerBus = ()=>{


if(mapRef.current){


mapRef.current.setView(

location,

15,

{
animate:true
}

);


}


};








// =========================
// CLEANUP
// =========================


useEffect(()=>{


return()=>{


if(watchId !== null){


navigator.geolocation.clearWatch(
watchId
);


}


};


},[watchId]);









return(


<div className="gps-page">


<h1>
GPS Tracking
</h1>





{/* GPS STATUS */}

<div className="gps-card">


<h2>
GPS Status
</h2>



<p
className={
tracking
?
"status-on"
:
"status-off"
}
>


{
tracking
?
"🟢 Tracking Active"
:
"🔴 Tracking Stopped"
}


</p>




{
gpsError &&

<p className="gps-error">

⚠️ {gpsError}

</p>

}




<p>
Latitude:
{location[0]}
</p>



<p>
Longitude:
{location[1]}
</p>




<p>
Accuracy:
{accuracy.toFixed(2)}
meters
</p>




<p>
Speed:
{(speed * 3.6).toFixed(1)}
km/h
</p>




<p>
Direction:
{heading.toFixed(0)}°
</p>




<p>
Last Update:
{lastUpdate}
</p>






<div className="gps-buttons">



<button

className="start-btn"

onClick={startTracking}

disabled={tracking}

>

▶ Start Tracking

</button>





<button

className="stop-btn"

onClick={stopTracking}

disabled={!tracking}

>

⏹ Stop Tracking

</button>



</div>



</div>









{/* LIVE MAP */}


<div className="gps-map-card">


<h2>
Live GPS Location
</h2>




<button

className="center-btn"

onClick={centerBus}

>

📍 Center on Bus

</button>






<MapContainer

center={location}

zoom={15}

className="gps-map"

>


<SaveMapReference
mapRef={mapRef}
/>



<FollowLocation

position={location}

/>





<TileLayer

url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

/>







<Marker

position={location}

icon={gpsIcon}

>


<Popup>


📍 Driver Current Location

<br/>

Latitude:
{location[0]}

<br/>

Longitude:
{location[1]}



</Popup>


</Marker>







<Polyline

positions={path}

/>





</MapContainer>





</div>





</div>


);


}



export default GPSTrackingPage;