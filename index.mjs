import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mainRouter from './routes/main.js';
import passport from "passport";
import LocalStrategy from "passport-local";
import mongoose from "mongoose";
import User from "./models/User.js";
import session from "express-session";
import bcrypt from "bcrypt";
import flash from "connect-flash";
import swaggerSetup from "./swagger.js";


const app = express();
const PORT = process.env.PORT || 3001;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.use(session({
    secret: 'Secste', 
    resave: false,
    saveUninitialized: true
}));

swaggerSetup(app);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    res.locals.error = req.flash('error');
    next();
});


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


mongoose.connect('mongodb://localhost:27017/User',  
).then(() => {
    console.log('Connected to DB');
}).catch((err) => {
    console.log('Error: ', err);
});



// Passport setup
passport.use(new LocalStrategy(
   async (username, password, done) => {
        try {
            const user = await User.findOne({ username });
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        } catch (err) {
            done(err);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

app.use("/", mainRouter);




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});