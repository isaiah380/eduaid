const fs = require('fs');

const files = [
  'src/App.js', 
  'src/pages/Login.js', 
  'src/pages/Register.js', 
  'src/pages/AdminLogin.js', 
  'src/pages/ClerkLogin.js', 
  'src/pages/Profile.js'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf-8');
  
  // Replace localStorage.setItem
  content = content.replace(/localStorage\.setItem\('user'/g, "sessionStorage.setItem('user'");
  content = content.replace(/localStorage\.setItem\('token'/g, "sessionStorage.setItem('token'");
  content = content.replace(/localStorage\.setItem\('role'/g, "sessionStorage.setItem('role'");
  
  // Replace localStorage.getItem
  content = content.replace(/localStorage\.getItem\('user'\)/g, "sessionStorage.getItem('user')");
  content = content.replace(/localStorage\.getItem\('token'\)/g, "sessionStorage.getItem('token')");
  content = content.replace(/localStorage\.getItem\('role'\)/g, "sessionStorage.getItem('role')");
  
  // Replace localStorage.removeItem
  content = content.replace(/localStorage\.removeItem\('user'\)/g, "sessionStorage.removeItem('user')");
  content = content.replace(/localStorage\.removeItem\('token'\)/g, "sessionStorage.removeItem('token')");
  content = content.replace(/localStorage\.removeItem\('role'\)/g, "sessionStorage.removeItem('role')");
  
  fs.writeFileSync(f, content);
});

console.log('Replaced localStorage with sessionStorage for user, token, and role.');
