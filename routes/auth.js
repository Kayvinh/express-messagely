"use strict";

const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const { SECRET_KEY } = require("../config");

const User = require("../models/user");

/** POST /login: {username, password} => {token} */

router.post("/login", async function (req, res) {
    if (!("username" in req.body && "body" in req.body)) {
        throw new BadRequestError();
    }
    
    const { username, password } = req.body;

    if(await User.authenticate(username, password)) {
        const _token = jwt.sign({ username }, SECRET_KEY);
        return res.json({ _token });
    }

    throw new UnauthorizedError();
});


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function (req, res) {
    if (req.body === undefined) throw new BadRequestError();
    const { username, password, first_name, last_name, phone } = req.body;

    const newUser = await User.register({ username, password, first_name, last_name, phone })
    
    if(await User.authenticate(newUser.username, newUser.password)) {//don't need to authenticate, they just gave us credentials
        const _token = jwt.sign({ username }, SECRET_KEY);
        return res.json({ _token });
    }
});

module.exports = router;