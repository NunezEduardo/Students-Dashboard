// Función para cargar y procesar los datos del CSV
async function loadTrainingData() {
    try {
        const response = await fetch('data.csv');
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim());
        
        return rows.slice(1).map(row => {
            const values = row.split(',').map(v => v.trim());
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = values[index];
                if (['parent_age', 'parent_salary', 'house_area', 'average_grades'].includes(header)) {
                    rowData[header] = parseFloat(values[index]);
                }
                if (['parent_was_in_college', 'will_go_to_college'].includes(header)) {
                    rowData[header] = values[index] === 'True';
                }
            });
            return rowData;
        });
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        return [];
    }
}

// Función para calcular la similitud entre dos estudiantes
function calculateSimilarity(student1, student2) {
    let similarity = 0;
    let totalWeight = 0;

    // Pesos para diferentes características
    const weights = {
        type_school: 0.1,
        school_accreditation: 0.05,
        interest: 0.15,
        average_grades: 0.2,
        parent_salary: 0.1,
        parent_was_in_college: 0.1,
        residence: 0.05,
        house_area: 0.05,
        parent_age: 0.05,
        gender: 0.05
    };

    // Comparar características categóricas
    for (const [key, weight] of Object.entries(weights)) {
        if (['type_school', 'school_accreditation', 'interest', 'residence', 'gender'].includes(key)) {
            if (student1[key] === student2[key]) {
                similarity += weight;
            }
            totalWeight += weight;
        }
        // Comparar características numéricas
        else if (['average_grades', 'parent_salary', 'house_area', 'parent_age'].includes(key)) {
            const range = key === 'average_grades' ? 40 : // rango de 60-100
                         key === 'parent_salary' ? 9000000 : // rango aproximado de salarios
                         key === 'house_area' ? 180 : // rango aproximado de áreas
                         50; // rango de edades de padres
            
            const diff = Math.abs(student1[key] - student2[key]) / range;
            similarity += weight * (1 - diff);
            totalWeight += weight;
        }
        // Comparar booleanos
        else if (key === 'parent_was_in_college') {
            if (student1[key] === student2[key]) {
                similarity += weight;
            }
            totalWeight += weight;
        }
    }

    return similarity / totalWeight;
}

// Función para predecir si el estudiante irá a la universidad
function predictUniversity(studentData, trainingData) {
    const K = 5; // Número de vecinos más cercanos a considerar
    const similarities = trainingData.map(trainStudent => ({
        similarity: calculateSimilarity(studentData, trainStudent),
        willGo: trainStudent.will_go_to_college
    }));

    // Ordenar por similitud y tomar los K más cercanos
    similarities.sort((a, b) => b.similarity - a.similarity);
    const kNearest = similarities.slice(0, K);

    // Calcular la probabilidad basada en los K vecinos más cercanos
    const positiveCount = kNearest.filter(n => n.willGo).length;
    const probability = positiveCount / K;

    return {
        prediction: probability >= 0.6, // Umbral de 60% para predicción positiva
        probability: probability
    };
}

// Función para mostrar el resultado con animación
function showResult(prediction) {
    const resultDiv = document.getElementById('predictionResult');
    const positiveDiv = document.getElementById('positiveResult');
    const negativeDiv = document.getElementById('negativeResult');

    resultDiv.style.display = 'block';
    
    if (prediction.prediction) {
        positiveDiv.style.display = 'block';
        negativeDiv.style.display = 'none';
        positiveDiv.classList.add('animate__bounceIn');
        // Añadir confeti para celebración
        createConfetti();
    } else {
        positiveDiv.style.display = 'none';
        negativeDiv.style.display = 'block';
        negativeDiv.classList.add('animate__fadeIn');
    }

    // Scroll suave hasta el resultado
    resultDiv.scrollIntoView({ behavior: 'smooth' });
}

// Función para crear efecto de confeti
function createConfetti() {
    const confettiCount = 200;
    const confettiColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.opacity = Math.random();
        document.querySelector('.confetti').appendChild(confetti);
    }

    // Limpiar el confeti después de la animación
    setTimeout(() => {
        const confettiContainer = document.querySelector('.confetti');
        confettiContainer.innerHTML = '';
    }, 5000);
}

// Inicializar el formulario
document.addEventListener('DOMContentLoaded', async () => {
    const trainingData = await loadTrainingData();
    const form = document.getElementById('predictionForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Recoger datos del formulario
        const studentData = {
            type_school: document.getElementById('typeSchool').value,
            school_accreditation: document.getElementById('schoolAccreditation').value,
            gender: document.getElementById('gender').value,
            interest: document.getElementById('interest').value,
            residence: document.getElementById('residence').value,
            parent_age: parseFloat(document.getElementById('parentAge').value),
            parent_salary: parseFloat(document.getElementById('parentSalary').value),
            house_area: parseFloat(document.getElementById('houseArea').value),
            average_grades: parseFloat(document.getElementById('averageGrades').value),
            parent_was_in_college: document.getElementById('parentWasInCollege').value === 'true'
        };

        // Realizar predicción
        const prediction = predictUniversity(studentData, trainingData);
        showResult(prediction);
    });
});