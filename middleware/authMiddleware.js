import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized" });

  try {
    const token = authHeader.split(" ")[1];
    // Log token to verify it is being sent
    // console.log("Token received:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Log decoded user to verify it's being decoded correctly
    // console.log("Decoded user:", decoded);

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalid or expired" });
  }
};

export default protect;

