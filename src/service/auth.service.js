import argon2 from "argon2";
import jwt from "jsonwebtoken";
import config from "../config/server.config.js";

class AuthService {
    constructor(AuthRepository) {
        this.AuthRepository =  AuthRepository;
    }

    async register(userData) {
        const { username, email, password } = userData;

        const existingUser = await this.AuthRepository.findByUsernameOrEmail(username, email);
        if (existingUser) {
            return { error: true, status: 409, message: 'User already exists' };
        }
        const hashedPassword = await argon2.hash(password);
        const result = await this.AuthRepository.register({ username, email, hashedPassword });

        const token = jwt.sign({ userId: result._id }, config.jwtSecret, { expiresIn: '1d' });

        return {
            error: false,
            status: 201,
            message: 'User registered successfully',
            user: {
                username: result.username,
                email: result.email,
            },
            token
        };
    }
    async getMe(token) {
        const decoded = jwt.verify(token, config.jwtSecret);
        console.log('Decoded token:', decoded);
        const user = await this.AuthRepository.findById(decoded.userId);
        if (!user) {
            return { error: true, status: 404, message: 'User not found' };
        }
        return {
            error: false,
            status: 200,
            user: {
                username: user.username,
                email: user.email
            }
        };
    }
}

export default AuthService;