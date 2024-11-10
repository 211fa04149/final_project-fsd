require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here'; // Use a strong secret!

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdb'; // Use local URI for development
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// User schema and model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header
    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user; // Store user info in request for use in routes
        next();
    });
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Protect home route
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Registration Route
app.post('/register', async (req, res) => {
    const { email, password, repeatPassword } = req.body;

    if (!password || !repeatPassword) {
        return res.status(400).send('Password and repeat password are required!');
    }

    if (password !== repeatPassword) {
        return res.status(400).send('Passwords do not match!');
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
        return res.status(400).send('Email already registered!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    
    try {
        await newUser.save();
        const token = jwt.sign({ email: newUser.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Registration successful!', token }); // Send back token on registration
    } catch (error) {
        console.error('Error saving user to database:', error);
        res.status(500).send('Internal server error');
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ email: username });

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ message: 'Login successful!', token }); // Send back token on successful login
    } 

    res.status(401).send('Invalid credentials!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
