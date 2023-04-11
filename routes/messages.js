"use strict";

const Router = require("express").Router;
const router = new Router();

const Message = require("../models/message")
const { authenticateJWT, ensureLoggedIn, ensureCorrectUser }
    = require("../middleware/auth");
const { UnauthorizedError, BadRequestError } = require("../expressError");

router.use(authenticateJWT);//handled in app
router.use(ensureLoggedIn);//use explicitely in routes


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", async function (req, res) {
    const id = req.params.id;
    const message = await Message.get(id);
    const username = res.locals.user.username;
    //TODO: more common pattern is to reverse this, fail fast
    if (username === message.to_user.username ||
        username === message.from_user.username) {
        return res.json({ message });
    }
    throw new UnauthorizedError();

});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/",
    async function (req, res) {
        if (req.body === undefined) throw new BadRequestError();

        const { to_username, body } = req.body;
        const from_username = res.locals.user.username;

        const message = await Message.create(
            { from_username, to_username, body });
        return res.json({ message });
    });


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", async function(req, res) {
    if (req.body === undefined) throw new BadRequestError();//not needed here, might not actually be working as we intend in other spots. maybe check if right keys

    const id = req.params.id;
    const username = res.locals.user.username;
    const message = await Message.get(id);
    //TODO: flip if statement
    if (username === message.to_user.username) {
        const response = await Message.markRead(id);
        return res.json({message: response});
    }
    throw new UnauthorizedError();

});


module.exports = router;