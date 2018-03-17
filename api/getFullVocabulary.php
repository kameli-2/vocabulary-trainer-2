<?php
header('Content-Type: application/json');

require_once('dictionary.php');
$dict = $_GET['dictionary'];

$dictionary = new Dictionary($dict);

echo json_encode($dictionary->getFullVocabulary());