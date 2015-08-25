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
		},
		
		"wk": function (command, output) {
			var words = command.split(/\s/g).slice(1);
			
			chrome.storage.sync.get('chell-wk-api-key', function (store) {
				var key = store['chell-wk-api-key'];
				if (words[0] === 'key') {
					
					if (!key) {
						if (!words[1]) {
							output.innerHTML = 'Please enter an API key';
							output.classList.add('error');
						} else {
							output.innerHTML = 'Setting key to ' + words[1];
							chrome.storage.sync.set({
								'chell-wk-api-key': words[1]
							});
						}
					} else {
						if (words[1]) {
							output.innerHTML = 'Setting key to ' + words[1];
							chrome.storage.sync.set({
								'chell-wk-api-key': words[1]
							});
						} else {
							output.innerHTML = 'Using key: ' + key;
						}
					}
					
				} else if (words[0] === 'reviews') {
					
					if (!!key) {
						fetch(`https://www.wanikani.com/api/user/${key}/study-queue`)
							.then(function (res) {
								return res.json();
							}).then(function (parsed) {
								output.innerHTML = parsed.requested_information.reviews_available;
							});
					} else {
						output.innerHTML = 'No API key found'
						output.classList.add('error');
					}
					
				}
				
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
		var keys = key.toUpperCase().split("-");
		var key, mod;
		key = keys[0];
		if (keys.length > 1) {
			key = keys[1];
			mod = keys[0];
		}
		var keymap = ["","","","CANCEL","","","HELP","","BACK_SPACE","TAB","","","CLEAR","ENTER","RETURN","","SHIFT","CONTROL","ALT","PAUSE","CAPS_LOCK","KANA","EISU","JUNJA","FINAL","HANJA","","ESCAPE","CONVERT","NONCONVERT","ACCEPT","MODECHANGE","SPACE","PAGE_UP","PAGE_DOWN","END","HOME","LEFT","UP","RIGHT","DOWN","SELECT","PRINT","EXECUTE","PRINTSCREEN","INSERT","DELETE","","0","1","2","3","4","5","6","7","8","9","COLON","SEMICOLON","LESS_THAN","EQUALS","GREATER_THAN","QUESTION_MARK","AT","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","WIN","","CONTEXT_MENU","","SLEEP","NUMPAD0","NUMPAD1","NUMPAD2","NUMPAD3","NUMPAD4","NUMPAD5","NUMPAD6","NUMPAD7","NUMPAD8","NUMPAD9","MULTIPLY","ADD","SEPARATOR","SUBTRACT","DECIMAL","DIVIDE","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","F15","F16","F17","F18","F19","F20","F21","F22","F23","F24","","","","","","","","","NUM_LOCK","SCROLL_LOCK","WIN_OEM_FJ_JISHO","WIN_OEM_FJ_MASSHOU","WIN_OEM_FJ_TOUROKU","WIN_OEM_FJ_LOYA","WIN_OEM_FJ_ROYA","","","","","","","","","","CIRCUMFLEX","EXCLAMATION","DOUBLE_QUOTE","HASH","DOLLAR","PERCENT","AMPERSAND","UNDERSCORE","OPEN_PAREN","CLOSE_PAREN","ASTERISK","PLUS","PIPE","HYPHEN_MINUS","OPEN_CURLY_BRACKET","CLOSE_CURLY_BRACKET","TILDE","","","","","VOLUME_MUTE","VOLUME_DOWN","VOLUME_UP","","","SEMICOLON","EQUALS","COMMA","MINUS","PERIOD","SLASH","BACK_QUOTE","","","","","","","","","","","","","","","","","","","","","","","","","","","OPEN_BRACKET","BACK_SLASH","CLOSE_BRACKET","QUOTE","","META","ALTGR","","WIN_ICO_HELP","WIN_ICO_00","","WIN_ICO_CLEAR","","","WIN_OEM_RESET","WIN_OEM_JUMP","WIN_OEM_PA1","WIN_OEM_PA2","WIN_OEM_PA3","WIN_OEM_WSCTRL","WIN_OEM_CUSEL","WIN_OEM_ATTN","WIN_OEM_FINISH","WIN_OEM_COPY","WIN_OEM_AUTO","WIN_OEM_ENLW","WIN_OEM_BACKTAB","ATTN","CRSEL","EXSEL","EREOF","PLAY","ZOOM","","PA1","WIN_OEM_CLEAR",""];
		if (!!key) {
			return (function (callback) {
				this.terminal.addEventListener('keydown', function (evt) {
					if (keymap[evt.which] === key) {
						if (mod === 'ctrl' && !evt.ctrlKey)
							return false;
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
		
		this.terminal.addEventListener('paste', function (evt) {
			evt.preventDefault();
			document.execCommand("insertHTML", false, evt.clipboardData.getData("text/plain"));
		});
	}
	
	var chell = window.Chell = new Chell;
	chell.start();
	
})(this, document);
