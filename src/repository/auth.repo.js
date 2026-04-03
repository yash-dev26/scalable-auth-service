import UserModel from "../model/user.model.js";
import OTPModel from "../model/otp.model.js";
import SessionModel from "../model/session.model.js";

class AuthRepository {
    async findByUsernameOrEmail(username, email=null) {
        return UserModel.findOne({
            $or: [{ username }, { email }],
        });
    }

    async findByEmail(email) {
        return UserModel.findOne({ email });
    }

    async findById(id) {
        return UserModel.findById(id);
    }

    async register(userData) {
        const { username, email, hashedPassword } = userData;
        const newUser = new UserModel({ username, email, password: hashedPassword });
        await newUser.save();
        return newUser;
    } 
    
    async saveOTP(otpData) {
        const { email, user, otpHash, expiresAt } = otpData;

        await OTPModel.deleteMany({ email });
        
        const newOTP = new OTPModel({ email, user, otpHash, expiresAt });
        await newOTP.save();
        return newOTP;
    }

    async findOTPByEmail(email) {
        return OTPModel.findOne({ email }).sort({ createdAt: -1 });
    }

    async deleteOTPByEmail(email) {
        return OTPModel.deleteMany({ email });
    }

    async createSession(sessionData) {
        return SessionModel.create(sessionData);
    }

    async findActiveSessionsByUser(userId) {
        return SessionModel.find({ user: userId, revoked: false });
    }

    async updateSessionRefreshToken(sessionId, refreshTokenHash) {
        return SessionModel.findByIdAndUpdate(
            sessionId,
            { refreshToken: refreshTokenHash },
            { new: true }
        );
    }

    async revokeSessionById(sessionId) {
        return SessionModel.findByIdAndUpdate(
            sessionId,
            { revoked: true },
            { new: true }
        );
    }

    async revokeAllSessionsByUser(userId) {
        return SessionModel.updateMany({ user: userId }, { revoked: true });
    }

    async updatePasswordById(userId, hashedPassword) {
        return UserModel.findByIdAndUpdate(
            userId,
            { password: hashedPassword },
            { new: true }
        );
    }
}

export default AuthRepository;