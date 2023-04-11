"use strict";

const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");
const { BadRequestError } = require("../expressError");
const { SECRET_KEY } = require("../config");

const User = require("../models/user");

/** POST /login: {username, password} => {token} */

router.post("/login", async function (req, res) {
    if (req.body === undefined) throw new BadRequestError();
    const { username, password } = req.body;

    if(User.authenticate(username, password)) {
        const token = jwt.sign({ username }, SECRET_KEY);
        return res.json({ token });
    }
});


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function (req, res) {
    if (req.body === undefined) throw new BadRequestError();
    const { username, password, first_name, last_name, phone } = req.body;

    const newUser = await User.register({ username, password, first_name, last_name, phone })
    
    if(User.authenticate(newUser.username, newUser.password)) {
        const token = jwt.sign({ username }, SECRET_KEY);
        return res.json({ token });
    }
});

module.exports = router;