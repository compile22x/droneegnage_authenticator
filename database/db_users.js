"use strict";

const fs = require('fs');
const path = require('path');

const info_field = 'db_info';

/**
 * Simple JSON file-based database that replaces lowdb.
 * Fully CommonJS compatible - no ESM imports needed.
 */
class SimpleJsonFile {
    constructor(file, defaults) {
        this.file = file;
        this.data = defaults;
    }

    read() {
        try {
            if (fs.existsSync(this.file)) {
                const raw = fs.readFileSync(this.file, 'utf8');
                this.data = JSON.parse(raw);
            }
        } catch (err) {
            console.error('Failed to read DB file:', err);
        }
    }

    write() {
        try {
            fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
        } catch (err) {
            console.error('Failed to write DB file:', err);
        }
    }
}

class db_user {
    constructor(database_file) {
        const file = path.join(__dirname, '..', database_file);
        this.db = new SimpleJsonFile(file, { [info_field]: { SID: 0 }, users: {} });
        this.db.read();
    }

    /**
     * Add a user record
     * @param {string} user_email - Email as the user key
     * @param {object} user_data - User data { sid, pwd, prm, isadmin }
     */
    fn_add_record(user_email, user_data, fn_callback) {
        if (!user_data || user_email === info_field) {
            return;
        }

        if (!user_data.sid || !user_data.pwd || !user_data.prm) {
            return;
        }

        user_data.isadmin = user_data.isadmin ?? false;

        if (this.db.data.users[user_email]) {
            let c_reply = {};
            c_reply[global.c_CONSTANTS.CONST_ERROR_MSG] = "Duplicate entry.";
            c_reply[global.c_CONSTANTS.CONST_ERROR] = global.c_CONSTANTS.CONST_ERROR_DATA_DATABASE_ERROR;
            if (fn_callback) fn_callback(c_reply);
            return;
        }

        this.db.data.users[user_email] = user_data;
        this.db.write();

        let c_reply = {};
        c_reply[global.c_CONSTANTS.CONST_ERROR.toString()] = global.c_CONSTANTS.CONST_ERROR_NON;
        if (fn_callback) fn_callback(c_reply);
    }

    /**
     * Update a user record
     * @param {string} user_email - Email as the user key
     * @param {object} user_data - User data { sid, pwd, prm, isadmin }
     */
    fn_update_record(user_email, user_data, fn_callback) {
        if (!user_data || user_email === info_field) {
            return;
        }

        if (!user_data.sid || !user_data.pwd || !user_data.prm) {
            return;
        }

        user_data.isadmin = user_data.isadmin ?? false;

        if (!this.db.data.users[user_email]) {
            let c_reply = {};
            c_reply[global.c_CONSTANTS.CONST_ERROR_MSG] = "Account Not Found.";
            c_reply[global.c_CONSTANTS.CONST_ERROR] = global.c_CONSTANTS.CONST_ERROR_ACCOUNT_NOT_FOUND;
            if (fn_callback) fn_callback(c_reply);
            return;
        }

        this.db.data.users[user_email] = user_data;
        this.db.write();

        let c_reply = {};
        c_reply[global.c_CONSTANTS.CONST_ERROR.toString()] = global.c_CONSTANTS.CONST_ERROR_NON;
        if (fn_callback) fn_callback(c_reply);
    }

    /**
     * Get all user keys (email addresses)
     * @returns {string[]} - Array of user emails
     */
    fn_get_keys() {
        return Object.keys(this.db.data.users);
    }

    /**
     * Delete a user record by email
     * @param {string} key - Email of the user to delete
     */
    fn_delete_record(key) {
        if (key === info_field || !this.db.data.users[key]) {
            return;
        }
        delete this.db.data.users[key];
        this.db.write();
    }

    /**
     * Get a user record by email
     * @param {string} key - Email of the user
     * @returns {object|null} - The user record or null if not found
     */
    fn_get_record(key) {
        return this.db.data.users[key] || null;
    }

    /**
     * Get all non-admin users
     * @returns {object} - Object of non-admin user records keyed by email
     */
    fn_get_all_users() {
        const users = {};
        for (const [email, user] of Object.entries(this.db.data.users)) {
            if (user.isadmin === false) {
                users[email] = user;
            }
        }
        return users;
    }

    /**
     * Get a user by password (access code)
     * @param {string} accesscode - The password to match
     * @returns {object|null} - User record with email as acc property or null
     */
    fn_get_user_by_accesscode(accesscode) {
        for (const [email, user] of Object.entries(this.db.data.users)) {
            if (user.pwd === accesscode) {
                return { ...user, acc: email };
            }
        }
        return null;
    }

    /**
     * Get users by account SID
     * @param {number} sid - The account SID
     * @returns {object} - Object of user records with matching SID
     */
    fn_get_users_by_sid(sid) {
        const users = {};
        for (const [email, user] of Object.entries(this.db.data.users)) {
            if (user.sid === sid) {
                users[email] = user;
            }
        }
        return users;
    }

    /**
     * Sync database to disk
     */
    fn_sync_to_disk() {
        this.db.write();
    }
}

module.exports = {
    db_user
};
