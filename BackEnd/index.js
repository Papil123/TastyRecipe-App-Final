const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const axios = require("axios")
const cors = require("cors")

const app = express();
const port = 3000;
const secretKey = 'yourSecretKey';
app.use(cors())

mongoose.connect('mongodb+srv://papil1997:Papil123@cluster0.mgod2.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = mongoose.model('User', {
  username: String,
  password: String,
  savedData:Array
});

app.use(bodyParser.json());

// User registration
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username: username,
      password: hashedPassword
    });

    await newUser.save();

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

// User login and token generation
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Generate JWT token
    const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });

    return res.status(200).json({ token: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});





// Save recipe 
app.post('/save-data', async (req, res) => {
    try {
      const { data } = req.body;
      const { username } = req.user;
  
      // Find the user
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
       console.log(data)
      // Save the data
      user.savedData.push(data);
      await user.save();
  
      return res.status(200).json({ message: 'Data saved successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred' });
    }
  });
  
  
  
  function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(403).json({ message: 'Token not provided' });
    }
  
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }
  
      req.user = decoded;
      next();
    });
  }
  
  
  // Search recipes
app.get('/search-recipes', async (req, res) => {
    try {
      const { query } = req.query;
  
      // Make a request to the Spoonacular API
      const apiKey = "49b5b7999c19438d8b3cff720d0151cd";
      const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&apiKey=${apiKey}&number=2`;
      
      const response = await axios.get(apiUrl);
  
      // Return the recipes
      const recipes = response.data.results;
      return res.status(200).json({ recipes });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred' });
    }
  });


// Fetch saved data for a user (requires authentication)
app.get('/saved-data', verifyToken, async (req, res) => {
  try {
    const { username } = req.user;

    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return saved data
    const savedData = user.savedData; // Assuming `savedData` is an array field in your User model
    return res.status(200).json({ savedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
