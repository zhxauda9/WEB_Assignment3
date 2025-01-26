const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require("path");


const app = express();

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'WEB3',
    password: '2005',
    port: 1195,
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'web/')); // Папка с шаблонами EJS


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'web')));
app.use(session({
    secret: '4Imp3xlavgXmbWCIXl9dCEomHW4LyGSBCXfuOrF',
    resave: false,
    saveUninitialized: true,
}));

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.send('Username already exists');
        }
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
        res.redirect('/login.html');
    } catch (err) {
        console.error(err);
        res.send('Error registering user');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                req.session.user = user;
                res.redirect('/dashboard');
            } else {
                res.send('Invalid credentials');
            }
        } else {
            res.send('User not found');
        }
    } catch (err) {
        console.error(err);
        res.send('Error logging in');
    }
});

app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        const userData = {
            username: req.session.user.username,
            email: req.session.user.email || 'example@mail.com',
        };
        res.render('profile', userData);
    } else {
        res.redirect('/login.html');
    }
});


app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        } else {
            res.redirect('/login.html');
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/home.html'));
});

app.listen(3000, () => {
    console.log('Server running on port http://localhost:3000');
});
