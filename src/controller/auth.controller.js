import AuthRepository from '../repository/auth.repo.js';
import AuthService from '../service/auth.service.js';
const authService = new AuthService(new AuthRepository());

export async function registerUser(req, res) {
    try {
        const { username, email, password } = req.body;
        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const result = await authService.register(
            { username, email, password },
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }
        return res.status(201).json(result);

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function login(req, res) {
    try {
        const { username, email, password } = req.body;
        if (!username && !email || !password) {
            return res.status(400).json({ message: 'Username or email and password are required' });
        }

        const result = await authService.login(
            { username, email, password },
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );

        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const responseData = { ...result };
        delete responseData.refreshToken;
    return res.status(200).json(responseData);
        
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getMe(req, res) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const result = await authService.getMe(token);
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function refreshToken(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const result = await authService.refreshToken(
            refreshToken,
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }
        res.cookie('refreshToken', result.newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        const responseData = { ...result };
        delete responseData.newRefreshToken;
        return res.status(200).json(responseData);
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ message: 'Internal server error' });
    }   
}

export async function logout(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const result = await authService.logout(refreshToken);
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        } 
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
} 

export async function logoutAll(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const result = await authService.logoutAll(refreshToken);
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }
        res.clearCookie('refreshToken');
        return res.status(200).json({ message: 'Logged out from all sessions successfully' });
    } catch (error) {
        console.error('Error logging out from all sessions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function verifyOTP(req, res) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }
        const result = await authService.verifyOTP(
            { email, otp },
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );
        if (result.error) {
            return res.status(result.status).json({ message: result.message });
        }
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const responseData = { ...result };
        delete responseData.refreshToken;

        return res.status(200).json({
            message: 'Account verified successfully',
            user: {
                username: responseData.username,
                email: responseData.email,
                verified: responseData.verified
            },
            accessToken: responseData.accessToken
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}