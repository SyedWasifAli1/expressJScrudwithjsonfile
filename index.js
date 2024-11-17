const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || "data.json";

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Multer Configuration for Image Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Helper Function: Read Data from JSON
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const jsonData = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(jsonData);
};

// Helper Function: Write Data to JSON
const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Routes

// 1. Create (POST)
app.post("/api/products", upload.single("image"), (req, res) => {
  try {
    const { name, category, price } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const newProduct = { id: Date.now(), name, category, price, image };

    const data = readData();
    data.push(newProduct);
    writeData(data);

    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Read All (GET)
app.get("/api/products", (req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (error) {
    console.error("Error reading products:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 3. Read Single (GET by ID)
app.get("/api/products/:id", (req, res) => {
  try {
    const data = readData();
    const product = data.find((p) => p.id === parseInt(req.params.id));

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error reading product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 4. Update (PUT)
app.put("/api/products/:id", upload.single("image"), (req, res) => {
  try {
    const data = readData();
    const productIndex = data.findIndex((p) => p.id === parseInt(req.params.id));

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { name, category, price } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : data[productIndex].image;

    if (!name || !category || !price) {
      return res.status(400).json({ message: "All fields are required" });
    }

    data[productIndex] = { ...data[productIndex], name, category, price, image };
    writeData(data);

    res.json({ message: "Product updated successfully", product: data[productIndex] });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 5. Delete (DELETE)
app.delete("/api/products/:id", (req, res) => {
  try {
    const data = readData();
    const updatedData = data.filter((p) => p.id !== parseInt(req.params.id));

    if (data.length === updatedData.length) {
      return res.status(404).json({ message: "Product not found" });
    }

    writeData(updatedData);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
