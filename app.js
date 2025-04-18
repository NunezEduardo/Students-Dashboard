// Datos globales
let studentsData = [];
let charts = {};

// Cargar datos del CSV
async function loadData() {
    try {
        const response = await fetch('data.csv');
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim());
        
        studentsData = rows.slice(1).map(row => {
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

        initializeCharts();
        setupEventListeners();
        updateDashboard();
    } catch (error) {
        console.error('Error al cargar los datos:', error);
    }
}

// Actualizar estadísticas generales
function updateStatistics(filteredData) {
    document.getElementById('totalStudents').textContent = filteredData.length;
    
    const avgGrade = filteredData.reduce((sum, student) => sum + student.average_grades, 0) / filteredData.length;
    document.getElementById('averageGrade').textContent = avgGrade.toFixed(2);
    
    const goToCollege = filteredData.filter(student => student.will_go_to_college).length;
    const collegePercentage = (goToCollege / filteredData.length * 100).toFixed(1);
    document.getElementById('willGoToCollege').textContent = `${collegePercentage}%`;
    
    const avgSalary = filteredData.reduce((sum, student) => sum + student.parent_salary, 0) / filteredData.length;
    document.getElementById('averageSalary').textContent = `$${Math.round(avgSalary).toLocaleString()}`;
}

// Inicializar gráficos
function initializeCharts() {
    // Gráfico de tipo de escuela
    const schoolTypeCtx = document.getElementById('schoolTypeChart').getContext('2d');
    charts.schoolType = new Chart(schoolTypeCtx, {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: ['#FF6384', '#36A2EB'] }] },
        options: { responsive: true }
    });

    // Gráfico de interés
    const interestCtx = document.getElementById('interestChart').getContext('2d');
    charts.interest = new Chart(interestCtx, {
        type: 'bar',
        data: { labels: [], datasets: [{ data: [], backgroundColor: '#4BC0C0' }] },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });

    // Gráfico de calificaciones vs salario
    const gradesVsSalaryCtx = document.getElementById('gradesVsSalaryChart').getContext('2d');
    charts.gradesVsSalary = new Chart(gradesVsSalaryCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.5)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Salario de Padres' } },
                y: { title: { display: true, text: 'Calificaciones' } }
            }
        }
    });

    // Gráfico de género
    const genderCtx = document.getElementById('genderChart').getContext('2d');
    charts.gender = new Chart(genderCtx, {
        type: 'doughnut',
        data: { labels: [], datasets: [{ data: [], backgroundColor: ['#FF9F40', '#FFCD56'] }] },
        options: { responsive: true }
    });

    updateCharts(studentsData);
}

// Actualizar gráficos
function updateCharts(filteredData) {
    // Actualizar gráfico de tipo de escuela
    const schoolTypes = {};
    filteredData.forEach(student => {
        schoolTypes[student.type_school] = (schoolTypes[student.type_school] || 0) + 1;
    });
    charts.schoolType.data.labels = Object.keys(schoolTypes);
    charts.schoolType.data.datasets[0].data = Object.values(schoolTypes);
    charts.schoolType.update();

    // Actualizar gráfico de interés
    const interests = {};
    filteredData.forEach(student => {
        interests[student.interest] = (interests[student.interest] || 0) + 1;
    });
    charts.interest.data.labels = Object.keys(interests);
    charts.interest.data.datasets[0].data = Object.values(interests);
    charts.interest.update();

    // Actualizar gráfico de calificaciones vs salario
    charts.gradesVsSalary.data.datasets[0].data = filteredData.map(student => ({
        x: student.parent_salary,
        y: student.average_grades
    }));
    charts.gradesVsSalary.update();

    // Actualizar gráfico de género
    const genders = {};
    filteredData.forEach(student => {
        genders[student.gender] = (genders[student.gender] || 0) + 1;
    });
    charts.gender.data.labels = Object.keys(genders);
    charts.gender.data.datasets[0].data = Object.values(genders);
    charts.gender.update();
}

// Actualizar tabla
function updateTable(filteredData) {
    const tbody = document.querySelector('#studentsTable tbody');
    tbody.innerHTML = '';

    filteredData.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.type_school}</td>
            <td>${student.school_accreditation}</td>
            <td>${student.gender}</td>
            <td>${student.interest}</td>
            <td>${student.residence}</td>
            <td>${student.parent_age}</td>
            <td>$${student.parent_salary.toLocaleString()}</td>
            <td>${student.house_area}</td>
            <td>${student.average_grades}</td>
            <td>${student.parent_was_in_college ? 'Sí' : 'No'}</td>
            <td>${student.will_go_to_college ? 'Sí' : 'No'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Configurar event listeners para filtros
function setupEventListeners() {
    const filters = ['typeSchool', 'interest', 'residence'];
    filters.forEach(filter => {
        document.getElementById(filter).addEventListener('change', updateDashboard);
    });
}

// Actualizar dashboard completo
function updateDashboard() {
    // Obtener valores de todos los filtros
    const filters = {
        typeSchool: document.getElementById('typeSchool').value,
        interest: document.getElementById('interest').value,
        residence: document.getElementById('residence').value,
        accreditation: document.getElementById('accreditation').value,
        gender: document.getElementById('gender').value,
        parentAge: document.getElementById('parentAge').value,
        parentSalary: document.getElementById('parentSalary').value,
        houseArea: document.getElementById('houseArea').value,
        average: document.getElementById('average').value,
        parentWasInCollege: document.getElementById('parentWasInCollege').value,
        willGoToCollege: document.getElementById('willGoToCollege').value
    };

    let filteredData = studentsData;

    // Aplicar todos los filtros
    if (filters.typeSchool) {
        filteredData = filteredData.filter(student => student.type_school === filters.typeSchool);
    }
    if (filters.interest) {
        filteredData = filteredData.filter(student => student.interest === filters.interest);
    }
    if (filters.residence) {
        filteredData = filteredData.filter(student => student.residence === filters.residence);
    }
    if (filters.accreditation) {
        filteredData = filteredData.filter(student => 
            student.accreditation === (filters.accreditation === 'Yes'));
    }
    if (filters.gender) {
        filteredData = filteredData.filter(student => student.gender === filters.gender);
    }
    if (filters.parentAge) {
        filteredData = filteredData.filter(student => {
            const age = parseInt(student.parent_age);
            switch(filters.parentAge) {
                case '30-40': return age >= 30 && age <= 40;
                case '41-50': return age > 40 && age <= 50;
                case '51+': return age > 50;
                default: return true;
            }
        });
    }
    if (filters.parentSalary) {
        filteredData = filteredData.filter(student => {
            const salary = parseInt(student.parent_salary);
            switch(filters.parentSalary) {
                case 'low': return salary < 30000;
                case 'medium': return salary >= 30000 && salary < 60000;
                case 'high': return salary >= 60000;
                default: return true;
            }
        });
    }
    if (filters.houseArea) {
        filteredData = filteredData.filter(student => {
            const area = parseInt(student.house_area);
            switch(filters.houseArea) {
                case 'small': return area < 100;
                case 'medium': return area >= 100 && area < 200;
                case 'large': return area >= 200;
                default: return true;
            }
        });
    }
    if (filters.average) {
        filteredData = filteredData.filter(student => {
            const avg = parseFloat(student.average);
            switch(filters.average) {
                case 'low': return avg < 7.0;
                case 'medium': return avg >= 7.0 && avg < 8.5;
                case 'high': return avg >= 8.5;
                default: return true;
            }
        });
    }
    if (filters.parentWasInCollege) {
        filteredData = filteredData.filter(student => 
            student.parent_was_in_college === (filters.parentWasInCollege === 'true'));
    }
    if (filters.willGoToCollege) {
        filteredData = filteredData.filter(student => 
            student.will_go_to_college === (filters.willGoToCollege === 'true'));
    }

    updateStatistics(filteredData);
    updateCharts(filteredData);
    updateTable(filteredData);
}

// Inicializar dashboard
function initializeDashboard() {
    // Cargar datos y actualizar dashboard
    loadData().then(() => {
        updateDashboard();
    });

    // Agregar evento al botón de filtros
    document.getElementById('applyFilters').addEventListener('click', updateDashboard);

    // Agregar eventos a los filtros para actualizar cuando cambien
    const filterIds = ['typeSchool', 'interest', 'residence', 'accreditation', 'gender',
                      'parentAge', 'parentSalary', 'houseArea', 'average',
                      'parentWasInCollege', 'willGoToCollege'];
    
    filterIds.forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            // No actualizamos automáticamente, esperamos al botón
        });
    });
}

// Iniciar la aplicación
initializeDashboard();