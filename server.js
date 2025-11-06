// server.js
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = require("./middleware/authMiddleware");
const authorizeRoles = require("./middleware/roleMiddleware");

const app = express();
app.use(bodyParser.json());

// Sample hardcoded users
const users = [
  { id: 1, username: "adminUser", password: "admin123", role: "Admin" },
  { id: 2, username: "modUser", password: "mod123", role: "Moderator" },
  { id: 3, username: "normalUser", password: "user123", role: "User" },
];

// Login route - generate JWT with user role
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Create token with role
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

// Protected route for all logged-in users
app.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: `Welcome ${req.user.username}!`,
    user: req.user,
  });
});

// Admin-only route
app.get(
  "/admin",
  verifyToken,
  authorizeRoles("Admin"),
  (req, res) => {
    res.json({ message: "Welcome to the Admin dashboard!" });
  }
);

// Moderator-only route
app.get(
  "/moderator",
  verifyToken,
  authorizeRoles("Moderator", "Admin"),
  (req, res) => {
    res.json({ message: "Welcome Moderator! You have access." });
  }
);

// User-only route
app.get(
  "/user",
  verifyToken,
  authorizeRoles("User", "Admin", "Moderator"),
  (req, res) => {
    res.json({ message: "Welcome User! You have access." });
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
