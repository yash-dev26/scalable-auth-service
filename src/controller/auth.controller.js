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
        const result = await authService.register({ username, email, password });
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
        return res.status(201).json(responseData);

    } catch (error) {
        console.error('Error registering user:', error);
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
        const result = await authService.refreshToken(refreshToken);
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
        return res.status(201).json(responseData);
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ message: 'Internal server error' });
    }   
}