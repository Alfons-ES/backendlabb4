const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

//databasuppkoppling
mongoose.connect(process.env.MONGO_URI);
console.log("Ansluten till databasen...");

//databasen
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    account_created: { type: Date, default: Date.now }
}));

//kontrollera token - kolla att det finns en bearer token och verifierar om den är giltlig med .env
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

// register. tar emot username och password från frontenden, hashar lösen med bcrypt och skapar i mongodb
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    console.log("Register försök:", username);

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();

    res.json({ message: "Konto skapat!" });
});

//hittar användaren i databasen och jämför med lösenord med det hashade lösenordet, om det är korrekt får användaren en jwt token i en timme.
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


//skyddar routern, om token är giltlig får man ett välkomstmeddelande
app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({
        message: "Välkommen " + req.user.username,
    });
});


const meny = mongoose.model("meny", menySchema);

// Alla jobb
app.get("/meny", async (req, res) => {
    try {
        const experiences = await meny.find();
        res.json(experiences);
    } catch (error) {
        res.status(500).json({ message: "Kunde inte hämta data" });
    }
});

// Ett jobb
app.get("/meny/:id", async (req, res) => {
    try {
        const experience = await meny.findById(req.params.id);
        if (!experience) return res.status(404).json({ error: "Not found" });
        res.json(experience);
    } catch (error) {
        res.status(400).json({ message: "Ogiltigt ID" });
    }
});

// Uppdatera
app.put("/meny/:id", async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ message: "Fyll i alla fält." });
    }

    try {
        const updated = await meny.findByIdAndUpdate(
            req.params.id,
            { name, description },
            { returnDocument: 'after', runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: "Hittades inte" });
        res.json({ message: "Uppdaterad", data: updated });
    } catch (error) {
        res.status(500).json({ message: "Kunde inte uppdatera" });
    }
});

// Lägg till arbete
app.post("/meny", async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ message: "Fyll i alla fält." });
    }

    try {
        const newExperience = new meny(
            { name, description }
        );
        const saved = await newExperience.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: "Kunde inte lägga till arbetserfarenhet" });
    }
});

// Ta bort arbete
app.delete("/meny/:id", async (req, res) => {
    try {
        const deleted = await meny.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Hittades inte" });
        res.json({ message: "Deleted" });
    } catch (error) {
        res.status(400).json({ message: "Ogiltigt ID" });
    }
});


//starta servern
app.listen(process.env.PORT, () => {
    console.log("Servern körs på port " + process.env.PORT);
});