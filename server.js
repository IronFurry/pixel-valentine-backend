import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()

// ---------- MIDDLEWARE ----------
app.use(cors({
  origin: "https://ironfurry.github.io",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: false
}))

app.use(express.json())

// ---------- DATABASE ----------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ❤️"))
  .catch(console.error)

// ---------- SCHEMAS ----------

// Messages (temporary, auto-deleted)
const MessageSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  sender: String,
  recipient: String,
  message: String,
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24h TTL
})

const Message = mongoose.model("Message", MessageSchema)

// Stats (permanent)
const StatsSchema = new mongoose.Schema({
  totalMessages: { type: Number, default: 0 }
})

const Stats = mongoose.model("Stats", StatsSchema)

// ---------- HELPERS ----------
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ---------- ROUTES ----------

// CREATE MESSAGE
app.post("/create", async (req, res) => {
  try {
    const { sender, recipient, message } = req.body
    const code = generateCode()

    await Message.create({ code, sender, recipient, message })

    // Increment global counter
    await Stats.findOneAndUpdate(
      {},
      { $inc: { totalMessages: 1 } },
      { upsert: true }
    )

    res.json({ code })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

// READ MESSAGE (one-time)
app.post("/read", async (req, res) => {
  try {
    const { code } = req.body
    const msg = await Message.findOneAndDelete({ code })

    if (!msg) {
      return res.status(404).json({ error: "Invalid or expired" })
    }

    res.json(msg)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

// MESSAGE COUNT (stable)
app.get("/stats", async (req, res) => {
  try {
    const stats = await Stats.findOne()
    res.json({ count: stats?.totalMessages || 0 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Server error" })
  }
})

// ---------- SERVER ----------
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 💗`)
})
