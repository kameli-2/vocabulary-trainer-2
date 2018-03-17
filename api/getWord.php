<?php
header('Content-Type: application/json');
$reverse = false;
if ($_GET['reverse'] == 'true') {
    $reverse = true;
}
$dict = $_GET['dictionary'];
$word = $_GET['word'];

require_once('dictionary.php');

$dictionary = new Dictionary($dict, $reverse);

if (!$word || $word == -1) {
    echo json_encode($dictionary->getRandomWord());
}
else {
    echo json_encode($dictionary->getWord($word));
}