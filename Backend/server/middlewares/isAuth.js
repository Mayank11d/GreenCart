import jwt from "jsonwebtoken";

export const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({  
                success: false, 
                message: "Not authorized, token not found" 
            });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decodedToken.id;
        next();
    } catch (error) {
        console.error("Authentication error:", error.message);
        return res.status(401).json({ 
            success: false, 
            message: "Not authorized, token failed" 
        });
    }
};