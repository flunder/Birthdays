/*
  PEOPLE
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
        Cookies.set('data', JSON.stringify(this.people, null, ' '));
    },

    load: function(){
        this.people = Cookies.get('data') ? JSON.parse(Cookies.get('data')) : [];
    },

    getRandomPerson: function(){
        var rand = Math.floor(Math.random() * this.people.length);
        return this.people[rand];
    }

}

/*
  SCREENS
--------------------------------------- */

var quiz = {

    init: function(){
        this.cacheDom();
        this.bindEvents();
        this.render();
    },

    cacheDom: function(){
        this.$el      = $('#quizModule');
        this.template = this.$el.find('#quiz-template').html();
        this.answer   = "";
        this.correct  = 0;
    },

    bindEvents: function(){
        this.$el.delegate('a', 'click', this.checkAnswer.bind(this));
    },

    render: function(){

        var data = this.setQuizData();

        this.$el.html(Mustache.render(this.template, data));

    },

    setQuizData: function(){

        this.currentAnswer = people.getRandomPerson();

        var options = this.getOptions();

        var data = {
            name: this.currentAnswer.name,
            option1: options[0],
            option2: options[1],
            option3: options[2],
            option4: options[3],
            correct: this.correct
        }

        return data;
    },

    getOptions: function(){

        var options = [];

        for (var i = 0; i < 3; i++) {
            options.push(people.getRandomPerson().date)
        }

        options.push(this.currentAnswer.date);

        return this.shuffleArray(options);
    },

    checkAnswer: function(e){

        if ($(e.target).text() == this.currentAnswer.date){
            this.correct++;
        }

        console.log(this.correct);

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
    }

}

/*
  SCREENS
--------------------------------------- */

var screens = {

    init: function(){
        this.cacheDom();
        this.bindEvents();
        this.checkHash();
    },

    cacheDom: function(){
        this.$screens = $('.screen');
    },

    bindEvents: function(){
        $('*[data-show-screen]').click(this.showScreen.bind(this));
    },

    showScreen: function(name){
        name = (typeof name === "string") ? name : $(name.target).data('show-screen');
        this.$screens.hide();
        this.$screens.filter('[data-screen="' + name + '"]').show();
    },

    checkHash: function(){
        if (location.hash != "") this.showScreen(location.hash.replace("#", ""));
    }

}

$(function(){
    people.init();
    screens.init();
    quiz.init();
})