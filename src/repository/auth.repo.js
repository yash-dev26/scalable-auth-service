import UserModel from "../model/user.model.js";

class AuthRepository {
    async findByUsernameOrEmail(username, email=null) {
        return UserModel.findOne({
            $or: [{ username }, { email }],
        });
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
}

export default AuthRepository;