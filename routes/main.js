import express from 'express';
import passport from 'passport';
import { hashPassword } from '../utils.js';
import User from '../models/User.js';
import { authenticated } from '../middleware/Auth.js';

const router = express.Router();



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
 *       500:
 *         description: Error registering user
 */
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
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


/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user
 *     responses:
 *       200:
 *         description: Redirect profile page
 */
router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}));


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
 *       404:
 *        description: User not found
 *      500:
 *        description: Error adding activity
 */
router.post("/profile", async (req, res) => {
  console.log(req.body);
  const { name, date} = req.body;
  const userId = req.user._id;

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

  const user = await User.findOne({ "activities._id": activityId });
  const activity = user.activities.id(activityId);
  activity.name = name;
  await user.save();
  res.status(200).send("Activity updated");
});

export default router;