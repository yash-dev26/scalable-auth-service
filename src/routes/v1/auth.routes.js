import express from 'express';
import registerUser from '../../controller/auth.controller.js';

const authRouter = express.Router();

authRouter.post('/register', registerUser);

export default authRouter;