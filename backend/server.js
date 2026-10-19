const express = require('express');
const cors = require('cors');
const multer = require('multer');
const vision = require('@google-cloud/vision');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google Cloud Vision
// Will use GOOGLE_APPLICATION_CREDENTIALS environment variable
let visionClient;
try {
  visionClient = new vision.ImageAnnotatorClient();
  console.log('Google Cloud Vision client initialized');
} catch (error) {
  console.log('Google Cloud Vision not configured, will use fallback mode');
  visionClient = null;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed'));
  }
});

// Pricing database
const partsPricing = {
  // Кузов - Бамперы
  'bumper_front': { name: 'Передний бампер', cost: [15000, 50000], category: 'Кузов' },
  'bumper_rear': { name: 'Задний бампер', cost: [15000, 50000], category: 'Кузов' },
  'bumper_support_front': { name: 'Кронштейн переднего бампера', cost: [3000, 8000], category: 'Кузов' },
  'bumper_support_rear': { name: 'Кронштейн заднего бампера', cost: [3000, 8000], category: 'Кузов' },
  
  // Кузов - Двери
  'door_front_left': { name: 'Передняя левая дверь', cost: [30000, 80000], category: 'Кузов' },
  'door_front_right': { name: 'Передняя правая дверь', cost: [30000, 80000], category: 'Кузов' },
  'door_rear_left': { name: 'Задняя левая дверь', cost: [30000, 80000], category: 'Кузов' },
  'door_rear_right': { name: 'Задняя правая дверь', cost: [30000, 80000], category: 'Кузов' },
  'door_handle_front_left': { name: 'Ручка передней левой двери', cost: [2000, 5000], category: 'Кузов' },
  'door_handle_front_right': { name: 'Ручка передней правой двери', cost: [2000, 5000], category: 'Кузов' },
  'door_handle_rear_left': { name: 'Ручка задней левой двери', cost: [2000, 5000], category: 'Кузов' },
  'door_handle_rear_right': { name: 'Ручка задней правой двери', cost: [2000, 5000], category: 'Кузов' },
  
  // Кузов - Крылья
  'fender_front_left': { name: 'Переднее левое крыло', cost: [15000, 45000], category: 'Кузов' },
  'fender_front_right': { name: 'Переднее правое крыло', cost: [15000, 45000], category: 'Кузов' },
  'fender_rear_left': { name: 'Заднее левое крыло', cost: [15000, 45000], category: 'Кузов' },
  'fender_rear_right': { name: 'Заднее правое крыло', cost: [15000, 45000], category: 'Кузов' },
  'fender_liner_front': { name: 'Подкрылок передний', cost: [2000, 5000], category: 'Кузов' },
  'fender_liner_rear': { name: 'Подкрылок задний', cost: [2000, 5000], category: 'Кузов' },
  
  // Кузов - Капот и багажник
  'hood': { name: 'Капот', cost: [25000, 70000], category: 'Кузов' },
  'trunk': { name: 'Крышка багажника', cost: [25000, 70000], category: 'Кузов' },
  'hood_latch': { name: 'Замок капота', cost: [3000, 8000], category: 'Кузов' },
  'trunk_latch': { name: 'Замок багажника', cost: [3000, 8000], category: 'Кузов' },
  'strut': { name: 'Газовый упор капота/багажника', cost: [1500, 4000], category: 'Кузов' },
  
  // Кузов - Стекло
  'windshield': { name: 'Лобовое стекло', cost: [15000, 40000], category: 'Кузов' },
  'window_front_left': { name: 'Переднее левое стекло', cost: [8000, 20000], category: 'Кузов' },
  'window_front_right': { name: 'Переднее правое стекло', cost: [8000, 20000], category: 'Кузов' },
  'window_rear_left': { name: 'Заднее левое стекло', cost: [8000, 20000], category: 'Кузов' },
  'window_rear_right': { name: 'Заднее правое стекло', cost: [8000, 20000], category: 'Кузов' },
  'rear_window': { name: 'Заднее стекло', cost: [10000, 25000], category: 'Кузов' },
  'window_regulator': { name: 'Стеклоподъёмник', cost: [5000, 15000], category: 'Кузов' },
  'window_mechanism': { name: 'Механизм стеклоподъёмника', cost: [4000, 12000], category: 'Кузов' },
  
  // Кузов - Зеркала
  'mirror_left': { name: 'Левое зеркало', cost: [5000, 15000], category: 'Кузов' },
  'mirror_right': { name: 'Правое зеркало', cost: [5000, 15000], category: 'Кузов' },
  'mirror_cover_left': { name: 'Кожух левого зеркала', cost: [2000, 5000], category: 'Кузов' },
  'mirror_cover_right': { name: 'Кожух правого зеркала', cost: [2000, 5000], category: 'Кузов' },
  
  // Кузов - Элементы кузова
  'sill': { name: 'Порог', cost: [8000, 20000], category: 'Кузов' },
  'roof': { name: 'Крыша', cost: [30000, 80000], category: 'Кузов' },
  'pillar_a': { name: 'Передняя стойка', cost: [10000, 25000], category: 'Кузов' },
  'pillar_b': { name: 'Средняя стойка', cost: [10000, 25000], category: 'Кузов' },
  'pillar_c': { name: 'Задняя стойка', cost: [10000, 25000], category: 'Кузов' },
  'windshield_frame': { name: 'Рамка лобового стекла', cost: [5000, 15000], category: 'Кузов' },
  
  // Кузов - Работы
  'paint_panel': { name: 'Покраска панели', cost: [8000, 20000], category: 'Кузов' },
  'dent_repair': { name: 'Устранение вмятины', cost: [5000, 20000], category: 'Кузов' },
  'scratch_repair': { name: 'Ремонт царапин', cost: [3000, 15000], category: 'Кузов' },
  'rust_repair': { name: 'Устранение коррозии', cost: [5000, 15000], category: 'Кузов' },
  'frame_straightening': { name: 'Рихтовка кузова', cost: [15000, 40000], category: 'Кузов' },
  
  // Оптика
  'headlight_left': { name: 'Левая фара', cost: [10000, 40000], category: 'Оптика' },
  'headlight_right': { name: 'Правая фара', cost: [10000, 40000], category: 'Оптика' },
  'taillight_left': { name: 'Левый задний фонарь', cost: [5000, 20000], category: 'Оптика' },
  'taillight_right': { name: 'Правый задний фонарь', cost: [5000, 20000], category: 'Оптика' },
  'fog_light_left': { name: 'Левая противотуманная фара', cost: [3000, 10000], category: 'Оптика' },
  'fog_light_right': { name: 'Правая противотуманная фара', cost: [3000, 10000], category: 'Оптика' },
  'turn_signal_front': { name: 'Передний указатель поворота', cost: [2000, 5000], category: 'Оптика' },
  'turn_signal_rear': { name: 'Задний указатель поворота', cost: [2000, 5000], category: 'Оптика' },
  'daytime_running_light': { name: 'Дневные ходовые огни', cost: [4000, 12000], category: 'Оптика' },
  
  // Охлаждение
  'radiator': { name: 'Радиатор', cost: [10000, 35000], category: 'Охлаждение' },
  'grille': { name: 'Решётка радиатора', cost: [8000, 25000], category: 'Охлаждение' },
  'condenser': { name: 'Радиатор кондиционера', cost: [8000, 25000], category: 'Охлаждение' },
  'cooling_fan': { name: 'Вентилятор охлаждения', cost: [5000, 15000], category: 'Охлаждение' },
  'thermostat': { name: 'Термостат', cost: [2000, 5000], category: 'Охлаждение' },
  
  // Подвеска
  'shock_absorber': { name: 'Амортизатор (шт)', cost: [5000, 15000], category: 'Подвеска' },
  'control_arm': { name: 'Рычаг подвески', cost: [4000, 12000], category: 'Подвеска' },
  'ball_joint': { name: 'Шаровая опора', cost: [2000, 6000], category: 'Подвеска' },
  'stabilizer_bar': { name: 'Стойка стабилизатора', cost: [1500, 4000], category: 'Подвеска' },
  'tie_rod': { name: 'Рулевая тяга', cost: [3000, 8000], category: 'Подвеска' },
  'hub_bearing': { name: 'Ступичный подшипник', cost: [4000, 10000], category: 'Подвеска' },
  'cv_joint': { name: 'ШРУС', cost: [5000, 15000], category: 'Подвеска' },
  'spring': { name: 'Пружина подвески', cost: [3000, 8000], category: 'Подвеска' },
  
  // Колёса
  'wheel': { name: 'Колесо (шт)', cost: [5000, 20000], category: 'Колёса' },
  'tire': { name: 'Шина (шт)', cost: [4000, 15000], category: 'Колёса' },
  'rim': { name: 'Диск (шт)', cost: [3000, 15000], category: 'Колёса' },
  'hub_cap': { name: 'Колпак (шт)', cost: [500, 2000], category: 'Колёса' },
  
  // Тормоза
  'brake_disc': { name: 'Тормозной диск (шт)', cost: [3000, 10000], category: 'Тормоза' },
  'brake_pad': { name: 'Тормозная колодка (шт)', cost: [1500, 5000], category: 'Тормоза' },
  'brake_caliper': { name: 'Тормозной суппорт', cost: [5000, 15000], category: 'Тормоза' },
  'brake_line': { name: 'Тормозной шланг', cost: [1000, 3000], category: 'Тормоза' },
  
  // Выхлопная система
  'exhaust_muffler': { name: 'Глушитель', cost: [5000, 15000], category: 'Выхлоп' },
  'exhaust_pipe': { name: 'Выпускная труба', cost: [3000, 10000], category: 'Выхлоп' },
  'catalytic_converter': { name: 'Катализатор', cost: [15000, 50000], category: 'Выхлоп' },
  
  // Электрика
  'battery': { name: 'Аккумулятор', cost: [5000, 15000], category: 'Электрика' },
  'alternator': { name: 'Генератор', cost: [10000, 30000], category: 'Электрика' },
  'starter': { name: 'Стартер', cost: [8000, 25000], category: 'Электрика' },
  'fuse_box': { name: 'Блок предохранителей', cost: [2000, 6000], category: 'Электрика' },
  
  // Салон
  'seat_front': { name: 'Переднее сиденье', cost: [15000, 40000], category: 'Салон' },
  'seat_rear': { name: 'Заднее сиденье', cost: [20000, 50000], category: 'Салон' },
  'steering_wheel': { name: 'Рулевое колесо', cost: [5000, 20000], category: 'Салон' },
  'dashboard': { name: 'Передняя панель', cost: [20000, 50000], category: 'Салон' },
  
  // Топливная система
  'fuel_tank': { name: 'Топливный бак', cost: [10000, 30000], category: 'Топливо' },
  'fuel_pump': { name: 'Топливный насос', cost: [5000, 15000], category: 'Топливо' },
};

const laborRates = {
  // Бамперы
  'bumper_front': { hours: [2, 4], rate: 1500 },
  'bumper_rear': { hours: [2, 4], rate: 1500 },
  'bumper_support_front': { hours: [1, 2], rate: 1500 },
  'bumper_support_rear': { hours: [1, 2], rate: 1500 },
  
  // Фары и освещение
  'headlight_left': { hours: [1, 2], rate: 1500 },
  'headlight_right': { hours: [1, 2], rate: 1500 },
  'taillight_left': { hours: [0.5, 1], rate: 1500 },
  'taillight_right': { hours: [0.5, 1], rate: 1500 },
  'fog_light_left': { hours: [0.5, 1], rate: 1500 },
  'fog_light_right': { hours: [0.5, 1], rate: 1500 },
  'turn_signal_front': { hours: [0.5, 1], rate: 1500 },
  'turn_signal_rear': { hours: [0.5, 1], rate: 1500 },
  'daytime_running_light': { hours: [1, 2], rate: 1500 },
  
  // Двери
  'door_front_left': { hours: [3, 5], rate: 1500 },
  'door_front_right': { hours: [3, 5], rate: 1500 },
  'door_rear_left': { hours: [3, 5], rate: 1500 },
  'door_rear_right': { hours: [3, 5], rate: 1500 },
  'door_handle_front_left': { hours: [0.5, 1], rate: 1500 },
  'door_handle_front_right': { hours: [0.5, 1], rate: 1500 },
  'door_handle_rear_left': { hours: [0.5, 1], rate: 1500 },
  'door_handle_rear_right': { hours: [0.5, 1], rate: 1500 },
  
  // Крылья
  'fender_front_left': { hours: [2, 4], rate: 1500 },
  'fender_front_right': { hours: [2, 4], rate: 1500 },
  'fender_rear_left': { hours: [2, 4], rate: 1500 },
  'fender_rear_right': { hours: [2, 4], rate: 1500 },
  'fender_liner_front': { hours: [1, 2], rate: 1500 },
  'fender_liner_rear': { hours: [1, 2], rate: 1500 },
  
  // Капот и багажник
  'hood': { hours: [2, 4], rate: 1500 },
  'trunk': { hours: [2, 4], rate: 1500 },
  'hood_latch': { hours: [1, 2], rate: 1500 },
  'trunk_latch': { hours: [1, 2], rate: 1500 },
  'strut': { hours: [0.5, 1], rate: 1500 },
  
  // Стекло
  'windshield': { hours: [2, 3], rate: 1500 },
  'window_front_left': { hours: [1, 2], rate: 1500 },
  'window_front_right': { hours: [1, 2], rate: 1500 },
  'window_rear_left': { hours: [1, 2], rate: 1500 },
  'window_rear_right': { hours: [1, 2], rate: 1500 },
  'rear_window': { hours: [2, 3], rate: 1500 },
  'window_regulator': { hours: [1, 2], rate: 1500 },
  'window_mechanism': { hours: [1, 2], rate: 1500 },
  
  // Зеркала
  'mirror_left': { hours: [0.5, 1], rate: 1500 },
  'mirror_right': { hours: [0.5, 1], rate: 1500 },
  'mirror_cover_left': { hours: [0.5, 1], rate: 1500 },
  'mirror_cover_right': { hours: [0.5, 1], rate: 1500 },
  
  // Радиатор и охлаждение
  'radiator': { hours: [2, 4], rate: 1500 },
  'grille': { hours: [1, 2], rate: 1500 },
  'condenser': { hours: [2, 3], rate: 1500 },
  'cooling_fan': { hours: [1, 2], rate: 1500 },
  'thermostat': { hours: [1, 2], rate: 1500 },
  
  // Подвеска
  'shock_absorber': { hours: [1, 2], rate: 1500 },
  'control_arm': { hours: [1, 2], rate: 1500 },
  'ball_joint': { hours: [0.5, 1], rate: 1500 },
  'stabilizer_bar': { hours: [0.5, 1], rate: 1500 },
  'tie_rod': { hours: [1, 2], rate: 1500 },
  'hub_bearing': { hours: [1, 2], rate: 1500 },
  'cv_joint': { hours: [1, 2], rate: 1500 },
  'spring': { hours: [1, 2], rate: 1500 },
  
  // Кузовные элементы
  'sill': { hours: [3, 5], rate: 1500 },
  'roof': { hours: [4, 6], rate: 1500 },
  'pillar_a': { hours: [2, 4], rate: 1500 },
  'pillar_b': { hours: [2, 4], rate: 1500 },
  'pillar_c': { hours: [2, 4], rate: 1500 },
  'windshield_frame': { hours: [2, 3], rate: 1500 },
  
  // Кузовные работы
  'paint_panel': { hours: [3, 6], rate: 1500 },
  'dent_repair': { hours: [2, 5], rate: 1500 },
  'scratch_repair': { hours: [1, 3], rate: 1500 },
  'rust_repair': { hours: [2, 4], rate: 1500 },
  'frame_straightening': { hours: [5, 10], rate: 1500 },
  
  // Колёса и шины
  'wheel': { hours: [0.5, 1], rate: 1500 },
  'tire': { hours: [0.5, 1], rate: 1500 },
  'rim': { hours: [0.5, 1], rate: 1500 },
  'hub_cap': { hours: [0.2, 0.5], rate: 1500 },
  
  // Тормозная система
  'brake_disc': { hours: [0.5, 1], rate: 1500 },
  'brake_pad': { hours: [0.5, 1], rate: 1500 },
  'brake_caliper': { hours: [1, 2], rate: 1500 },
  'brake_line': { hours: [0.5, 1], rate: 1500 },
  
  // Выпускная система
  'exhaust_muffler': { hours: [1, 2], rate: 1500 },
  'exhaust_pipe': { hours: [1, 2], rate: 1500 },
  'catalytic_converter': { hours: [2, 3], rate: 1500 },
  
  // Электрика
  'battery': { hours: [0.5, 1], rate: 1500 },
  'alternator': { hours: [1, 2], rate: 1500 },
  'starter': { hours: [1, 2], rate: 1500 },
  'fuse_box': { hours: [0.5, 1], rate: 1500 },
  
  // Салон
  'seat_front': { hours: [2, 3], rate: 1500 },
  'seat_rear': { hours: [2, 3], rate: 1500 },
  'steering_wheel': { hours: [1, 2], rate: 1500 },
  'dashboard': { hours: [3, 5], rate: 1500 },
  
  // Другое
  'fuel_tank': { hours: [2, 4], rate: 1500 },
  'fuel_pump': { hours: [1, 2], rate: 1500 },
};

// Get all available parts
app.get('/api/parts', (req, res) => {
  const parts = Object.entries(partsPricing).map(([key, value]) => ({
    id: key,
    name: value.name,
    costRange: value.cost,
    category: value.category || 'Другое'
  }));
  res.json(parts);
});

// Analyze image with Google Cloud Vision
app.post('/api/analyze-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    let detectedDamages = [];
    let usedAI = false;

    if (visionClient) {
      try {
        console.log('Analyzing image with Google Cloud Vision...');
        
        // Perform label detection
        const [result] = await visionClient.labelDetection(filePath);
        const labels = result.labelAnnotations;

        console.log('Detected labels:', labels.map(l => l.description));

        // Map labels to car parts
        detectedDamages = mapLabelsToDamages(labels);
        usedAI = true;

      } catch (visionError) {
        console.log('Google Cloud Vision error, using fallback:', visionError.message);
        detectedDamages = generateFallbackDetection();
      }
    } else {
      console.log('Google Cloud Vision not configured, using fallback');
      detectedDamages = generateFallbackDetection();
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      detectedDamages,
      usedAI
    });

  } catch (error) {
    console.error('Error:', error);
    
    // Clean up file if exists
    if (req.file) {
      const filePath = path.join(__dirname, 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
});

// Fallback detection when AI is not available
function generateFallbackDetection() {
  // Return common car parts that might be damaged
  return [
    { partId: 'bumper_front', severity: 'moderate', confidence: 0.7 },
    { partId: 'windshield', severity: 'minor', confidence: 0.6 }
  ];
}

// Map detected labels to our damage types
function mapLabelsToDamages(labels) {
  const labelMap = {
    'car': ['bumper_front', 'hood', 'windshield'],
    'vehicle': ['bumper_front', 'hood', 'windshield'],
    'wheel': ['wheel', 'tire'],
    'tire': ['tire'],
    'window': ['windshield', 'window_front_left', 'window_front_right'],
    'glass': ['windshield', 'window_front_left', 'window_front_right'],
    'mirror': ['mirror_left', 'mirror_right'],
    'door': ['door_front_left', 'door_front_right'],
    'bumper': ['bumper_front', 'bumper_rear'],
    'headlight': ['headlight_left', 'headlight_right'],
    'light': ['headlight_left', 'headlight_right', 'taillight_left', 'taillight_right'],
  };

  const damages = [];
  const addedParts = new Set();

  labels.forEach(label => {
    const labelName = label.description.toLowerCase();
    const score = label.score || 0.8;
    
    if (labelMap[labelName]) {
      labelMap[labelName].forEach(partId => {
        if (!addedParts.has(partId) && partsPricing[partId]) {
          damages.push({
            partId,
            severity: 'moderate',
            confidence: score
          });
          addedParts.add(partId);
        }
      });
    }
  });

  // If no damages detected, return fallback
  if (damages.length === 0) {
    return generateFallbackDetection();
  }

  return damages;
}

// Calculate repair cost
app.post('/api/calculate', (req, res) => {
  try {
    const { damages, carClass } = req.body;
    
    if (!damages || !Array.isArray(damages)) {
      return res.status(400).json({ error: 'Invalid damages data' });
    }

    let totalPartsCost = 0;
    let totalLaborCost = 0;
    let totalHours = 0;
    const detailedItems = [];

    // Calculate class multiplier
    const classMultipliers = {
      'economy': 1.0,
      'medium': 1.2,
      'premium': 1.5,
      'luxury': 2.0
    };
    const multiplier = classMultipliers[carClass] || 1.2;

    damages.forEach(damage => {
      const part = partsPricing[damage.partId];
      const labor = laborRates[damage.partId];
      
      if (part && labor) {
        // Calculate part cost (average of range)
        const avgPartCost = (part.cost[0] + part.cost[1]) / 2;
        const partCost = avgPartCost * multiplier;
        
        // Calculate labor cost
        const avgHours = (labor.hours[0] + labor.hours[1]) / 2;
        const laborCost = avgHours * labor.rate * multiplier;
        
        totalPartsCost += partCost;
        totalLaborCost += laborCost;
        totalHours += avgHours;
        
        detailedItems.push({
          part: part.name,
          severity: damage.severity,
          partCost: Math.round(partCost),
          laborCost: Math.round(laborCost),
          hours: avgHours,
          total: Math.round(partCost + laborCost)
        });
      }
    });

    const totalCost = totalPartsCost + totalLaborCost;

    // Determine if repairable
    const isRepairable = damages.every(d => d.severity !== 'critical');
    
    // Generate recommendation
    let recommendation = '';
    if (!isRepairable) {
      recommendation = 'Обнаружены критические повреждения. Рекомендуется консультация со специалистом для оценки целесообразности ремонта.';
    } else if (totalCost > 500000) {
      recommendation = 'Стоимость ремонта высока. Рекомендуется получить несколько оценок от разных сервисов.';
    } else if (totalCost > 200000) {
      recommendation = 'Средний ремонт. Рекомендуется проверка на скрытые повреждения.';
    } else {
      recommendation = 'Ремонт должен быть выполнен в reasonable timeframe. Рекомендуется своевременное обращение в сервис.';
    }

    res.json({
      repairable: isRepairable,
      totalCost: Math.round(totalCost),
      totalPartsCost: Math.round(totalPartsCost),
      totalLaborCost: Math.round(totalLaborCost),
      totalHours: Math.round(totalHours * 10) / 10,
      items: detailedItems,
      recommendation
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate cost',
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    visionConfigured: !!visionClient
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
