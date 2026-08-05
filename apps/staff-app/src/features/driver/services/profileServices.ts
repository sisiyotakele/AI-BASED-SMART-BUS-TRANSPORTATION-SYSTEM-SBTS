const API_URL = "http://localhost:5000/api";


export const getDriverProfile = async () => {

  const response = await fetch(
    `${API_URL}/driver/profile`
  );

  return response.json();

};



export const updateDriverProfile = async (profile:any) => {

  const response = await fetch(
    `${API_URL}/driver/profile`,
    {
      method:"PUT",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(profile)
    }
  );


  return response.json();

};