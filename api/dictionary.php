<?php
class Dictionary {
    /**
     * @param string  $dictionary  Name of the dictionary file without extension, for example 'jp'
     * @param boolean $reverse     If true, check/get functions etc. will reverse the language
     */
    function __construct($dictionary, $reverse) {
        $this->dictionaryPath = '../data/dictionary/' . $dictionary . '.json';
        $this->dictionary = json_decode(file_get_contents($this->dictionaryPath));
        $this->vocabularyLength = count($this->dictionary);
        $this->reverse = $reverse;
    }

    /**
     * Check if user guessed the word
     * 
     * @param  int     $word   The ID of the word (index in array)
     * @param  string  $guess  The users guess
     * @return boolean         True if guess was correct, false if not
     */
    function check($word, $guess) {
        if ($this->reverse === true) {
            return array_search(strtolower(trim($guess)), explode(', ', $this->dictionary[$word]->word)) !== false;
        }
        return array_search(strtolower(trim($guess)), explode(', ', $this->dictionary[$word]->translation)) !== false;
    }

    /**
     * Returns a word for the user to guess
     * 
     * @param  int    Word ID
     * @return Object Word to guess, real answer removed from the data
     */
    function getWord($word) {
        $wordData = $this->dictionary[$word];
        $wordData->id = $word;
        if ($this->reverse === true) {
            unset($wordData->word);
            $wordData->word = $wordData->translation;
        }
        unset($wordData->translation);

        return $wordData;
    }

    /**
     * Returns a random word for the user to guess
     * 
     * @return Object Word to guess, real answer removed from the data
     */
    function getRandomWord() {
        $randomId = rand(0, $this->vocabularyLength - 1);
        return $this->getWord($randomId);
    }

    /**
     * Adds a new word into the dictionary
     * 
     * @param  string  $word         The word in users language
     * @param  string  $translation  The translation of the word
     * @return boolean               True on success, false on failure
     */
    function addWord($word, $translation) {
        $newWord = new stdClass();
        $newWord->word = $word;
        $newWord->translation = $translation;
        array_push($this->dictionary, $newWord);
        
        $this->writeVocabulary();

        return true;
    }

    /**
     * Deletes a word from the dictionary
     * 
     * @param  int     $word  The ID of the word (index in array)
     * @return boolean        True on success, false on failure
     */
    function deleteWord($word) {
        array_splice($this->dictionary, $word, 1);
        
        $this->writeVocabulary();

        return true;
    }

    /**
     * Writes current dictionary into file
     * This function is used when adding and deleting words in this class
     * 
     * @return mixed The number of bytes written, or false on error
     */
    function writeVocabulary() {
        $fp = fopen($this->dictionaryPath, 'w');
        $result = fwrite($fp, json_encode($this->dictionary));
        fclose($fp);
        return $result;
    }

    /**
     * @return array The full dictionary
     */
    function getFullVocabulary() {
        return $this->dictionary;
    }
}
