<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Diretório para salvar as imagens
$uploadDir = 'uploads/';

// Cria o diretório se não existir
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Verifica se o arquivo foi enviado
if (empty($_FILES['foto'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Nenhuma imagem enviada']);
    exit;
}

$file = $_FILES['foto'];

// Verifica erros no upload
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Erro no upload da imagem']);
    exit;
}

// Verifica o tipo do arquivo
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tipo de arquivo não permitido']);
    exit;
}

// Gera um nome único para o arquivo
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = uniqid() . '.' . $extension;
$filePath = $uploadDir . $fileName;

// Move o arquivo para o diretório de uploads
if (move_uploaded_file($file['tmp_name'], $filePath)) {
    echo json_encode(['filePath' => $filePath]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao salvar a imagem']);
}
?>