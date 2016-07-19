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
        this.reset();
    },

    cacheDom: function(){
        this.$el      = $('#quizModule');
        this.$wrap    = this.$el.find('.quiz-wrap');
        this.template = this.$el.find('#quiz-template').html();
        this.$circle  = this.$el.find('#svg #bar');
    },

    bindEvents: function(){
        this.$el.delegate('a', 'click', this.checkAnswer.bind(this));
        $('[href="#quiz"]').on('click', this.start.bind(this));

        this.$circle.on(helpers.transEndEventName, $.proxy(function() {
            this.finishQuiz();
        }, this))
    },

    reset: function(){

        this.answer  = "";
        this.turns   = 0;
        this.correct = 0;

        this.render();

        this.$circle.addClass('reset');

    },

    start: function(){

        var that = this;

        setTimeout(function(){ 
            that.$circle.removeClass('reset');
            quiz.startCountdown();
        }, 50);

    },

    render: function(){

        var data = this.getQuizData();

        this.$wrap.html(Mustache.render(this.template, data));

    },

    /*
        [1] Decide the winner
        [2] Get Quiz 4 options and prepare data for Mustache render
            - name to be quizzed
            - options x4 incl. correct one
            - correct answers so far
            - turn
    */

    getQuizData: function(){

        this.currentAnswer = people.getRandomPerson();

        var askForNameOrDate = Math.floor(Math.random() * 2) == 1 ? 'name' : 'date';
        var options = this.getOptions(askForNameOrDate);

        var data = {
            name:    askForNameOrDate == "name" ? this.currentAnswer.name : this.currentAnswer.date,
            option1: options[0],
            option2: options[1],
            option3: options[2],
            option4: options[3],
            correct: this.correct,
            turn:    this.turn
        }

        return data;
    },

    /*
        Return an Array of answers, make sure
        the correct answer is also in there
    */

    getOptions: function(type){

        var options = [];

        if (type == "name") {

            for (var i = 0; i < 3; i++) {
                options.push(people.getRandomPerson().date)
            }

            options.push(this.currentAnswer.date);

        } else {

            for (var i = 0; i < 3; i++) {
                options.push(people.getRandomPerson().name)
            }

            options.push(this.currentAnswer.name);

        }

        return this.shuffleArray(options);
    },

    checkAnswer: function(e){

        this.turns++;

        if ($(e.target).text() == this.currentAnswer.date){
            this.correct++;
        }

        this.render();

        e.preventDefault();
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
        this.reset();
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
        this.btn_play = $('.header_dotdotdot');
        this.$currentScreen = false;
    },

    bindEvents: function(){
        window.addEventListener("hashchange", this.showScreen.bind(this))
    },

    triggerScreen: function(name){
        window.location.hash = name; 
    },

    showScreen: function(name){

        // name is a string [ sceens.showScreen() ] [[string 'quiz']]
        // name is a hashchange event               [[object, HashChangeEvent{}]]

        name = (typeof name === "string") ? name : this.getHashFromUrl(name.newURL);

        // Remove "#" from the hash

        name = name.replace("#", "");

        this.$screens.hide();
        this.$currentScreen = this.$screens.filter('[data-screen="' + name + '"]').show();

        audio.play(this.$currentScreen.data('audio'));

    },

    getHashFromUrl: function(url){

        this.parser = document.createElement('a');
        this.parser.href = url;

        return this.parser.hash;
    },

    checkHashOnLoad: function(){
        if (location.hash != "") { this.showScreen(location.hash); } else { this.showScreen('#list'); }
    }

}

/* AUDIO
--------------------------------------- */

var audio = {

    init: function(){

        this.audiofiles = [
            'audio/1.mp3', 
            'audio/2.mp3',
            'audio/3.mp3'
        ];

        this.cacheDom();
    },

    cacheDom: function(){
        this.el = document.getElementById('music')
    },

    play: function(id){

        $(this.el).find('source').attr('src', this.audiofiles[id]);

        this.el.load();
        this.el.play();
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