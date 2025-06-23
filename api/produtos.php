<?php
require 'config.php';

// Headers para permitir CORS e definir tipo de conteúdo
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Listar produtos ou buscar por filtros
            $modelo = isset($_GET['modelo']) ? $_GET['modelo'] : '';
            $cor = isset($_GET['cor']) ? $_GET['cor'] : '';
            $numeracao = isset($_GET['numeracao']) ? $_GET['numeracao'] : '';
            
            $sql = "SELECT * FROM produtos WHERE 1=1";
            $params = [];
            
            if (!empty($modelo)) {
                $sql .= " AND modelo LIKE ?";
                $params[] = "%$modelo%";
            }
            
            if (!empty($cor)) {
                $sql .= " AND cor LIKE ?";
                $params[] = "%$cor%";
            }
            
            if (!empty($numeracao)) {
                $sql .= " AND numeracao = ?";
                $params[] = $numeracao;
            }
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $produtos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Garantir que todos os campos necessários existam
            $produtosFormatados = array_map(function($produto) {
                return [
                    'id' => $produto['id'] ?? 0,
                    'modelo' => $produto['modelo'] ?? 'Modelo não informado',
                    'cor' => $produto['cor'] ?? 'Cor não informada',
                    'numeracao' => $produto['numeracao'] ?? 0,
                    'valor' => (float)($produto['valor'] ?? 0),
                    'quantidade' => (int)($produto['quantidade'] ?? 0),
                    'foto' => $produto['foto'] ?? 'https://via.placeholder.com/200'
                ];
            }, $produtos);
            
            http_response_code(200);
            echo json_encode($produtosFormatados);
            break;
            
        case 'POST':
            // Adicionar novo produto
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['modelo'], $data['cor'], $data['numeracao'], $data['valor'], $data['quantidade'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Dados incompletos']);
                break;
            }
            
            $sql = "INSERT INTO produtos (modelo, cor, numeracao, valor, quantidade, foto) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['modelo'],
                $data['cor'],
                $data['numeracao'],
                (float)$data['valor'],
                (int)$data['quantidade'],
                $data['foto'] ?? 'https://via.placeholder.com/200'
            ]);
            
            http_response_code(201);
            echo json_encode([
                'id' => $pdo->lastInsertId(),
                'success' => true
            ]);
            break;
            
        case 'PUT':
            // Atualizar produto
            $data = json_decode(file_get_contents('php://input'), true);
            $id = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID não fornecido']);
                break;
            }
            
            $sql = "UPDATE produtos SET 
                    modelo = ?, cor = ?, numeracao = ?, valor = ?, quantidade = ?, foto = ?
                    WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['modelo'],
                $data['cor'],
                $data['numeracao'],
                (float)$data['valor'],
                (int)$data['quantidade'],
                $data['foto'] ?? 'https://via.placeholder.com/200',
                $id
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => $stmt->rowCount() > 0,
                'rows_affected' => $stmt->rowCount()
            ]);
            break;
            
        case 'DELETE':
            // Remover produto
            $id = isset($_GET['id']) ? $_GET['id'] : null;
            
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID não fornecido']);
                break;
            }
            
            $sql = "DELETE FROM produtos WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id]);
            
            http_response_code(200);
            echo json_encode([
                'success' => $stmt->rowCount() > 0,
                'rows_affected' => $stmt->rowCount()
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erro no servidor',
        'message' => $e->getMessage()
    ]);
}
?>