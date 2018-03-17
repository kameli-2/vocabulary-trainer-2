<?php
header('Content-Type: application/json');
$payload = json_decode(file_get_contents('php://input'));
$dict = $payload->dictionary;
$word = $payload->word;
$translation = $payload->translation;

require_once('dictionary.php');

$dictionary = new Dictionary($dict);

echo json_encode($dictionary->addWord($word, $translation)) ? 'true' : 'false';