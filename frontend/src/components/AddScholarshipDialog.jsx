import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import axios from "axios";

export default function AddScholarshipDialog() {
  const [form, setForm] = useState({});

  const submit = async () => {
    await axios.post("http://localhost:5000/scholarships", form);
    window.location.reload();
  };

  return (
    <Dialog>
      <DialogTrigger>Add Scholarship</DialogTrigger>

      <DialogContent>
        <input placeholder="Name" onChange={e => setForm({...form, name: e.target.value})}/>
        <button onClick={submit}>Save</button>
      </DialogContent>
    </Dialog>
  );
}