const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const db = require("../db");
const { UnauthorizedError, BadRequestError, NotFoundError } = require("../expressError")


"use strict";

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users 
          (username, 
            password, 
            first_name, 
            last_name, phone, 
            join_at, 
            last_login_at)
        VALUES($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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

    const user = result.rows[0];

    if (user) {
      return (await bcrypt.compare(password, user.password) === true);
    }
    throw UnauthorizedError("Invalid user/password");
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
       SET last_login_at = CURRENT_TIMESTAMP
       WHERE username = $1
       RETURNING last_login_at
       `, [username]

    );

    const user = result.rows[0];

    if (!user) {
      throw new NotFoundError()
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name
        FROM users
        ORDER BY username`
    );
    console.log(results.rows);
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
  static async get(username) {
    const result = await db.query(
      `SELECT username, 
          first_name, 
          last_name, 
          phone, 
          join_at, 
          last_login_at
        FROM users
        WHERE username = $1`, [username]
    );

    const user = result.rows[0];

    if (!user) {
      throw new NotFoundError(`No such user: ${username}`);
    }

    return user;

  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {

    const result = await db.query(
      `SELECT username
      FROM users
      WHERE username = $1`, [username]
    );

    const user = result.rows[0];
    if(!user) throw new NotFoundError();

    const messagesResults = await db.query(
      `SELECT m.id, 
        m.body, 
        m.sent_at, 
        m.read_at,
        u.username,
        u.first_name,
        u.last_name,
        u.phone
    FROM messages AS m
      JOIN users AS u ON m.to_username = u.username
    WHERE m.from_username = $1 
      `, [user.username]
    );

    let messages = messagesResults.rows;

    const fromMessages = messages.map((message) => {
      return {
        id: message.id,
        body: message.body,
        sent_at: message.sent_at,
        read_at: message.read_at,
        to_user: {
          username: message.username,
          first_name: message.first_name,
          last_name: message.last_name,
          phone: message.phone
        }
      }

    });

    return fromMessages;

  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT username
      FROM users
      WHERE username = $1`, [username]
    );

    const user = result.rows[0];
    if(!user) throw new NotFoundError();

    const messagesResults = await db.query(
      `SELECT m.id, 
        m.body, 
        m.sent_at, 
        m.read_at,
        u.username,
        u.first_name,
        u.last_name,
        u.phone
    FROM messages AS m
      JOIN users AS u ON m.from_username = u.username
    WHERE m.to_username = $1 
      `, [user.username]
    );

    
    let messages = messagesResults.rows;
    console.log(messages)
    
    const toMessages = messages.map((message) => {
      return {
        id: message.id,
        body: message.body,
        sent_at: message.sent_at,
        read_at: message.read_at,
        from_user: {
          username: message.username,
          first_name: message.first_name,
          last_name: message.last_name,
          phone: message.phone
        }
      }
    });

    return toMessages;
 }
}

module.exports = User;
