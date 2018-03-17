<?php
header('Content-Type: application/json');
$payload = json_decode(file_get_contents('php://input'));
$dict = $payload->dictionary;
$word = $payload->word;
$guess = $payload->guess;
$reverse = false;
if ($payload->reverse) {
    $reverse = true;
}

require_once('dictionary.php');

$dictionary = new Dictionary($dict, $reverse);

echo $dictionary->check($word, $guess) ? 'true' : 'false';