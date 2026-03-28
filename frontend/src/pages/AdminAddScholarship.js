import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminAddScholarship() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "MERIT",
    education_qualifications: [],
    communities: [],
    incomeLimit: "",
    minPercentage: "",
    minAge: "",
    maxAge: "",
    deadline: "",
    benefits: "",
    link: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMultiSelect = (e, field) => {
    const values = Array.from(
      e.target.selectedOptions,
      option => option.value
    );
    setFormData({ ...formData, [field]: values });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/scholarships`, formData);
      alert("Scholarship Added Successfully");
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error adding scholarship");
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>Add Scholarship</h2>

      <form onSubmit={handleSubmit}>

        <input
          name="name"
          placeholder="Scholarship Name"
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
          required
        />

        <select name="type" onChange={handleChange}>
          <option value="MERIT">Merit</option>
          <option value="NEED">Need</option>
          <option value="MINORITY">Minority</option>
        </select>

        <label>Education Levels</label>
        <select multiple onChange={(e) => handleMultiSelect(e, "education_qualifications")}>
          <option value="Undergraduate">Undergraduate</option>
          <option value="Postgraduate">Postgraduate</option>
          <option value="Doctorate">Doctorate</option>
        </select>

        <label>Communities</label>
        <select multiple onChange={(e) => handleMultiSelect(e, "communities")}>
          <option value="General">General</option>
          <option value="OBC">OBC</option>
          <option value="SC/ST">SC/ST</option>
          <option value="Minority">Minority</option>
        </select>

        <input
          name="incomeLimit"
          placeholder="Income Limit"
          type="number"
          onChange={handleChange}
        />

        <input
          name="minPercentage"
          placeholder="Minimum Percentage"
          type="number"
          onChange={handleChange}
        />

        <input
          name="minAge"
          placeholder="Minimum Age"
          type="number"
          onChange={handleChange}
        />

        <input
          name="maxAge"
          placeholder="Maximum Age"
          type="number"
          onChange={handleChange}
        />

        <label>Deadline</label>
        <input
          name="deadline"
          type="date"
          onChange={handleChange}
        />

        <textarea
          name="benefits"
          placeholder="Benefits"
          onChange={handleChange}
        />

        <input
          name="link"
          placeholder="Application Link"
          onChange={handleChange}
          required
        />

        <button type="submit">
          Add Scholarship
        </button>

      </form>
    </div>
  );
}

export default AdminAddScholarship;