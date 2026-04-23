import axios from "axios";

async function testLookup() {
  try {
    const res = await axios.post("http://localhost:5000/api/auth/lookup-email", {
      phone: "5024101"
    });
    console.log("Lookup success:", res.data);
  } catch(err) {
    if (err.response) {
      console.error("❌ Backend Error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Failed:", err.message);
    }
  }
}

testLookup();
