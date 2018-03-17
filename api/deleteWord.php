<?php
header('Content-Type: application/json');
$payload = json_decode(file_get_contents('php://input'));
$word = $payload->word;
$dict = $payload->dictionary;

require_once('dictionary.php');

$dictionary = new Dictionary($dict);

echo json_encode($dictionary->deleteWord($word)) ? 'true' : 'false';