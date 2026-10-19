import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [mode, setMode] = useState('manual'); // 'manual' or 'ai'
  const [parts, setParts] = useState([]);
  const [selectedDamages, setSelectedDamages] = useState([]);
  const [carClass, setCarClass] = useState('medium');
  const [calculating, setCalculating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Load available parts on mount
  useEffect(() => {
    fetch('/api/parts')
      .then(res => res.json())
      .then(data => setParts(data))
      .catch(err => setError('Не удалось загрузить список запчастей'));
  }, []);

  // Group parts by category (from backend)
  const groupedParts = parts.reduce((acc, part) => {
    const category = part.category || 'Другое';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(part);
    return acc;
  }, {});

  const categories = Object.keys(groupedParts).sort();

  const toggleDamage = (partId) => {
    setSelectedDamages(prev => {
      const exists = prev.find(d => d.partId === partId);
      if (exists) {
        return prev.filter(d => d.partId !== partId);
      } else {
        return [...prev, { partId, severity: 'moderate' }];
      }
    });
  };

  const updateSeverity = (partId, severity) => {
    setSelectedDamages(prev =>
      prev.map(d => d.partId === partId ? { ...d, severity } : d)
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setError(null);
      setResult(null);
      setSelectedDamages([]);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!uploadedFile) {
      setError('Пожалуйста, выберите фото');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Ошибка при анализе изображения');
      }

      const data = await response.json();
      
      if (data.detectedDamages && data.detectedDamages.length > 0) {
        setSelectedDamages(data.detectedDamages);
        
        // Auto-calculate after detection
        await calculateCost(data.detectedDamages);
      } else {
        setError('Не удалось определить повреждения. Попробуйте выбрать вручную.');
      }
    } catch (err) {
      setError(err.message || 'Произошла ошибка при анализе');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCalculate = async () => {
    if (selectedDamages.length === 0) {
      setError('Выберите хотя бы одно повреждение');
      return;
    }
    await calculateCost(selectedDamages);
  };

  const calculateCost = async (damages) => {
    setCalculating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          damages,
          carClass
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при расчёте');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Произошла ошибка при расчёте');
    } finally {
      setCalculating(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'minor': return 'Лёгкое';
      case 'moderate': return 'Среднее';
      case 'severe': return 'Тяжёлое';
      case 'critical': return 'Критическое';
      default: return severity;
    }
  };

  const getCarClassLabel = (cls) => {
    switch (cls) {
      case 'economy': return 'Эконом';
      case 'medium': return 'Средний класс';
      case 'premium': return 'Премиум';
      case 'luxury': return 'Люкс';
      default: return cls;
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>🚗 Оценка повреждений автомобиля</h1>
        <p className="subtitle">Загрузите фото или выберите повреждения вручную</p>

        {/* Mode Switcher */}
        <div className="mode-switcher">
          <button
            className={`mode-button ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => setMode('manual')}
          >
            📋 Ручной выбор
          </button>
          <button
            className={`mode-button ${mode === 'ai' ? 'active' : ''}`}
            onClick={() => setMode('ai')}
          >
            🤖 AI по фото
          </button>
        </div>

        {/* Car Class Selection */}
        <div className="section">
          <h3>Класс автомобиля:</h3>
          <div className="car-class-selector">
            {['economy', 'medium', 'premium', 'luxury'].map(cls => (
              <button
                key={cls}
                className={`class-button ${carClass === cls ? 'active' : ''}`}
                onClick={() => setCarClass(cls)}
              >
                {getCarClassLabel(cls)}
              </button>
            ))}
          </div>
        </div>

        {/* AI Mode */}
        {mode === 'ai' && (
          <div className="section">
            <h3>Загрузите фото автомобиля:</h3>
            <input
              type="file"
              id="file-input"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              {uploadedFile ? uploadedFile.name : 'Выберите фото'}
            </label>

            {preview && (
              <div className="preview">
                <img src={preview} alt="Preview" />
              </div>
            )}

            <button
              onClick={handleAnalyzeImage}
              disabled={!uploadedFile || analyzing}
              className="analyze-button"
            >
              {analyzing ? 'Анализируем...' : '🔍 Анализировать фото'}
            </button>

            {selectedDamages.length > 0 && (
              <div className="ai-results">
                <h4>Обнаруженные повреждения:</h4>
                <div className="detected-list">
                  {selectedDamages.map((damage, index) => {
                    const part = parts.find(p => p.id === damage.partId);
                    return (
                      <div key={index} className="detected-item">
                        <span>{part ? part.name : damage.partId}</span>
                        <select
                          className="severity-select"
                          value={damage.severity}
                          onChange={(e) => updateSeverity(damage.partId, e.target.value)}
                        >
                          <option value="minor">Лёгкое</option>
                          <option value="moderate">Среднее</option>
                          <option value="severe">Тяжёлое</option>
                          <option value="critical">Критическое</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={handleCalculate}
                  disabled={calculating}
                  className="calculate-button"
                >
                  {calculating ? 'Рассчитываем...' : '💰 Пересчитать стоимость'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual Mode */}
        {mode === 'manual' && (
          <div className="section">
            <h3>Выберите повреждённые детали:</h3>
            {categories.map(category => (
              <div key={category} className="category">
                <h4>{category}</h4>
                <div className="parts-grid">
                  {groupedParts[category].map(part => {
                    const damage = selectedDamages.find(d => d.partId === part.id);
                    return (
                      <div
                        key={part.id}
                        className={`part-item ${damage ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={!!damage}
                          onChange={() => toggleDamage(part.id)}
                        />
                        <span className="part-name">{part.name}</span>
                        {damage && (
                          <select
                            className="severity-select"
                            value={damage.severity}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateSeverity(part.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="minor">Лёгкое</option>
                            <option value="moderate">Среднее</option>
                            <option value="severe">Тяжёлое</option>
                            <option value="critical">Критическое</option>
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calculate Button (Manual Mode) */}
        {mode === 'manual' && (
          <button
            onClick={handleCalculate}
            disabled={selectedDamages.length === 0 || calculating}
            className="calculate-button"
          >
            {calculating ? 'Рассчитываем...' : '💰 Рассчитать стоимость'}
          </button>
        )}

        {error && (
          <div className="error">
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="result">
            <h2>Результаты расчёта</h2>
            
            <div className={`status ${result.repairable ? 'repairable' : 'not-repairable'}`}>
              {result.repairable ? '✅ Автомобиль можно восстановить' : '❌ Требуется консультация специалиста'}
            </div>

            <div className="total-cost">
              <h3>Общая стоимость ремонта:</h3>
              <div className="price">{formatPrice(result.totalCost)}</div>
              <div className="breakdown">
                <p>Запчасти: {formatPrice(result.totalPartsCost)}</p>
                <p>Работы: {formatPrice(result.totalLaborCost)}</p>
                <p>Время: ~{result.totalHours} ч</p>
              </div>
            </div>

            {result.items && result.items.length > 0 && (
              <div className="section">
                <h3>Детализация:</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Деталь</th>
                      <th>Серьёзность</th>
                      <th>Запчасть</th>
                      <th>Работа</th>
                      <th>Время</th>
                      <th>Итого</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.part}</td>
                        <td>
                          <span className={`severity-badge ${item.severity}`}>
                            {getSeverityLabel(item.severity)}
                          </span>
                        </td>
                        <td>{formatPrice(item.partCost)}</td>
                        <td>{formatPrice(item.laborCost)}</td>
                        <td>{item.hours} ч</td>
                        <td><strong>{formatPrice(item.total)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.recommendation && (
              <div className="recommendation">
                <h3>Рекомендация:</h3>
                <p>{result.recommendation}</p>
              </div>
            )}
          </div>
        )}

        <div className="disclaimer">
          <p>⚠️ Данная оценка является приблизительной и носит информационный характер. 
          Для точной оценки необходимо обратиться в автосервис. Цены могут варьироваться в зависимости от региона и марки автомобиля.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
