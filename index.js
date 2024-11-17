const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

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

// Path to JSON File
const DATA_FILE = "data.json";

// Helper Function: Read Data from JSON
const readData = () => {
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
  const { name, category, price } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const newProduct = { id: Date.now(), name, category, price, image };
  const data = readData();

  data.push(newProduct);
  writeData(data);

  res.status(201).json({ message: "Product added successfully", product: newProduct });
});

// 2. Read All (GET)
app.get("/api/products", (req, res) => {
  const data = readData();
  res.json(data);
});

// 3. Read Single (GET by ID)
app.get("/api/products/:id", (req, res) => {
  const data = readData();
  const product = data.find((p) => p.id === parseInt(req.params.id));

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
});

// 4. Update (PUT)
app.put("/api/products/:id", upload.single("image"), (req, res) => {
  const data = readData();
  const productIndex = data.findIndex((p) => p.id === parseInt(req.params.id));

  if (productIndex === -1) {
    return res.status(404).json({ message: "Product not found" });
  }

  const { name, category, price } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : data[productIndex].image;

  data[productIndex] = { ...data[productIndex], name, category, price, image };
  writeData(data);

  res.json({ message: "Product updated successfully", product: data[productIndex] });
});

// 5. Delete (DELETE)
app.delete("/api/products/:id", (req, res) => {
  const data = readData();
  const updatedData = data.filter((p) => p.id !== parseInt(req.params.id));

  if (data.length === updatedData.length) {
    return res.status(404).json({ message: "Product not found" });
  }

  writeData(updatedData);
  res.json({ message: "Product deleted successfully" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
