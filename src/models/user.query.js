import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

// this method execute just before inserting data into database
export const hashPassword = async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
};

// creating custom method 
export const isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

// creating tokens
export const accessTokenGenerator = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

export const refreshTokenGenerator = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
