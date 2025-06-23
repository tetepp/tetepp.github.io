<?php
$host = 'localhost';
$db   = 'm_r_shoes';
$user = 'root';
$pass = 'mara1535';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // Em produção, logue o erro mas mostre uma mensagem genérica
    error_log("Erro de conexão com o banco: " . $e->getMessage());
    die("Erro ao conectar com o banco de dados. Tente novamente mais tarde.");
}