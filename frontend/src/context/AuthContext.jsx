const login = async (email) => {
  const res = await fetch("http://localhost:5000/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  setUser(data.user);
};