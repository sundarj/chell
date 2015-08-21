(function ChellStruct(window, document) {
	
	function Chell() { }
		Chell.prototype.history = [];
		Chell.prototype.fragment = document.createDocumentFragment();
	
	function create(el, attrs) {
		var element = document.createElement(el);
		Object.keys(attrs).forEach(function (key) {
			element[key] = attrs[key];
		});
		return Chell.prototype.fragment.appendChild(element);
	}
	
	Chell.prototype.terminal = create('div', {
		className: 'terminal'
	});
	
	function focus(elt) {
		elt.focus();
		var sel = window.getSelection();
		var range = document.createRange();
		range.setStartAfter(elt.appendChild(document.createTextNode("\u200B")));
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	}
	
	Chell.prototype.newline = function (type) {
		var self = this.terminal.appendChild(create('div', {
			className: 'am ' + type,
			contentEditable: (type === 'input')
		}));
		if (type === 'input') {
			focus(self);
		}
		return self;
	}
	
	Chell.prototype.exec = function (command) {
		command = command.split('.');
		arguments = [].slice.call(arguments, 1);
		chrome[command[0]][command[1]].apply(chrome, arguments);
	}
	
	Chell.prototype.eval = function (command) {
		document.getElementById('eval').contentWindow.postMessage({
			code: command
		}, '*');
	};
	
	Chell.prototype.commands = {
		
		tabs: function (command, output) {
			var words = command.split(" "), urlonly, copy;
			if (words.length > 1) {
				urlonly = ~words.indexOf("url");
				copy = ~words.indexOf("copy");
			}
			this.exec('tabs.query', {}, function (result) {
				output.innerHTML = result.map(function (i) {
					var pattern = "url\ntitle";
					if (urlonly)
						pattern = "url"
					return pattern.replace(/(url|title)/g, function(match) {
						return i[match];
					});
				}).join("\n\n");
				
				if (copy) {
					var range = document.createRange();
					range.selectNode(output);
					var sel = window.getSelection();
					sel.removeAllRanges();
					sel.addRange(range);
					document.execCommand('copy', false, null);
					sel.removeAllRanges();
				}
			});
		},
		
		speak: function (command, output) {
			var words = command.split(/\s/g), lang, text;
			console.log(words);
			if (words.length > 1) {
				lang = words.join(" ").split(" lang:");
				lang = (lang && lang[1]) || 'en-GB';
				text = words.slice(1).join(" ").replace(" lang:" + lang, '');
			}
			var shortcuts = {
				"us": "en-US",
				"ja": "ja-JP",
				"zh": "zh-CN",
				"cn": "zh-CN",
				"gr": "el",
				"ca": "en-CA",
				"ie": "en-IE",
				"gb": "en-GB",
				"de": "de-DE",
				"fr": "fr-FR",
				"no": "no-NOspeak a"
			}
			
			if (shortcuts.hasOwnProperty(lang)) {
				lang = shortcuts[lang];
			}
			
			console.log(text, lang);
			
			chrome.tts.speak(text, {
				lang: lang
			});
		}
		
	};
	
	Chell.prototype.output = function (command) {
		var self = this;
		var output = this.newline('output');
		
		var commandname = command.split(/\s/g)[0];
		if (this.commands.hasOwnProperty(commandname)) {
			this.commands[commandname].call(this, command, output);
			this.input();
		} else {
			this.eval(command);
			window.onmessage = function (evt) {
				output.innerHTML = evt.data.result;
				if (evt.data.error)
					output.classList.add('error');
				self.input();
			};
		}
	}
	
	Chell.prototype.input = function() {
		[].forEach.call(this.terminal.querySelectorAll('.input'), function (line) {
			line.contentEditable = false;
		});
		this.newline('input');
	}
	
	Chell.prototype.pressed = function (key) {
		var keys = {
			enter: 13,
			up: 38
		}
		key = keys[key];
		if (!!key) {
			return (function (callback) {
				this.terminal.addEventListener('keydown', function (evt) {
					if (evt.which === key) {
						callback.call(evt, evt);
						evt.preventDefault();
						evt.stopPropagation();
					}
				});
			}).bind(this);
		}
	}
	
	function trim(str) { 
		return str.replace(/^\s+|\s+$/g, '').replace(/\u200B/g, '');
	};
	
	Chell.prototype.start = function () {
		document.body.appendChild(this.fragment);
		this.input();
		
		this.pressed('enter')((function (evt) {
			var cmd = trim(evt.target.textContent);
			this.history.push(evt.target.textContent);
	
			if (!cmd.length)
				this.input();
			else
				this.output(cmd);
		}).bind(this));
		
		var count = 0;
		
		this.pressed('up')((function (evt) {
			var history = this.history.slice();
			if ((count+1) > (history.length))
				count = 0;
			var index = history.length - (++count);
			
			focus(evt.target);
			evt.target.textContent = history[index];
		}).bind(this));
	}
	
	var chell = window.Chell = new Chell;
	chell.start();
	
})(this, document);