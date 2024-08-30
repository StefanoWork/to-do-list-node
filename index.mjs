import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mainRouter from './routes/main.js';
import passport from "passport";
import configurePassport from './config/passport.js';
import session from "express-session";
import flash from "connect-flash";
import swaggerSetup from "./swagger.js";
import mongoose from "mongoose";


const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(session({
    secret: 'Secste', 
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60
    }
}));

swaggerSetup(app);

app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);


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


app.use("/", mainRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});