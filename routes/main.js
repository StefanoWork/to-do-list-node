import express from 'express';
import passport from 'passport';
import { hashPassword } from '../utils.js';
import User from '../models/User.js';
import { authenticated } from '../middleware/Auth.js';
import Joi from 'joi';

const router = express.Router();


//Validazione dati
const userSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const addActivitySchema = Joi.object({
  name: Joi.string().required(),
  date: Joi.date().required()
});

const nameEditSchema = Joi.object({
    name: Joi.string().required(),
})

router.get("/", (req, res) => {
    res.send("Hello World");
});

/**
 * @swagger
 * /signup:
 *   get:
 *     summary: Visualizzazine pagina per iscrizione
 */
router.get("/signup", (req, res) => {
    res.render("signup");
});


/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Iscrizione utente
 *     responses:
 *       200:
 *         description: User registered
 *       400:
 *         description: Invalid data
 *       500:
 *         description: Error registering user
 */
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  try {
    const hashedPassword = await hashPassword(password);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).send('User registered');
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).send('Error registering user');
  }
});

/**
 * @swagger
 * /login:
 *   get:
 *     summary: Visualizzazine pagina per login
 */
router.get("/login", (req, res) => {
    res.render("login");
});


const validateLogin = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  next();
};

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user
 *     responses:
 *       200:
 *         description: Redirect profile page
 */
router.post('/login', validateLogin, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).send('Login failed');
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(200).send('Login successful');
    });
  })(req, res, next);
});


/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Visualizzazione attività registrate dall'utente
 *     responses:
 *       200:
 *         description: Visualizzazione attività
 */
router.get("/profile", authenticated, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("activities");
    const activities = user.activities;
    res.render("profile", { activities });
  } catch (err) {
    console.error("Error getting activities:", err);
    req.flash("error", "Error getting activities");
    res.redirect("/login");
  }
});


/**
 * @swagger
 * /profile:
 *   post:
 *     summary: Add new activity
 *     description: Nuovo nome dell'attività
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name activity
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date activity
 *     responses:
 *       200:
 *         description: Added activity
 *       400:
 *         description: Invalid data
 *       404:
 *         description: User not found
 *      500:
 *         description: Error adding activity
 */
router.post("/profile", async (req, res) => {
  console.log(req.body);
  const { name, date} = req.body;
  const userId = req.user._id;

  const { error } = addActivitySchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    const user = await User.findById(userId);
    if(!user) {
      return res.status(404).send("User not found");
    }

    user.activities.push({ name, date });
    await user.save();

    res.status(201).send("Activity added");
  } catch (err) {
    console.error("Error adding activity:", err);
    res.status(500).send("Error adding activity");
  }
});


/**
 * @swagger
 * /profile/{id}:
 *   get:
 *     summary: Details activity
 *     parameters:
 *       - in: path
 *         activityID: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'attività
 *     responses:
 *       200:
 *         description: Visualizzazione attività
 */
router.get("/profile/:id", async (req, res) => {
  const activityId = req.params.id;
  const user = await User.findOne({ "activities._id": activityId });
  const activity = user.activities.id(activityId);
  res.render("activity", { activity });
});

/**
 * @swagger
 * /profile/{id}:
 *   delete:
 *     summary: Delete activity
 *     parameters:
 *       - in: path
 *         activityID: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'attività
 *     responses:
 *       200:
 *         description: Activity deleted
 */
router.delete("/profile/:id", async (req, res) => {
  const activityId = req.params.id;
  const user = await User.findOne({ "activities._id": activityId });

  user.activities.pull(activityId);
  await user.save();
  res.status(200).send("Activity deleted");
});


/**
 * @swagger
 * /profile/{id}:
 *   put:
 *     summary: Aggiorna un'attività
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'attività
 *       - in: body
 *         name: name
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *         description: Nuovo nome dell'attività
 *     responses:
 *       200:
 *         description: Attività aggiornata
 *       404:
 *         description: Utente o attività non trovata
 *       500:
 *         description: Errore del server
 */
router.put("/profile/:id", async (req, res) => {
  const activityId = req.params.id;
  const { name } = req.body;

  const { error } = nameEditSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const user = await User.findOne({ "activities._id": activityId });
  const activity = user.activities.id(activityId);
  activity.name = name;
  await user.save();
  res.status(200).send("Activity updated");
});

router.use((req, res) => {
  res.status(404).send("404 Page not found").send("404 Page not found");
});


export default router;