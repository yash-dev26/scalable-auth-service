import argon2 from "argon2";
import jwt from "jsonwebtoken";
import config from "../config/server.config.js";
import SessionModel from "../model/session.model.js";

class AuthService {
    constructor(AuthRepository) {
        this.AuthRepository =  AuthRepository;
    }

    async findActiveSessionByRefreshToken(userId, refreshToken) {
        // argon2 hashes are salted, so compare using verify against each active session hash.
        const sessions = await SessionModel.find({ user: userId, revoked: false });


        // assuming multiple sessions per user, we need to check each session's refresh token hash against the provided refresh token
        for (const session of sessions) {
            const isMatch = await argon2.verify(session.refreshToken, refreshToken);
            if (isMatch) {
                return session;
            }
        }

        return null;
    }

    async register(userData, requestMeta = {}) {
        const { username, email, password } = userData;
        const { ipAddress = null, userAgent = null } = requestMeta;

        const existingUser = await this.AuthRepository.findByUsernameOrEmail(username, email);
        if (existingUser) {
            return { error: true, status: 409, message: 'User already exists' };
        }
        const hashedPassword = await argon2.hash(password);
        const result = await this.AuthRepository.register({ username, email, hashedPassword });

        

        const refreshToken = jwt.sign({ userId: result._id }, config.jwtSecret, { expiresIn: '7d' });
       
        const refreshTokenHash = await argon2.hash(refreshToken);
        const session = await SessionModel.create({
            user: result._id,
            refreshToken: refreshTokenHash,
            ipAddress,
            userAgent
        });

        const accessToken = jwt.sign({ userId: result._id, sessionId: session._id }, config.jwtSecret, { expiresIn: '15m' });

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

    async login(credentials, requestMeta = {}) {
        const { username, email, password } = credentials;
        const { ipAddress = null, userAgent = null } = requestMeta;
        const user = await this.AuthRepository.findByUsernameOrEmail(username, email);
        if (!user) {
            return { error: true, status: 401, message: 'Invalid username/email or password' };
        }
        const passwordValid = await argon2.verify(user.password, password);
        if (!passwordValid) {
            return { error: true, status: 401, message: 'Invalid username/email or password' };
        }
        const refreshToken = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: '7d' });
        const refreshTokenHash = await argon2.hash(refreshToken);
        const session = await SessionModel.create({
            user: user._id,
            refreshToken: refreshTokenHash,
            ipAddress,
            userAgent
        });
        const accessToken = jwt.sign({ userId: user._id, sessionId: session._id }, config.jwtSecret, { expiresIn: '15m' }); 
        return {
            error: false,
            status: 200,
            message: 'Login successful',
            user: {
                username: user.username,
                email: user.email,
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
            const session = await this.findActiveSessionByRefreshToken(decoded.userId, refreshToken);

            if (!session) {
                return { error: true, status: 401, message: 'Invalid refresh token or session revoked' };
            }

            const accessToken = jwt.sign({ userId: decoded.userId }, config.jwtSecret, { expiresIn: '15m' });
            const newRefreshToken = jwt.sign({ userId: decoded.userId }, config.jwtSecret, { expiresIn: '7d' });
            
            // Update the session with the new refresh token hash
            const newRefreshTokenHash = await argon2.hash(newRefreshToken);
            session.refreshToken = newRefreshTokenHash;
            await session.save();
    
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

    async logout(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwtSecret);
            const session = await this.findActiveSessionByRefreshToken(decoded.userId, refreshToken);

            if (session) {
                session.revoked = true;
                await session.save();
            }
            return { error: false, status: 200, message: 'Logged out successfully' };
        } catch (error) {
            console.error('Error logging out:', error);
            return { error: true, status: 500, message: 'Internal server error' };
        }
    }

    async logoutAll(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwtSecret);
            await SessionModel.updateMany({ user: decoded.userId }, { revoked: true });
            return { error: false, status: 200, message: 'Logged out from all sessions successfully' };
        } catch (error) {
            console.error('Error logging out from all sessions:', error);
            return { error: true, status: 500, message: 'Internal server error' };
        }   
    }
}

export default AuthService;