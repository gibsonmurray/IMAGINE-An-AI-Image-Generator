/* --------------- DEPENDENCIES --------------- */

import path from "path";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";
import { MongoClient, ServerApiVersion } from "mongodb";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";

/* --------------- INITIALIZE SERVER --------------- */

const portNumber = process.argv[2];
process.stdin.setEncoding("utf8");

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;
app.listen(port);

// MONGO DB
dotenv.config();
const mongoUserName = process.env.MONGO_DB_USERNAME;
const mongoPassword = process.env.MONGO_DB_PASSWORD;

const databaseAndCollection = {
    db: process.env.MONGO_DB_NAME,
    collectionUsers: process.env.MONGO_COLLECTION_USERS,
};

const uri = `mongodb+srv://${mongoUserName}:${mongoPassword}@cluster0.qwti5qw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

// OPEN AI
const configuration = new Configuration({
    apiKey: process.env.OPENAI,
});

const openai = new OpenAIApi(configuration);

// // templates directory
// app.set("views", path.resolve(process.cwd(), "public", "templates"));

// // set view engine to display ejs
// app.set("view engine", "ejs");

// // start that jawn
// console.log(`Web server started and running at http://localhost:${portNumber}`);
// const prompt = "Stop to shutdown the server: ";
// process.stdout.write(prompt);

// // command line processing
// process.stdin.on("readable", async () => {
//     let dataInput = process.stdin.read();
//     if (dataInput !== null) {
//         let command = dataInput.trim();
//         // STOP SERVER COMMAND

//         if (command === "stop") {
//             console.log("Shutting down the server");
//             process.exit(0);

//             // CLEAR ALL USERS COMMAND
//         } else if (command === "clear users") {
//             const uri = `mongodb+srv://${mongoUserName}:${mongoPassword}@cluster0.qwti5qw.mongodb.net/?retryWrites=true&w=majority`;
//             const client = new MongoClient(uri, {
//                 useNewUrlParser: true,
//                 useUnifiedTopology: true,
//                 serverApi: ServerApiVersion.v1,
//             });
//             await client.connect();
//             const db = client.db(databaseAndCollection.db);
//             const collection = db.collection(
//                 databaseAndCollection.collectionUsers
//             );
//             const result = await collection.deleteMany({});
//             console.log(`${result.deletedCount} users(s) deleted`);

//             // INVALID COMMAND
//         }  else {
//             console.log(`Invalid command: ${command}`);
//         }
//         process.stdout.write(prompt);
//         process.stdin.resume();
//     }
// });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.resolve(process.cwd(), "public")));
app.use(cookieParser());

/* --------------- DISPLAY PAGES & INTERRACTION --------------- */

// display home page
app.get("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

//sign up user
app.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    if (username === "" || password === "") {
        return res.status(409).json({ message: "Invalid Username/Password" });
    }
    await client.connect();
    const db = client.db(databaseAndCollection.db);
    const collectionUsers = db.collection(
        databaseAndCollection.collectionUsers
    );

    // Check if the user already exists
    const existingUser = await collectionUsers.findOne({ username });

    if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Save the user in the database
    const userUsers = { username, password: hashedPassword };
    await collectionUsers.insertOne(userUsers);

    res.status(201).json({ message: "Sign up successful! Now Login!" });
    await client.close();
});

//login user
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    await client.connect();
    const db = client.db(databaseAndCollection.db);
    const collection = db.collection(databaseAndCollection.collectionUsers);
    // Find the user in the database
    const user = await collection.findOne({ username });

    // Check if the user exists and the password is correct
    if (user && (await bcrypt.compare(password, user.password))) {
        // Login successful, set cookie here
        res.cookie("username", username, { httpOnly: true }); // set cookie with httpOnly flag
        res.json({
            message: "Login successful",
            redirect: "/imagine",
        });
    } else {
        res.status(401).json({ message: "Invalid username or password" });
    }
    await client.close();
});

// load imagine page
app.get("/imagine", async (req, res) => {
        res.sendFile(path.join(process.cwd(), "public", "imagine.html"));
});

app.post("/logout", (req, res) => {
    res.clearCookie("username");
    res.json({ redirect: "/" });
});

/* --------------- OPEN AI IMAGE GENERATOR --------------- */

app.post("/imagine", async (req, res) => {
    try {
        const prompt = req.body.prompt;

        const aiResponse = await openai.createImage({
            prompt,
            n: 1,
            size: "1024x1024",
        });

        const image = aiResponse.data.data[0].url;
        res.send({ image });
    } catch (error) {
        console.error(error);
        res.status(500).send(
            error?.response.data.error.message || "Something went wrong"
        );
    }
});
