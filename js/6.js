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


    */

    getQuizData: function(){

        // Quiz Data for this round ------------------------------------------

        this.quiz = {
            game:     {
                gameType:     Math.floor(Math.random() * 2) == 1 ? 'multiple' : 'letter',
                questionType: Math.floor(Math.random() * 2) == 1 ? 'name' : 'date',
                answerType:   ''
            },
            question: people.getRandomPerson(),
            answers:   []
        };

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

        this.$chosenLetters = $('.quiz-selectedLetters');

        if (!$(e.target).hasClass('isActive')) {
            this.$chosenLetters.append(e.target.text);
            $(e.target).addClass('isActive');
        }

        this.checkAnswer_letter();

        e.preventDefault();
    },

    /*
        Multiple: check if the answer is correct
    */

    checkAnswer_multiple: function(e){

        if ($(e.target).text() == this.quiz.question[this.quiz.game.answerType]){
            this.correct_pick();
        } else {
            this.wrong_pick();
        }

        this.render();

        e.preventDefault();
    },

    /*
        [1] Check answer if => chosen letters == total of letters in answer
        [2] Was the next letter a correct pick?
    */

    checkAnswer_letter: function(){

        var pickedLetters = this.$chosenLetters.text().trim();
        var answer        = this.quiz.question[this.quiz.game.answerType];

        if (pickedLetters.length == answer.length) {

            if (pickedLetters == answer) {
                this.correct_pick();
            } else {
                this.wrong_pick();
            }

            this.render();

        } else {

            var length = this.$chosenLetters.text().trim().length;

            if (pickedLetters.substring(0,length) != answer.substring(0,length)){
                this.wrong_pick();
                this.render();
            }

        }

    },

    correct_pick: function(){
        this.turns++;
        this.correct++;
        this.streak++;

        if (this.streak == 5) {
            audio.soundSprite.play('bonus');
            this.steak = 0;
        } else {
            audio.soundSprite.play('yep');
        }

    },

    wrong_pick: function(){
        this.turns++;
        this.streak = 0;

        audio.soundSprite.play('nope');
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
    }

    getFromServer: function(){

        $.ajax ({
                type: 'GET',
                url: 'http://birthdays.larsattacks.co.uk/scores.json'
                beforeSend: function() {
    
                },
                success:   function(data) {
    
                },
                error:     function(errorThrown){
    
                }
    
            });

        }
        
    }

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

        this.audiofiles = [
            'audio/1.mp3',
            'audio/2.mp3',
            'audio/3.mp3',
            'audio/4.mp3'
        ];

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

        if (this.sound && this.sound.playing()) this.sound.stop();

        this.sound = new Howl({
            src: this.audiofiles[id],
            loop: true,
        });

        this.sound.play();
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