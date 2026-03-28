import { useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminAddBenefit() {

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Entertainment",
    link: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/benefits`, formData);
      alert("Benefit Added Successfully");
    } catch (err) {
      console.error(err);
      alert("Error adding benefit");
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>Add Benefit</h2>

      <form onSubmit={handleSubmit}>

        <input
          name="title"
          placeholder="Benefit Title"
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
          required
        />

        <select name="category" onChange={handleChange}>
          <option>Entertainment</option>
          <option>Shopping</option>
          <option>Education</option>
          <option>Travel</option>
          <option>Food</option>
        </select>

        <input
          name="link"
          placeholder="Offer Link"
          onChange={handleChange}
          required
        />

        <button type="submit">
          Add Benefit
        </button>

      </form>
    </div>
  );
}

export default AdminAddBenefit;