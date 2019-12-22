import { Router } from 'express';

import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

/* MIDDLEWARES */
import { authMiddleware, authCreateSession } from './app/middlewares/auth';
import { createUser, updateUser } from './app/middlewares/UserMiddleware';
import { createEvent, updateEvent } from './app/middlewares/EventMiddleware';

/* CONTROLLERS */
import FileController from './app/controllers/FileController';
import EventController from './app/controllers/EventController';

const routes = new Router();
const uploads = multer(multerConfig);

/* USER AND SESSION */

/**
 * @api {post} /users Signup
 * @apiName createUser
 * @apiGroup Users
 *
 * @apiParam {String} name Nome do usuário.
 * @apiParam {String} email E-mail válido do usuário.
 * @apiParam {String} password Senha secreta do usuário (6-10 caracteres).
 *
 * @apiSuccess {Object} user Objeto contendo o id, nome, e-mail e avatar do usuário.
 * @apiSuccess {String} token Token do usuário baseado em senha criptografada.
 *
 * @apiParamExample {json} Request (Exemplo)
 *     {
 *	     "name": "João de Deus",
 *       "email": "joao@gmail.com",
 *       "password": "123456"
 *     }
 *
 * @apiSuccessExample {json} Response (Exemplo)
 *    HTTP/1.1 201 OK
 *    {
 *       "user": {
 *         "id": 3,
 *         "name": "João de Deus",
 *         "email": "joao@gmail.com",
 *         "avatar": null
 *       },
 *       "token": "yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiaWF0IjoxNTc2ODA0MjQ5LCJleHAiOjE1Nzc0MDkwNDl9.YleBKQJcJsGVXrivKfkyNK6QN4p7H4QBlCqEFUVtrXg"
 *    }
 */
routes.post('/users', createUser, UserController.store);

/**
 * @api {post} /sessions Signin
 * @apiName authCreateSession
 * @apiGroup Users
 *
 * @apiParam {String} email E-mail válido do usuário.
 * @apiParam {String} password Senha secreta do usuário (6-10 caracteres).
 *
 * @apiSuccess {Object} user Objeto contendo o id, nome, e-mail e avatar do usuário (id, url e path do imagem).
 * @apiSuccess {String} token Token do usuário baseado em senha criptografada.
 *
 * @apiParamExample {json} Request (Exemplo)
 *     {
 *       "email": "joao@gmail.com",
 *       "password": "123456"
 *     }
 *
 * @apiSuccessExample {json} Response (Exemplo)
 *    HTTP/1.1 201 OK
 *    {
 *       "user": {
 *         "id": 3,
 *         "name": "João de Deus",
 *         "email": "joao@gmail.com",
 *         "avatar": {
 *           "url": "http://localhost:3333/files/07af4515d5c29250d329492a4167b3d0.jpg",
 *           "id": 1,
 *            "path": "07af4515d5c29250d329492a4167b3d0.jpg"
 *         }
 *       },
 *       "token": "yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiaWF0IjoxNTc2ODA0MjQ5LCJleHAiOjE1Nzc0MDkwNDl9.YleBKQJcJsGVXrivKfkyNK6QN4p7H4QBlCqEFUVtrXg"
 *    }
 */
routes.post('/sessions', authCreateSession, SessionController.store);

routes.use(authMiddleware);

/* USER */
routes.put('/users', updateUser, UserController.update);

/* Event */
routes.post('/events', createEvent, EventController.store);
routes.get('/events', EventController.index);
routes.put('/events/:id', updateEvent, EventController.update);
routes.delete('/events/:id', EventController.delete);

/**
 * @api {get} /events/:id Request Event
 * @apiName EventController.show
 * @apiGroup Events
 *
 *
 * @apiSuccess {Number} id ID único do evento.
 * @apiSuccess {String} title Título do evento.
 * @apiSuccess {String} location Localização do evento.
 * @apiSuccess {String} date Data do evento.
 * @apiSuccess {Object} Owner Criado do evento.
 * @apiSuccess {Boolean} past Parâmetro que mostra se o evento já passou ou não.
 * @apiSuccess {Boolean} cancelable Parâmetro que mostra se o evento pode ser cancelado ou não.
 * @apiSuccess {String} canceled_at Data de cancelamento do evento.
 * @apiSuccess {Object} banner Objeto que mostra id, url e path do evento.
 *
 *
 * @apiSuccessExample {json} Response (Example):
 *    HTTP/1.1 200 OK
 *   {
 *     "id": "2",
 *     "title": "Vue.js summit 2019",
 *     "description": "O Community Challenge é uma competição global criada pelo Developer Circles from Facebook. Seu desafio é criar um software que utilize pelo menos uma das três tecnologias: React360, Spark AR ou Jogos em HTML5.\n",
 *     "location": "São Paulo/SP - Av. Paulista, 1234",
 *     "date": "2019-12-20T21:00:00.000Z",
 *     "owner": {
 *       "id": 1,
 *       "name": "Adriano Souza",
 *       "avatar": {
 *         "url": "http://localhost:3333/files/07af4515d5c29250d329492a4167b3d0.jpg",
 *         "id": 1,
 *         "path": "07af4515d5c29250d329492a4167b3d0.jpg"
 *       }
 *     },
 *     "past": false,
 *     "cancelable": true,
 *     "canceled_at": null,
 *     "banner": {
 *       "url": "http://localhost:3333/files/665745fb5f90a3fdf2ef7a3edc2ad419.jpeg",
 *       "id": 2,
 *       "path": "665745fb5f90a3fdf2ef7a3edc2ad419.jpeg"
 *     }
 *   }
 */
routes.get('/events/:id', EventController.show);

/* FILES */
routes.post('/files', uploads.single('file'), FileController.store);

export default routes;
