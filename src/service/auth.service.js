import argon2 from "argon2";
import jwt from "jsonwebtoken";
import config from "../config/server.config.js";
import { transporter } from "../config/nodemailer.config.js";

class AuthService {
    constructor(AuthRepository) {
        this.AuthRepository =  AuthRepository;
    }
    async sendMail (to, subject, text, html){
      try {
        console.log(`Sending email to ${to} with subject "${subject}"`);
        const info = await transporter.sendMail({
                    from: `Auth App <${config.googleUser}>`,
          to,
          subject,
          text,
          html
        });
        console.log('Email sent successfully:', info.messageId);
                return info;
      } catch (error) {
        console.error('Error sending email:', error);
                throw error;
      }
    };

    async generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    }

    async createOTPhtml(otp) {
        return `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                <h2 style="color: #333;">Your OTP Code</h2>
                <p style="font-size: 18px; color: #555;">Use the following OTP to verify your account:</p>
                <div style="font-size: 24px; font-weight: bold; color: #007BFF; margin: 20px 0;">
                    ${otp}
                </div>
                <p style="font-size: 14px; color: #999;">This OTP is valid for 10 minutes.</p>
            </div>
        `;
    }

    async findActiveSessionByRefreshToken(userId, refreshToken) {
        const sessions = await this.AuthRepository.findActiveSessionsByUser(userId);


        // assuming multiple sessions per user, we need to check each session's refresh token hash against the provided refresh token
        for (const session of sessions) {
            const isMatch = await argon2.verify(session.refreshToken, refreshToken);
            if (isMatch) {
                return session;
            }
        }

        return null;
    }

    async createSessionAndTokens(userId, requestMeta = {}) {
        const { ipAddress = 'unknown', userAgent = 'unknown' } = requestMeta;

        const refreshToken = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
        const refreshTokenHash = await argon2.hash(refreshToken);

        const session = await this.AuthRepository.createSession({
            user: userId,
            refreshToken: refreshTokenHash,
            ipAddress,
            userAgent
        });

        const accessToken = jwt.sign({ userId, sessionId: session._id }, config.jwtSecret, { expiresIn: '15m' });

        return { accessToken, refreshToken };
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

        const otp = await this.generateOTP();
        const otpHtml = await this.createOTPhtml(otp);

        const otpHash = await argon2.hash(otp);
        await this.AuthRepository.saveOTP({ email, user: result._id, otpHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000)  });

        await this.sendMail(email, 'Verify Your Account', `Your OTP is: ${otp}`, otpHtml);

        return {
            error: false,
            status: 201,
            message: 'User registered successfully',
            user: {
                username: result.username,
                email: result.email,
                verified: result.verified
            }
        };
    }

    async login(credentials, requestMeta = {}) {
        const { username, email, password } = credentials;
        const { ipAddress = null, userAgent = null } = requestMeta;
        const user = await this.AuthRepository.findByUsernameOrEmail(username, email);
        if (!user) {
            return { error: true, status: 401, message: 'Invalid username/email or password' };
        }

        if (!user.verified) {
            return { error: true, status: 403, message: 'Account not verified. Please check your email for the OTP.' };
        }
        const passwordValid = await argon2.verify(user.password, password);
        if (!passwordValid) {
            return { error: true, status: 401, message: 'Invalid username/email or password' };
        }
        const { accessToken, refreshToken } = await this.createSessionAndTokens(user._id, { ipAddress, userAgent });
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
            await this.AuthRepository.updateSessionRefreshToken(session._id, newRefreshTokenHash);
    
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
                await this.AuthRepository.revokeSessionById(session._id);
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
            await this.AuthRepository.revokeAllSessionsByUser(decoded.userId);
            return { error: false, status: 200, message: 'Logged out from all sessions successfully' };
        } catch (error) {
            console.error('Error logging out from all sessions:', error);
            return { error: true, status: 500, message: 'Internal server error' };
        }   
    }

    async verifyOTP(otpPayload, requestMeta = {}) {
        try {
            const { email, otp } = otpPayload;
            const { ipAddress = null, userAgent = null } = requestMeta;
            const otpRecord = await this.AuthRepository.findOTPByEmail(email);

            if (!otpRecord) {
                return { error: true, status: 404, message: 'OTP not found' };
            }

            if (otpRecord.expiresAt < new Date()) {
                await this.AuthRepository.deleteOTPByEmail(email);
                return { error: true, status: 400, message: 'OTP expired' };
            }

            if (otpRecord.attempts >= 5) {
                await this.AuthRepository.deleteOTPByEmail(email);
                return { error: true, status: 429, message: 'Too many attempts. Request new OTP.' };
            }

            const isValidOTP = await argon2.verify(otpRecord.otpHash, otp);

            if (!isValidOTP) {
                otpRecord.attempts += 1;
                await otpRecord.save();

                return { error: true, status: 400, message: 'Invalid OTP' };
            }
            
            const user = await this.AuthRepository.findById(otpRecord.user);
            if (!user) {
                return { error: true, status: 404, message: 'User not found' };
            }
            user.verified = true;
            await user.save();
            await this.AuthRepository.deleteOTPByEmail(email);

            const { accessToken, refreshToken } = await this.createSessionAndTokens(user._id, { ipAddress, userAgent });

            return {
                error: false,
                status: 200,
                username: user.username,
                email: user.email,
                verified: user.verified,
                accessToken,
                refreshToken
            };
        } catch (error) {
            console.error('Error verifying OTP:', error);
            return { error: true, status: 500, message: 'Internal server error' };
        }
    }

    async forgotPassword(email) {
        try {
            const user = await this.AuthRepository.findByEmail(email);
            if (!user) {
                return { error: true, status: 404, message: 'User with this email not found' };
            }
            const otp = await this.generateOTP();
            const otpHtml = await this.createOTPhtml(otp);
            const otpHash = await argon2.hash(otp);
            await this.AuthRepository.saveOTP({ email, user: user._id, otpHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
            await this.sendMail(email, 'Password Reset OTP', `Your OTP for password reset is: ${otp}`, otpHtml);
            return { error: false, status: 200, message: 'OTP sent to email for password reset' };
        } catch (error) {
            console.error('Error initiating forgot password:', error);
            return { error: true, status: 500, message: 'Internal server error' };
        }   
    }

    async resetPassword(resetPayload) {
        try {
            const { email, otp, newPassword } = resetPayload;

            const user = await this.AuthRepository.findByEmail(email);
            if (!user) {
                return { error: true, status: 404, message: 'User with this email not found' };
            }

            const otpRecord = await this.AuthRepository.findOTPByEmail(email);
            if (!otpRecord) {
                return { error: true, status: 404, message: 'OTP record not found' };
            }

            const isValidOTP = await argon2.verify(otpRecord.otpHash, otp);
            if (!isValidOTP) {
                return { error: true, status: 400, message: 'Invalid OTP' };
            }

            const hashedPassword = await argon2.hash(newPassword);
            await this.AuthRepository.updatePasswordById(user._id, hashedPassword);
            await this.AuthRepository.deleteOTPByEmail(email);

            return { error: false, status: 200, message: 'Password reset successful' };
        } catch (error) {
            console.error('Error resetting password:', error);
            return { error: true, status: 500, message: 'Internal server error' };
        }
    }

}

export default AuthService;