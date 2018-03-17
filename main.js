var vocabularyTrainer = {
    app: document.getElementById('app'),
    dictionary: 'jp',

    /**
     * Return form data as an object
     * 
     * @param  {node}   form Form element
     * @return {object}      Form data as a JS object
     */
    serialize: function(form) {
        var data = {};
        var inputs = [].slice.call(form.getElementsByTagName('input'));
        inputs.forEach(input => {
            if (input.getAttribute('type') === 'checkbox') {
                if (
                    typeof input.name === 'string' && input.name !== '' &&
                    input.checked
                ) {
                    data[input.name] = true;
                }
            }
            else if (
                typeof input.name === 'string' && input.name !== '' &&
                typeof input.value === 'string' && input.value !== ''
            ) {
                data[input.name] = input.value;
            }
        });

        return data;
    },

    /**
     * Turn an object into a query string to be used in a GET request
     * 
     * @param  {object} obj The data
     * @return {string}     The query string
     */
    objectToString: function(obj) {
        var string = '';
        for (var key in obj) {
            if (string !== '') {
                string += '&';
            }
            string += key + '=' + obj[key];
        }
        return string;
    },

    /**
     * Submit an ajax form
     * 
     * @param {event} event The submit event
     */
    handleFormSubmission: function(event) {
        var self = this;
        event.preventDefault();
        var form = event.target;

        // Remove error classes
        form.querySelectorAll('.error').forEach(function(node){
            node.classList.remove('error');
        })

        var data = this.serialize(form);
        data.dictionary = this.dictionary;

        var xhr = new XMLHttpRequest();
        xhr.open(form.method, form.action);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
            if (xhr.status === 200) {
                var callback = form.getAttribute('data-callback');
                if (typeof callback === 'string' && typeof self['callbacks'][callback] === 'function') {
                    var result = JSON.parse(xhr.responseText);
                    self['callbacks'][callback].call(self, form, result);
                }
                
                
            }
        };
        xhr.send(JSON.stringify(data));
    },

    /**
     * Show a message to the user
     * 
     * @param {string} msg  The message to show
     * @param {string} type Type of message, for example 'error' or 'success'
     */
    createMessage: function(msg, type) {
        var msgElement = document.createElement('div');
        msgElement.innerText = msg;
        msgElement.classList.add('message');
        msgElement.classList.add('message-' + type);
        this.app.appendChild(msgElement);

        // Remove message after 5sec
        window.setTimeout(function(){
            msgElement.classList.add('removed');
        }, 1000);
        // Remove message after 5sec
        window.setTimeout(function(){
            this.app.removeChild(msgElement);
        }, 5000);
    },

    /**
     * Ajax form callbacks.
     * They all are passed the form node and the result data from the server
     */
    callbacks: {

        /**
         * Tell user if their guess was correct, and if yes, get next word to guess
         */
        guess: function(form, result) {
            if (result) {
                this.createMessage('Correct!', 'success');
                this.saveWordStats(form.querySelector('[name="word"]').value, true);
                this.getNextWord();
            }
            else {
                this.createMessage('Incorrect!', 'error');
                this.saveWordStats(form.querySelector('[name="word"]').value, false);
                form.querySelector('[name="guess"]').classList.add('error');
            }
        },

        /**
         * Let user know if word was added successfully, and if yes, update dictionary
         */
        'add-word': function(form, result) {
            if (result) {
                form.reset();
                this.createMessage('New word added successfully!', 'success');
                this.getFullVocabulary();
            }
            else {
                this.createMessage('Failed to create new word.', 'error');
            }
        }
    },

    /**
     * Get next word for the user to guess
     */
    getNextWord: function() {
        if (this.app.querySelector('#guess-word-form') === null) {
            return false;
        }

        var reverse = false;
        if (document.getElementById('reverse').checked) {
            reverse = true;
        }

        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('get', 'api/getWord.php?' + this.objectToString({ reverse: reverse, dictionary: this.dictionary, word: this.calculateNextWord() }) );
        xhr.onload = function() {
            if (xhr.status === 200) {
                var result = JSON.parse(xhr.responseText);

                if (typeof result.word !== 'undefined' && typeof result.id !== 'undefined') {
                    self.app.querySelector('[name="word"]').value = result.id;
                    self.app.querySelector('.guess-box-word span').innerText = result.word;
                    self.app.querySelector('[name="guess"]').value = "";
                    self.app.querySelector('[name="guess"]').focus();
                }
            }
        };
        xhr.send();
    },

    /**
     * Calculate which word is asked next
     * 
     * @return {int} ID of the word or -1 if no word was found
     */
    calculateNextWord: function() {
        var wordStats = window.localStorage.getItem('dictionary-' + this.dictionary);
        if (wordStats === null) {
            return -1;
        }

        wordStats = JSON.parse(wordStats);

        if (wordStats.length === 0) {
            return -1;
        }

        wordStats.sort(function(word1, word2){
            wordLevelIndex1 = Math.max(1, word1.correctsInRow) * word1.correct - Math.max(1, word1.incorrectsInRow) * word1.incorrect;
            wordLevelIndex2 = Math.max(1, word2.correctsInRow) * word2.correct - Math.max(1, word2.incorrectsInRow) * word2.incorrect;
            if (wordLevelIndex1 === wordLevelIndex2) {
                return word1.lastAsked - word2.lastAsked;
            }
            return wordLevelIndex1 - wordLevelIndex2;
        });

        return wordStats[0].word;
    },

    saveWordStats: function(word, correct) {
        var wordStats = window.localStorage.getItem('dictionary-' + this.dictionary);
        if (wordStats === null) {
            return;
        }

        wordStats = JSON.parse(wordStats);

        wordStats.forEach(function(currentWord){
            if (currentWord.word == word) {
                currentWord[(correct ? '' : 'in') + 'correct']++;
                currentWord[(correct ? '' : 'in') + 'correctsInRow']++;
                currentWord[(correct ? 'in' : '') + 'correctsInRow'] = 0;
                currentWord.lastAsked = Date.now();
            }
        });

        window.localStorage.setItem('dictionary-' + this.dictionary, JSON.stringify(wordStats));
    },

    /**
     * Initialize word stats:
     * if they cannot be found in local storage, fetch dictionary from server
     */
    initializeWordStats: function() {
        var wordStats = window.localStorage.getItem('dictionary-' + this.dictionary);

        if (!wordStats) {
            // Get full dictionary from server
            var self = this;

            var xhr = new XMLHttpRequest();
            xhr.open('get', 'api/getFullVocabulary.php?dictionary=' + self.dictionary);
            xhr.onload = function() {                
                if (xhr.status === 200) {
                    
                    var result = JSON.parse(xhr.responseText);

                    if (typeof result === 'object') {
                        console.log('object found! setting item now into dictionary-' + self.dictionary);
                        var localStorageResult = window.localStorage.setItem(
                            'dictionary-' + self.dictionary,
                            JSON.stringify(result.map(function(word, id){
                                return {
                                    word: id,
                                    correct: 0,
                                    incorrect: 0,
                                    correctsInRow: 0,
                                    incorrectsInRow: 0,
                                    lastAsked: 0
                                };
                            }))
                        );
                        console.log('localstorage result:');
                        console.log(localStorageResult);
                        console.log('/localstorage result');
                    }
                }
            };
            xhr.send();
        }
    },

    /**
     * Get the full dictionary from server
     * and insert the data to the table
     */
    getFullVocabulary: function() {
        var vocabularyTable = this.app.querySelector('#dictionary');
        if (vocabularyTable === null) {
            return false;
        }

        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('get', 'api/getFullVocabulary.php?dictionary=' + this.dictionary);
        xhr.onload = function() {
            if (xhr.status === 200) {
                var result = JSON.parse(xhr.responseText);

                if (typeof result === 'object') {
                    var vocabularyTableBody = vocabularyTable.querySelector('tbody');
                    vocabularyTableBody.innerHTML = '';
                    
                    result.forEach(function(word, id){
                        if (typeof word.word !== 'undefined' && typeof word.translation !== 'undefined') {
                            var tr = document.createElement('tr');

                            var wordTd = document.createElement('td');
                            wordTd.innerText = word.word;
                            tr.appendChild(wordTd);

                            var translationTd = document.createElement('td');
                            translationTd.innerText = word.translation;
                            tr.appendChild(translationTd);

                            var deleteTd = document.createElement('td');
                            deleteTd.innerHTML = '&times;';
                            deleteTd.classList.add('red-text');
                            deleteTd.setAttribute('data-delete-word', id);
                            tr.appendChild(deleteTd);

                            vocabularyTableBody.appendChild(tr);
                        }
                    });
                }
            }
        };
        xhr.send();
    },

    /**
     * Delete a word from the dictionary
     */
    deleteWord: function(event) {
        var id = event.target.getAttribute('data-delete-word');
        if (typeof id === 'undefined' || isNaN(parseInt(id))) {
            return false;
        }

        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('delete', 'api/deleteWord.php');
        xhr.onload = function() {
            if (xhr.status === 200) {
                self.getFullVocabulary();
                self.createMessage('Word deleted', 'success');
            }
        };
        xhr.send(JSON.stringify({ dictionary: this.dictionary, word: id }));
    },


    init: function() {
        this.initializeWordStats();
        this.getNextWord();
        this.getFullVocabulary();
        this.app.addEventListener('submit', this.handleFormSubmission.bind(this));
        this.app.addEventListener('click', this.deleteWord.bind(this));
        document.getElementById('reverse').addEventListener('change', this.getNextWord.bind(this));
    }
};

vocabularyTrainer.init();