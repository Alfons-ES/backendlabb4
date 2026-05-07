const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI);
console.log("Ansluten till databasen...");

//databasen
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    account_created: { type: Date, default: Date.now }
}));

//kontrollera token
function authMiddleware(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.send("Du måste logga in!");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.send("Ogiltig token");
    }
}

// Login
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    console.log("Register försök:", username);

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();

    res.json({ message: "Konto skapat!" });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username });

    if (!user) {
        return res.send("Fel användarnamn eller lösenord");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.send("Fel användarnamn eller lösenord");
    }

    const token = jwt.sign({ username: username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: token });
});


app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({
        message: "Välkommen " + req.user.username + "!",
    });
});

app.listen(process.env.PORT, () => {
    console.log("Servern körs på port " + process.env.PORT);
});