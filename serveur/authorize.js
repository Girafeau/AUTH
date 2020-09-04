const bcrypt = require('bcrypt');
const users = require('../database/users');
const clients = require('../database/clients');
const codes = require('../database/codes');
const {v4: uuid} = require('uuid');
const validation = require('yup');
const addHours = require('date-fns/addHours');
const format = require('date-fns/formatISO');


module.exports = function(server) {

    const schema = validation.object().shape({
        user: validation.object().shape({
            email: validation.string().email().required(),
            password: validation.string().required()
        }),
        request: validation.object().shape({
            client_id: validation.string().required(),
            redirect_uri: validation.string().url().required(),
            response_type: validation.string().required(),
            grant_type: validation.string().required(),
            state: validation.string().nullable()
        })
    });

    server.post('/request/authorize', function (req, res, next) {
        schema.isValid(req.body).then(function (valid) {
            if (valid) {
                return next();
            } else {
                res.status(400).send({
                    success: false,
                    message: 'missing parameters'
                });
            }
        });
    }, function (req, res, next) {
        const {request} = req.body;
        if(request.grant_type == 'authorization_code') {
            return next();
        } else {
            res.status(400).send({
                success: false,
                message: 'invalid grant type'
            });
        }
    }, function (req, res, next) {
        const {request} = req.body;
        if(request.response_type == 'code') {
            return next();
        } else {
            res.status(400).send({
                success: false,
                message: 'invalid response type'
            });
        }
    }, async function (req, res, next) {
        const {user} = req.body;
        const object = await users.get(user.email);
        if (object) {
            res.locals.user_id = object._id;
            bcrypt.compare(user.password, object.password, function (err, result) {
                if (result) {
                    return next();
                } else {
                    res.status(400).send({
                        success: false,
                        message: 'invalid user'
                    });
                }
            });
        } else {
            res.status(400).send({
                success: false,
                message: 'invalid user'
            });
        }

    }, async function (req, res, next) {
        const {request} = req.body;
        const object = await clients.get(request.client_id);
        if (object) {
            res.locals.client_id = object._id;
            return next();
        } else {
            res.status(400).send({
                success: false,
                message: 'invalid client'
            });
        }
    }, async function (req, res) {
        const {request} = req.body;
        let expiration = format(addHours(new Date(), 1));
        const object = await codes.save({
            authorization_code: uuid(),
            expires_at: expiration,
            redirect_uri: request.redirect_uri,
            scope: 'access',
        }, res.locals.client_id, res.locals.user_id);
        if (object) {
            res.status(200).send({
                success: true,
                redirect_uri: object.redirect_uri,
                authorization_code: object.authorization_code
            });
        }
    });

}
