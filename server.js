import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
dotenv.config()

const app = express()

app.use(cors({
  origin: "https://ironfurry.github.io",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}))

app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ❤️"))
  .catch(console.error)

const MessageSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  sender: String,
  recipient: String,
  message: String,
  createdAt: { type: Date, default: Date.now, expires: 86400 } // auto-delete after 24h
})

const Message = mongoose.model("Message", MessageSchema)

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// CREATE
app.post("/create", async (req, res) => {
  const { sender, recipient, message } = req.body
  const code = generateCode()
  await Message.create({ code, sender, recipient, message })
  res.json({ code })
})

// READ + DELETE
app.post("/read", async (req, res) => {
  const { code } = req.body
  const msg = await Message.findOneAndDelete({ code })

  if (!msg) {
    return res.status(404).json({ error: "Invalid or expired" })
  }

  res.json(msg)
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 💗`)
})

