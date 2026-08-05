import { useState, useEffect } from "react";
import "../styles/ProfilePage.css";

import {
  FaUser,
  FaIdCard,
  FaCertificate,
  FaPhoneAlt,
  FaEnvelope,
  FaCar
} from "react-icons/fa";


function ProfilePage() {


  const defaultProfile = {
    name: "Biruk Awel",
    phone: "+251 900000000",
    email: "driver@sbfms.com",
    address: "Addis Ababa"
  };


  const [profile, setProfile] = useState(defaultProfile);

  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);

  const [saved, setSaved] = useState(false);



  // LOAD PROFILE

  useEffect(() => {

    const savedProfile =
      localStorage.getItem("driverProfile");


    if(savedProfile){

      setProfile(
        JSON.parse(savedProfile)
      );

    }


    setTimeout(()=>{

      setLoading(false);

    },500);


  },[]);



  // HANDLE INPUT

  const handleChange = (e:any)=>{

    setProfile({

      ...profile,

      [e.target.name]:e.target.value

    });

  };



  // SAVE PROFILE

  const saveProfile = ()=>{


    localStorage.setItem(

      "driverProfile",

      JSON.stringify(profile)

    );


    window.dispatchEvent(
      new Event("profileUpdated")
    );


    setSaved(true);


    setEditing(false);



    setTimeout(()=>{

      setSaved(false);

    },3000);


  };



  if(loading){

    return (

      <h2>
        Loading profile...
      </h2>

    );

  }



  return (

<div className="profile-container">


{/* SUCCESS MESSAGE */}

{saved && (

<p className="success-message">

Profile updated successfully ✓

</p>

)}





{/* HEADER */}

<div className="profile-header">


<div className="profile-avatar">

<FaUser />

</div>



<div className="profile-header-info">


<h1>
{profile.name}
</h1>


<p className="driver-role">
Professional Driver
</p>


<p className="driver-id">
Driver ID: DRV-001
</p>


<span className="driver-status">
● Active
</span>



<div className="driver-extra-info">


<div>

⭐

<strong>
Rating
</strong>

<p>
4.8 / 5
</p>

</div>



<div>

🚌

<strong>
Assigned Bus
</strong>

<p>
BUS-024
</p>

</div>



<div>

🚍

<strong>
Total Trips
</strong>

<p>
245 Trips
</p>

</div>


</div>



</div>




<button

className="edit-button"

onClick={()=>setEditing(!editing)}

>

{editing ? "Cancel":"Edit Profile"}

</button>



</div>






{/* PERSONAL INFORMATION */}

<div className="profile-card">


<h2>

<FaUser/>

Personal Information

</h2>



<div className="profile-grid">



<div>

<label>
Full Name
</label>


{
editing ?

<input

name="name"

value={profile.name}

onChange={handleChange}

/>

:

<p>
{profile.name}
</p>

}


</div>




<div>

<label>
Driver ID
</label>


<p>
DRV-001
</p>


</div>





<div>

<label>

<FaPhoneAlt/>

Phone Number

</label>



{
editing ?

<input

name="phone"

value={profile.phone}

onChange={handleChange}

/>

:

<p>
{profile.phone}
</p>

}


</div>





<div>

<label>

<FaEnvelope/>

Email

</label>



{
editing ?

<input

name="email"

value={profile.email}

onChange={handleChange}

/>

:

<p>
{profile.email}
</p>

}


</div>



</div>


</div>





{/* SAVE BUTTON */}

{
editing && (

<button

className="save-button"

onClick={saveProfile}

>

Save Changes

</button>


)

}





{/* LICENSE */}

<div className="profile-card license-card">


<div className="license-header">


<h2>

<FaIdCard/>

Driving License

</h2>


<span className="verified-badge">

✓ Verified

</span>


</div>



<div className="profile-grid">


<div>

<label>
License Number
</label>

<p>
ETH-123456
</p>

</div>



<div>

<label>
License Type
</label>

<p>
Category C
</p>

</div>



<div>

<label>
Issue Date
</label>

<p>
2024-01-10
</p>

</div>



<div>

<label>
Expiry Date
</label>

<p>
2029-01-10
</p>

</div>


</div>



<div className="license-status">


<FaCar/>


<div>

<strong>
License Status: Valid
</strong>


<p>
Expiry in approximately 3 years
</p>


</div>


</div>


</div>






{/* CERTIFICATIONS */}

<div className="profile-card">


<h2>

<FaCertificate/>

Certifications

</h2>



<div className="certification-list">



<div className="certificate-item">


<div className="certificate-icon">
🏆
</div>


<div>

<h3>
Professional Driver Training
</h3>


<p>
Completed: 2025
</p>


</div>


<span className="certificate-status">
Completed
</span>


</div>





<div className="certificate-item">


<div className="certificate-icon">
🛡️
</div>


<div>

<h3>
Road Safety Certification
</h3>


<p>
Completed: 2025
</p>


</div>


<span className="certificate-status">
Completed
</span>


</div>



</div>


</div>






{/* EMERGENCY CONTACT */}

<div className="profile-card">


<h2>

<FaPhoneAlt/>

Emergency Contacts

</h2>



<div className="emergency-card">


<div className="emergency-icon">

<FaPhoneAlt/>

</div>



<div className="emergency-info">


<h3>
Family Contact
</h3>


<p>
Relationship: Brother
</p>


<p>
📞 +251 911111111
</p>


</div>



<span className="primary-contact">

Primary

</span>



</div>


</div>




</div>

  );

}


export default ProfilePage;