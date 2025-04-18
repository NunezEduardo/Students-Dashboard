-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS sistema_estudiantes;
USE sistema_estudiantes;

-- Crear la tabla de estudiantes
CREATE TABLE IF NOT EXISTS estudiantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_school VARCHAR(50) NOT NULL,
    school_accreditation VARCHAR(50) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    interest VARCHAR(50) NOT NULL,
    residence VARCHAR(20) NOT NULL,
    parent_age INT NOT NULL,
    parent_salary DECIMAL(10,2) NOT NULL,
    house_area DECIMAL(10,2) NOT NULL,
    average_grades DECIMAL(4,2) NOT NULL,
    parent_was_in_college BOOLEAN NOT NULL,
    will_go_to_college BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_type_school ON estudiantes(type_school);
CREATE INDEX idx_interest ON estudiantes(interest);
CREATE INDEX idx_residence ON estudiantes(residence);

-- Procedimiento almacenado para insertar estudiantes
DELIMITER //
CREATE PROCEDURE sp_insert_estudiante(
    IN p_type_school VARCHAR(50),
    IN p_school_accreditation VARCHAR(50),
    IN p_gender VARCHAR(20),
    IN p_interest VARCHAR(50),
    IN p_residence VARCHAR(20),
    IN p_parent_age INT,
    IN p_parent_salary DECIMAL(10,2),
    IN p_house_area DECIMAL(10,2),
    IN p_average_grades DECIMAL(4,2),
    IN p_parent_was_in_college BOOLEAN,
    IN p_will_go_to_college BOOLEAN
)
BEGIN
    INSERT INTO estudiantes (
        type_school, school_accreditation, gender, interest, residence,
        parent_age, parent_salary, house_area, average_grades,
        parent_was_in_college, will_go_to_college
    ) VALUES (
        p_type_school, p_school_accreditation, p_gender, p_interest, p_residence,
        p_parent_age, p_parent_salary, p_house_area, p_average_grades,
        p_parent_was_in_college, p_will_go_to_college
    );
END //
DELIMITER ;

-- Vista para estadísticas generales
CREATE VIEW v_estadisticas_generales AS
SELECT 
    COUNT(*) as total_estudiantes,
    AVG(average_grades) as promedio_general,
    (COUNT(CASE WHEN will_go_to_college = 1 THEN 1 END) * 100.0 / COUNT(*)) as porcentaje_universidad,
    AVG(parent_salary) as salario_promedio_padres
FROM estudiantes;