const express = require("express");
const cors = require("cors");
const spotifyRoutes = require("./routes/spotify");

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors({ origin: "http://localhost:3000" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/callback", spotifyRoutes);

app.get("/api", (req, res) => {
    console.log("API endpoint hit!"); // Debugging log
    res.json({ message: "Hello from updated server!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
