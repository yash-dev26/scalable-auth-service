import rateLimit from "express-rate-limit";

export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 5, // 5 attempts
    message: {
        message: "Too many attempts. Try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});

export const mediumLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        message: "Too many requests. Please slow down."
    }
});

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});