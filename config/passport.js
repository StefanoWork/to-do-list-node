import passport from 'passport';
import LocalStrategy from 'passport-local';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

export default function configurePassport(passport) {
    passport.use(new LocalStrategy(
        function(username, password, done) {
            User.findOne({ username: username }, function(err, user) {
                if (err) { return done(err); }
                if (!user) { return done(null, false, { message: 'Incorrect username' }); }
                bcrypt.compare(password, user.password, function(err, res) {
                if (res) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Incorrect password' });
                }
                });
            });
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
}