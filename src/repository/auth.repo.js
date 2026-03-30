import UserModel from "../model/user.model.js";

class AuthRepository {
    async findByUsernameOrEmail(username, email) {
        return UserModel.findOne({
            $or: [{ username }, { email }],
        });
    }

    async register(userData) {
        const { username, email, hashedPassword } = userData;
        const newUser = new UserModel({ username, email, password: hashedPassword });
        await newUser.save();
        return newUser;
    }   
}

export default AuthRepository;