var helpers = {

    init: function(){

        this.transEndEventNames = {
          "WebkitTransition" : "webkitTransitionEnd",
          "MozTransition"    : "transitionend",
          "OTransition"      : "oTransitionEnd",
          "msTransition"     : "MSTransitionEnd",
          "transition"       : "transitionend"
        },
        this.transEndEventName = this.transEndEventNames[ Modernizr.prefixed('transition') ];

    }

}


/* PEOPLE
--------------------------------------- */

var people = {

    people: [
        { name: "Lars", date: "31/05" },
        { name: "Moni", date: "22/07" }
    ],

    init: function(){
        this.cacheDom();
        this.bindEvents();
        this.load();
        this.render();
    },

    cacheDom: function(){
        this.$el         = $("#peopleModule");
        this.$form       = $(".form--addperson");
        this.$input_name = this.$el.find(".input--name");
        this.$input_date = this.$el.find(".input--date");
        this.$button     = this.$el.find("button");
        this.$ul         = this.$el.find("ul");
        this.template    = this.$el.find("#people-template").html();
    },

    bindEvents: function(){
        this.$button.on('click', this.addPerson.bind(this));
        this.$ul.delegate('i.del', 'click', this.deletePerson.bind(this));
        this.$form.on('submit', this.addPerson.bind(this))
    },

    render: function(){

        var data = {
            people: this.people
        }

        this.$ul.html(Mustache.render(this.template, data));
    },

    addPerson: function(e){

        var person = {
            name: this.$input_name.val(),
            date: this.$input_date.val()
        }

        this.people.push(person);

        this.render();
        this.resetInputs();
        this.store();

        e.preventDefault();
    },

    deletePerson: function(e){
        var clicked = $(e.target).closest('li')
        var index = this.$ul.find('li').index(clicked);

        this.people.splice(index, 1)
        this.render();
        this.store();
    },

    resetInputs: function(){
        this.$input_name.val('').focus();
        this.$input_date.val('');
    },

    store: function(){
        Cookies.set('data', JSON.stringify(this.people, null, ' '), { expires: 365 });
    },

    load: function(){
        this.people = Cookies.get('data') ? JSON.parse(Cookies.get('data')) : [];
    },

    getRandomPerson: function(){
        var rand = Math.floor(Math.random() * this.people.length);
        return this.people[rand];
    }

}

/* QUIZ
--------------------------------------- */

var quiz = {

    init: function(){
        this.cacheDom();
        this.bindEvents();
    },

    cacheDom: function(){
        this.$el      = $('#quizModule');
        this.$wrap    = this.$el.find('.quiz-wrap');
        this.$circle  = this.$el.find('#svg #bar');
        this.template = {
            multiple: this.$el.find('#quiz-template-multiple').html(),
            letter: this.$el.find('#quiz-template-letter').html()
        }

        this.resultIndicator        = this.$el.find('.resultIndicator-wrap');
        this.resultIndicatorCorrect = this.resultIndicator.find('.resultIndicator--correct');
        this.resultIndicatorWrong   = this.resultIndicator.find('.resultIndicator--wrong');

        this.isRendering = false;

    },

    bindEvents: function(){

        // GameType: Multiple
        this.$el.delegate('a.quiz-option--multiple', 'click', this.checkAnswer_multiple.bind(this));

        // GameType: Letter
        this.$el.delegate('a.quiz-option--letter', 'click', this.activateLetter.bind(this));

        // Catch the show-screen event
        this.$el.on('show', this.start.bind(this));

        // Catch css animation end
        this.$circle.on(helpers.transEndEventName, $.proxy(function() {
            this.finishQuiz();
        }, this))
    },

    start: function(){

        var that = this;

        this.answer  = "";
        this.turns   = 0;
        this.correct = 0;
        this.steak   = 0;

        this.render();

        this.$circle.addClass('reset');

        setTimeout(function(){
            that.$circle.removeClass('reset');
            quiz.startCountdown();
        }, 50);

    },

    render: function(){

        var data = this.getQuizData();

        this.$wrap.html(Mustache.render(this.template[this.quiz.game.gameType], data.mustache));

        this.isRendering = false;

    },

    /*
        [1] Decide the winner
        [2] Get Quiz 4 options and prepare data for Mustache render
            - name to be quizzed
            - options x4 incl. correct one
            - correct answers so far
            - turn

        GAME-TYPE:
            - multiple
            - letter

        QUESTION-TYPE:
            - name: find the correct date
            - date: find the correct name
    
        CASES:
            - In Game "Multiple", ask for name or date
            - In Game "Letter", only ask for the date [3]


    */

    getQuizData: function(){

        // Quiz Data for this round ------------------------------------------

        this.quiz = {
            game:     {
                gameType:     Math.floor(Math.random() * 2) == 1 ? 'multiple' : 'letter',
                questionType: '',
                answerType:   ''
            },
            question: people.getRandomPerson(),
            answers:   []
        };

        if (this.quiz.game.gameType == "multiple"){
            this.quiz.game.questionType = Math.floor(Math.random() * 2) == 1 ? 'name' : 'date';
        } else {
            this.quiz.game.questionType = "name"; // [3]
        }

        this.quiz.game.answerType = this.quiz.game.questionType == 'name' ? 'date' : 'name';
        this.quiz.answers = this.getAnswers();

        // For Mustache ------------------------------------------------------

        this.quiz.mustache = {
            name:    this.quiz.question[this.quiz.game.questionType],
            options: this.quiz.answers
        }

        return this.quiz;

    },

    /*
        Return an Array of answers
        - make sure the correct answer is also in there
    */

    getAnswers: function(type){

        var options = [];

        /* Multiple: { 0: "31.05", 1: "03.01", 2: "22.07", 3: "03.01" } */

        if (this.quiz.game.gameType == "multiple"){

            for (var i = 0; i < 3; i++) {
                options.push(people.getRandomPerson()[this.quiz.game.answerType])
            }

            options.push(this.quiz.question[this.quiz.game.answerType]);

        }

        /* Letter:  { 0: "a", 1: "b", 2: "c", 3: "d", 4: "e" } */

        if (this.quiz.game.gameType == "letter"){

            var answer = this.quiz.question[this.quiz.game.answerType];

            for (var i = 0; i < answer.length; i++) {
                options.push(answer.charAt(i))
            }

        }

        return this.shuffleArray(options);
    },

    /*
        Multiple: letter has been chosen
    */

    activateLetter: function(e){

        if (this.isRendering) return false;

        this.$chosenLetters = $('.quiz-selectedLetters');

        if (!$(e.target).hasClass('isActive')) {
            this.$chosenLetters.append(e.target.text);
            $(e.target).addClass('isActive');
        }

        this.checkAnswer_letter();

        e.preventDefault();
        return false;
    },

    /*
        Multiple: check if the answer is correct
    */

    checkAnswer_multiple: function(e){

        if (this.isRendering) return false;

        if ($(e.target).text() == this.quiz.question[this.quiz.game.answerType]){
            this.correctPick();
        } else {
            this.wrongPick();
        }

        e.preventDefault();
    },

    /*
        [1] Check answer if => chosen letters == total of letters in answer
        [2] Was the next letter a correct pick?
    */

    checkAnswer_letter: function(){

        if (this.isRendering) return false;

        var pickedLetters = this.$chosenLetters.text().trim();
        var answer        = this.quiz.question[this.quiz.game.answerType];

        if (pickedLetters.length == answer.length) {

            if (pickedLetters == answer) {
                this.correctPick();
            } else {
                this.wrongPick();
            }

        } else {

            var length = this.$chosenLetters.text().trim().length;

            if (pickedLetters.substring(0,length) != answer.substring(0,length)){
                this.wrongPick();
            }

        }

    },

    correctPick: function(){
        this.turns++;
        this.correct++;
        this.streak++;

        this.updateIndicator('right');

        if (this.streak == 5) {
            audio.soundSprite.play('bonus');
            this.steak = 0;
        } else {
            audio.soundSprite.play('yep');
        }

        this.isRendering = true;

        setTimeout(function(){ 
            quiz.render();
        }, 500);

    },

    wrongPick: function(){
        this.turns++;
        this.streak = 0;

        this.updateIndicator('wrong');
        audio.soundSprite.play('nope');

        this.isRendering = true;

        setTimeout(function(){ 
            quiz.render();
        }, 1000);
    },

    updateIndicator: function(type){

        var that = this;

        if (type == "wrong") {
            this.resultIndicatorWrong.removeClass('isHidden');
        } else {
            this.resultIndicatorCorrect.removeClass('isHidden');
        }

        setTimeout(function(){ 
            that.resultIndicatorWrong.addClass('isHidden');
            that.resultIndicatorCorrect.addClass('isHidden');
        }, 500);

    },

    shuffleArray: function(array) {

      var currentIndex = array.length, temporaryValue, randomIndex;

      while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;

      }

      return array;
    },

    startCountdown: function(){

        this.$circle.css({ strokeDashoffset: 850.48});

        var r = this.$circle.attr('r');
        var c = Math.PI*(r*2);
        var val = 0;
        var pct = ((100-val)/100)*c;

        this.$circle.css({ strokeDashoffset: pct});

    },


    /*
        - Render and show the results screen
        - Restart the quiz for next time
    */

    finishQuiz: function(){
        results.render();
        screens.triggerScreen('result');
    }

}

/* RESULTS
--------------------------------------- */

var results = {

    init: function(){
        this.cacheDom();
        this.render();
    },

    cacheDom: function(){
        this.$el      = $('#resultModule');
        this.wrap     = this.$el.find('.result-wrap');
        this.template = this.$el.find('#result-template').html();
    },

    render: function(){

        var data = {
            correct: quiz.correct,
            turns: quiz.turns
        }

        this.wrap.html(Mustache.render(this.template, data))
    },

    getFromServer: function(){

        $.ajax ({
            type: 'GET',
            dataType: 'jsonp',
            data: {},
            url: 'http://birthdays.larsattacks.co.uk/scores.json?callback=?',
            success:   function(data) {

            }
        });

    },
    
    sendToServer: function(){

        $.ajax ({
            type: 'GET',
            dataType: 'jsonp',
            data: {
                'score': "moo"
            },
            url: 'http://birthdays.larsattacks.co.uk/php/addscore.php',
            success:   function(data) {
                
            }
        });

    },

}

/* SCREENS
--------------------------------------- */

var screens = {

    init: function(){
        this.cacheDom();
        this.bindEvents();
        this.checkHashOnLoad();
    },

    cacheDom: function(){
        this.$screens = $('.screen');
        this.$currentScreen = false;
    },

    bindEvents: function(){
        window.addEventListener("hashchange", this.showScreen.bind(this))
    },

    triggerScreen: function(name){

        if (window.location.hash == name) {
            this.showScreen(name);
        } else {
            window.location.hash = name;
        }

    },

    showScreen: function(name){

        // name is a string [ sceens.showScreen() ] [[string 'quiz']]
        // name is a hashchange event               [[object, HashChangeEvent{}]]
        // There's an additional trigger('show') to catch the show event

        name = (typeof name === "string") ? name : this.getHashFromUrl(name.newURL);

        // Remove "#" from the hash

        name = name.replace("#", "");

        this.$screens.hide();
        this.$currentScreen = this.$screens.filter('[data-screen="' + name + '"]').show().trigger('show');

        audio.play(this.$currentScreen.data('audio'));

    },

    getHashFromUrl: function(url){

        this.parser = document.createElement('a');
        this.parser.href = url;

        return this.parser.hash;
    },

    checkHashOnLoad: function(){
        this.triggerScreen('#list');
    }

}

/* AUDIO
--------------------------------------- */

var audio = {

    init: function(){

        this.bg_audio = { 
            audio_1: new Howl({ src: 'audio/1.mp3', loop: true }),
            audio_2: new Howl({ src: 'audio/2.mp3', loop: true }),
            audio_3: new Howl({ src: 'audio/3.mp3', loop: true }),
            // audio_4: new Howl({ src: 'audio/4.mp3', loop: true }),
            is_playing: []
        }

        this.soundSprite = new Howl({
            src: ['audio/sounds1.mp3'],
            sprite: {
                yep:   [0, 270],
                nope:  [290, 850],
                bonus: [1200, 1200],
            }
        });

        this.cacheDom();
        this.events();
    },

    cacheDom: function(){
    },

    events: function(){

    },

    play: function(id){

        if (this.is_playing) {
            this.bg_audio['audio_' + this.is_playing].stop();
        }

        this.bg_audio["audio_" + id].play();
        this.is_playing = id;
    }

}


$(function(){
    helpers.init();
    audio.init();
    people.init();
    screens.init();
    quiz.init();
    results.init();
})