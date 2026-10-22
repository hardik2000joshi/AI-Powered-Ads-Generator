require("dotenv").config();
console.log("MONGODB_URI loaded:", Boolean(process.env.MONGODB_URI));
console.log("Clerk publishable key loaded:", Boolean(process.env.CLERK_PUBLISHABLE_KEY));
console.log("Clerk secret key loaded:", Boolean(process.env.CLERK_SECRET_KEY));

const {Agent, setGlobalDispatcher} = require("undici");
setGlobalDispatcher(new Agent({
connect: {
    family: 4,
}
}))
const app = require("./app");

const connectDB = require("./config/db");
connectDB();
const port = process.env.PORT || 3007;
app.listen(port, () => {
    console.log("Backend server runs on port ", port);
})


