"use strict";

const Router = require("express").Router;
const router = new Router();
const {authenticateJWT, ensureLoggedIn, ensureCorrectUser } 
    = require("../middleware/auth");

const User = require("../models/user");

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name}, ...]}
 *
 **/
router.get("/",
    authenticateJWT,
    ensureLoggedIn,
    async function (req, res) {
        const users = await User.all();

        return res.json({ users });
});


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

module.exports = router;