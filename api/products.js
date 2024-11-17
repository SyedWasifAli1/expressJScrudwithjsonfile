const multer = require("multer");
const fs = require("fs");

// Multer configuration for file uploads
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

const DATA_FILE = "data.json";

// Helper functions to read and write data
const readData = () => {
  const jsonData = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(jsonData);
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// API handler for POST and GET methods
module.exports = async (req, res) => {
  if (req.method === "POST") {
    // Handle POST request (Add new product)
    return new Promise((resolve, reject) => {
      upload.single("image")(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          const { name, category, price } = req.body;
          const image = req.file ? `/uploads/${req.file.filename}` : null;

          const newProduct = { id: Date.now(), name, category, price, image };
          const data = readData();
          data.push(newProduct);
          writeData(data);

          res.status(201).json({ message: "Product added successfully", product: newProduct });
          resolve();
        }
      });
    });
  } else if (req.method === "GET") {
    // Handle GET request (Fetch products)
    const data = readData();
    res.json(data);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
};
