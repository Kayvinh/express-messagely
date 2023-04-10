"use strict";

const Router = require("express").Router;
const router = new Router();

const User = require("../models/user");

/** POST /login: {username, password} => {token} */


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function (req, res) {
    if (req.body === undefined) throw new BadRequestError();
    const { username, password, first_name, last_name, phone } = req.body;

    const newUser = await User.register({ username, password, first_name, last_name, phone })
    
    return res.json(newUser);
});

module.exports = router;