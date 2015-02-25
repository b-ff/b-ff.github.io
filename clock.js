(function($) {

	FlipClock = function() {

		this.flipInterval = {};
		this.flipDegree = {};

		this.renewTime();

		this.updateInterval = setInterval($.proxy(function() {

			this.refreshClock();
			// console.log(this.getTimeString());

		}, this), 800);

	}

	FlipClock.prototype.log = function(data) {
		if (typeof console != "undefined") {
				console.log(data);
		}
	}

	FlipClock.prototype.renewTime = function() {
		this.date = new Date();

		this.hours = this.date.getHours();
		this.minutes = this.date.getMinutes();

		return this.getTimeObject();		
	}

	FlipClock.prototype.getTimeString = function() {
		return this.hours+':'+((this.minutes < 10) ? '0'+this.minutes : this.minutes);
	}

	FlipClock.prototype.getTimeObject = function() {
		return {
			hours: this.hours,
			minutes: this.minutes
		};
	}

	FlipClock.prototype.flipPart = function(digitID, selector, degree) {

		var degree = (typeof degree != "number") ? 0 : degree;
		var digitID = (typeof digitID != "undefined") ? ((digitID.match(/^\#.*$/)) ? digitID : "#" + digitID) + ".flip" : ".flip";
		var $flipper = (typeof selector != "undefined") ? $(digitID).find(".part").filter(selector) : $(digitID).find(".part");
		var $def = jQuery.Deferred();

		if (typeof this.flipInterval[digitID+'__'+selector] == "undefined") {
			this.flipDegree[digitID+'__'+selector] = degree - 90;
			this.flipInterval[digitID+'__'+selector] = setInterval($.proxy(function() {
				if (this.flipDegree[digitID+'__'+selector] < degree) {
					this.flipDegree[digitID+'__'+selector] += 5;
					$flipper.css("transform", "rotateX("+this.flipDegree[digitID+'__'+selector]+"deg)");
				} else {
					// Заканчиваем переворачивать предыдущую цифру
					clearInterval(this.flipInterval[digitID+'__'+selector]);
					delete(this.flipInterval[digitID+'__'+selector]);
					delete(this.flipDegree[digitID+'__'+selector]);
					$def.resolve();
				}
			}, this), 1);
		}

		return $def;
	}

	FlipClock.prototype.flipDigit = function(digitID, value) {
		var digitID = (digitID.match(/^\#.*$/)) ? digitID : "#" + digitID;
		$(digitID).prepend('<div class="part lower"><div class="flipper"><div class="container">0</div></div></div><div class="part upper"><div class="flipper"><div class="container">0</div></div></div>');
		$(digitID).find(".part").filter(":lt(2)").addClass("next");
		$(digitID).find(".part").filter(":gt(1)").addClass("prev");
		$(digitID).find(".part.next").find(".container").text(value);

		$(digitID).find(".upper.next").css("opacity", 0.5).stop().animate({
			opacity: 1
		}, 10);

		this.flipPart(digitID, '.upper.prev', 90).then($.proxy(function() {
			// ...
			this.flipPart(digitID, '.lower.next', 0).then($.proxy(function() {
				// this.log($(digitID));
				$(digitID).find(".part.prev").remove();
				$(digitID).find(".part.next").removeClass("next");
			}, this));

			$(digitID).find(".lower.prev").stop().animate({
				opacity: 0.5
			}, 10);	

		}, this));
	}	

	FlipClock.prototype.flipHours = function(hours) {
		this.flipDigit('hours', hours);
		// this.log("FlipClock: set hours to "+hours);
	}

	FlipClock.prototype.flipMinutes = function(minutes) {
		this.flipDigit('minutes', minutes);
		// this.log("FlipClock: set minutes to "+minutes);
	}

	FlipClock.prototype.flipTime = function(time) {
		if (typeof time == "string") {
			time = time.split(/\:/);		
		}

		if (typeof time[0] != "undefined") {
			var h = time[0];
			var m = time[1];				
		}

		if (typeof time.hours != "undefined") {
			var h = time.hours;
			var m = time.minutes;
		}

		this.flipHours(h);
		this.flipMinutes(m);
		// this.log("FlipClock: set time to "+h+":"+m);

		this.triggerEvent("fliptime");
	}

	FlipClock.prototype.refreshClock = function() {
		// var time = $("#hours").find(".container").text() + ":" + $("#minutes").find(".container").text();
		// if (time != this.getTimeString()) {
		// 	this.flipTime(this.getTimeString());
		// }

		this.renewTime();		

		var time = this.getTimeString().split(':');

		var changed = false;

		if ($("#hours").find(".container:first").text() != time[0]) { this.flipHours(time[0]); changed = true; }
		if ($("#minutes").find(".container:first").text() != time[1]) { this.flipMinutes(time[1]); changed = true; }

		if (changed) {
			this.triggerEvent("timechange"); 
		}
	}

	FlipClock.prototype.callbacks = [];

	FlipClock.prototype.addCallback = function(eventName, func) {
		if (typeof func == "function") {
			this.callbacks.push({ event: eventName, callback: func });
		}
	}

	FlipClock.prototype.triggerEvent = function(clockEventName) {
		for (var i = 0; i < this.callbacks.length; i++) {
			if (this.callbacks[i].event == clockEventName && typeof this.callbacks[i].callback == "function") {
				this.callbacks[i].callback(this.getTimeObject(), this.getTimeString());
			}
		};
		console.log('event triggered: '+ clockEventName);
	}


	Alarm = function() {
		this.alarm_sound = document.getElementById('main_alarm');
		this.alarm_sound_time = 101; // 1m41s
		this.alarm_sound.currentTime = this.alarm_sound_time;
		this.cylinderID = 'alarm_cylinder';
		this.cylinder = $('#'+this.cylinderID);
		this.cylinderKnob = $(".alarm.set.cylinder");
		this.time = this.getTimeObject();
	}

	Alarm.prototype.check = function(timeObject, timeString) {
		if (this.getTime() == timeString) {
			this.play();
		}

		console.log('checking: ' + this.getTime() + ' == ' + timeString + ' ? ' + (this.getTime() == timeString));
	}

	Alarm.prototype.play = function() {
		if (typeof this.alarm_sound.play == "function") {
			this.alarm_sound.play();
		}
	}

	Alarm.prototype.timeInterval = 20; // minutes

	Alarm.prototype.increaseTime = function() {
		var time = this.time;

		time.minutes += this.timeInterval;

		if (time.minutes >= 60) {
			time.minutes -= 60;
			time.hours++;
		}

		return this.changeTime(time);
	}

	Alarm.prototype.decreaseTime = function() {
		var time = this.time;

		time.minutes -= this.timeInterval;

		if (time.minutes < 0) {
			time.minutes += 60;
			time.hours--;
		}

		return this.changeTime(time);
	}

	Alarm.prototype.changeTime = function(timeObject) {
		var hourDegree = 360 / 24;

		var newDegree = hourDegree * timeObject.hours - hourDegree;
			newDegree += (timeObject.minutes / 60) * hourDegree;
			newDegree = 0 - newDegree;

		this.setDegree(newDegree);
		this.time = timeObject;

		console.log(this.getTime());

		return this.time;
	}

	Alarm.prototype.getTimeObject = function() {
		var degree = getCurrentRotationFixed(this.cylinderID);
		if (isNaN(degree)) { degree = 0; }
		var hourDegree = 360 / 24;
		var hours = Math.floor(((360 - degree) / hourDegree) + 1);
		var minutes = Math.round(((((360 - degree) / hourDegree) + 1) - hours).toFixed(2) * 60);
		// console.log(degree);
		if (hours >= 24) { hours = 0; }
		return { 
			hours: hours,
			minutes: minutes
		};
	}

	Alarm.prototype.getTime = function() {
		var time = this.getTimeObject();

		if (time.minutes < 10) {
			time.minutes = '0' + time.minutes;
		}

		return time.hours + ':' + time.minutes;
	}

	Alarm.prototype.setDegree = function(degree) {
		this.cylinder.css('-webkit-transform', 'rotateX('+degree+'deg)');
		this.cylinder.css('-khtml-transform', 'rotateX('+degree+'deg)');
		this.cylinder.css('-moz-transform', 'rotateX('+degree+'deg)');
		this.cylinder.css('-ms-transform', 'rotateX('+degree+'deg)');
		this.cylinder.css('-o-transform', 'rotateX('+degree+'deg)');
		this.cylinder.css('transform', 'rotateX('+degree+'deg)');

		this.cylinderKnob.css('-webkit-transform', 'rotateX('+degree+'deg)');
		this.cylinderKnob.css('-khtml-transform', 'rotateX('+degree+'deg)');
		this.cylinderKnob.css('-moz-transform', 'rotateX('+degree+'deg)');
		this.cylinderKnob.css('-ms-transform', 'rotateX('+degree+'deg)');
		this.cylinderKnob.css('-o-transform', 'rotateX('+degree+'deg)');
		this.cylinderKnob.css('transform', 'rotateX('+degree+'deg)');
	}
	
	$(document).ready(function() {

		Panasonic = {};

		Panasonic.alarm = new Alarm();
		Panasonic.clock = new FlipClock();
		Panasonic.clock.addCallback('timechange', $.proxy(Panasonic.alarm.check, Panasonic.alarm));
		Panasonic.alarm.changeTime({ hours: 6, minutes: 0 });


		$(document).on("keydown", function(e) {

			if (e.keyCode >= 37 && e.keyCode <= 40) {

				switch (e.keyCode) {
					case 37: console.log('влево'); break;
					case 38: Panasonic.alarm.increaseTime(); break;
					case 39: console.log('вправо'); break;
					case 40: Panasonic.alarm.decreaseTime(); break;
				}
				
				e.preventDefault();
			}

			// console.log(e.keyCode);
		});
	});
	
})(jQuery);


function getCurrentRotation( elid ) {
  var el = document.getElementById(elid);
  var st = window.getComputedStyle(el, null);
  var tr = st.getPropertyValue("-webkit-transform") ||
       st.getPropertyValue("-moz-transform") ||
       st.getPropertyValue("-ms-transform") ||
       st.getPropertyValue("-o-transform") ||
       st.getPropertyValue("transform") ||
       "fail...";

  if( tr !== "none") {
    // console.log('Matrix: ' + tr);

    var values = tr.split('(')[1];
      values = values.split(')')[0];
      values = values.split(',');

    var a = values[5];
    var b = values[6];
    var c = values[9];
    var d = values[10];

    var scale = Math.sqrt(a*a + b*b);

    // First option, don't check for negative result
    // Second, check for the negative result
    /**/
    var radians = Math.atan2(b, a);
    var angle = Math.round( radians * (180/Math.PI));
    /*/
    var radians = Math.atan2(b, a);
    if ( radians < 0 ) {
      radians += (2 * Math.PI);
    }
    var angle = Math.round( radians * (180/Math.PI));
    /**/
    
  } else {
    var angle = 0;
  }

  // works!
  // console.log('Rotate: ' + angle + 'deg');

  return angle;  
}

function getCurrentRotationFixed( elid ) {
  var el = document.getElementById(elid);
  var st = window.getComputedStyle(el, null);
  var tr = st.getPropertyValue("-webkit-transform") ||
       st.getPropertyValue("-moz-transform") ||
       st.getPropertyValue("-ms-transform") ||
       st.getPropertyValue("-o-transform") ||
       st.getPropertyValue("transform") ||
       "fail...";

  if( tr !== "none") {
    // console.log('Matrix: ' + tr);

    var values = tr.split('(')[1];
      values = values.split(')')[0];
      values = values.split(',');
    var a = values[5];
    var b = values[6];
    var c = values[9];
    var d = values[10];

    var scale = Math.sqrt(a*a + b*b);

    // First option, don't check for negative result
    // Second, check for the negative result
    /** /
    var radians = Math.atan2(b, a);
    var angle = Math.round( radians * (180/Math.PI));
    /*/
    var radians = Math.atan2(b, a);
    if ( radians < 0 ) {
      radians += (2 * Math.PI);
    }
    var angle = Math.round( radians * (180/Math.PI));
    /**/
    
  } else {
    var angle = 0;
  }

  // works!
  // console.log('Rotate: ' + angle + 'deg');
  // $('#results').append('<p>Rotate: ' + angle + 'deg</p>');

  return angle;
}