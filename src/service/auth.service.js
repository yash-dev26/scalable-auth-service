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

        const accessToken = jwt.sign({ userId: result._id }, config.jwtSecret, { expiresIn: '15m' });

        const refreshToken = jwt.sign({ userId: result._id }, config.jwtSecret, { expiresIn: '7d' });

        return {
            error: false,
            status: 201,
            message: 'User registered successfully',
            user: {
                username: result.username,
                email: result.email,
            },
            accessToken,
            refreshToken
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
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwtSecret);
            const accessToken = jwt.sign({ userId: decoded.userId }, config.jwtSecret, { expiresIn: '15m' });
            const newRefreshToken = jwt.sign({ userId: decoded.userId }, config.jwtSecret, { expiresIn: '7d' });
            return {
                error: false,
                status: 200,
                accessToken,
                newRefreshToken
            };
        } catch (error) {
            console.error('Error refreshing token:', error);
            return { error: true, status: 401, message: 'Invalid refresh token' };
        } 
    }
}

export default AuthService;