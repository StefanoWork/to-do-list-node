import bcrypt from 'bcrypt';


const saltRounds = 10;

//Hash password
export async function hashPassword(password) {
  try {
    const hashedPassword =  await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (err) {
    console.log("Error hashing", err);
    throw err;
  }
}