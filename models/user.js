const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const db = require("../db");
const { UnauthorizedError, BadRequestError } = require("../expressError")


"use strict";

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

  //TODO:break up insert stuff into multiple lines
  //TODO: match now to current timestamp
    const result = await db.query(
      `INSERT INTO users 
        (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING username, password, first_name, last_name, phone
      `,
      [username, hashedPassword, first_name, last_name, phone]
    );

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {

    const result = await db.query(
      `SELECT password
        FROM users
        WHERE username = $1`, [username]
    );
    //TODO: pull out result.rows[0] to const user
    if (result.rows[0]) {
      return (await bcrypt.compare(password, result.rows[0].password) === true);
    }
    throw UnauthorizedError("Invalid user/password");
  }

  /** Update last_login_at for user */
  //TODO: throw error if user not found
  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users
       SET last_login_at = NOW()
       WHERE username = $1`, [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */
  //TODO: order by something, probably username
  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name
        FROM users`
    );
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
  //TODO: select columns on own line
  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users
        WHERE username = $1`, [username]
    );//TODO: if user exists at 0
    if (result.rows.length === 1) {
      return result.rows[0];
    }//TODO: NotFoundError
    throw new BadRequestError(`No such user: ${username}`);

  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const user = await User.get(username);

    //TODO: refactor to one query instead of many
    const messagesResults = await db.query(
      `SELECT id, to_username, body, sent_at, read_at
      FROM messages 
      JOIN users
      ON username = from_username
      WHERE username = $1 
       `, [user.username]
    );

    for (const message of messagesResults.rows) {
      const toUserResult = await db.query(
        `SELECT username, first_name, last_name, phone
          FROM users
          WHERE username = $1`, [message.to_username]
      );
      message.to_user = toUserResult.rows[0];
      delete message.to_username;
    }
    return messagesResults.rows;

  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const user = await User.get(username);


    const messagesResults = await db.query(
      `SELECT id, from_username, body, sent_at, read_at
      FROM messages 
      JOIN users
      ON username = to_username
      WHERE username = $1 
       `, [user.username]
    );

    for (const message of messagesResults.rows) {
      const fromUserResult = await db.query(
        `SELECT username, first_name, last_name, phone
          FROM users
          WHERE username = $1`, [message.from_username]
      );
      message.from_user = fromUserResult.rows[0];
      delete message.from_username;
    }
    return messagesResults.rows;
  }
}


module.exports = User;
