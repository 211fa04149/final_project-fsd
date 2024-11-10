const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// GET route for the root URL
app.get("/", (req, res) => {
  res.send("Welcome to the Food Delivery Registration API!");
});

// POST route to handle registration
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    return res.json({ success: true });
  }
  return res.json({ success: false });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
