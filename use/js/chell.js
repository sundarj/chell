(function ChellStruct(window, document) {
	
	function Chell() { }
		Chell.prototype.history = [];
		Chell.prototype.fragment = document.createDocumentFragment();
	
	function create(el, attrs) {
		var element = document.createElement(el);
		Object.keys(attrs).forEach(function (key) {
			element[key] = attrs[key];
		});
		Chell.prototype.fragment.appendChild(element);
		return element;
	}
	
	Chell.prototype.terminal = create('div', {
		className: 'terminal'
	});
	
	function focus(elt) {
		var sel = window.getSelection();
		var range = document.createRange();
		range.setStartAfter(elt);
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
			self.focus();
			focus(self.appendChild(document.createTextNode("\u200B")));
		}
		return self;
	}
	
	Chell.prototype.exec = function (command) {
		command = command.split('.');
		arguments = [].slice.call(arguments, 1);
		chrome[command[0]][command[1]].apply(chrome, arguments);
	}
	
	Chell.prototype.evaluate = function (command) {
		document.getElementById('eval').contentWindow.postMessage({
			code: command
		}, '*');
	};
	
	Chell.prototype.output = function (command) {
		var self = this;
		var output = this.newline('output');
		this.evaluate(command);
		window.onmessage = function (evt) {
			output.innerHTML = evt.data.result;
			self.input();
		};
		
	}
	
	Chell.prototype.input = function () {
		[].forEach.call(this.terminal.querySelectorAll('.input'), function (line) {
			console.log(line);
			line.contentEditable = false;
		});
		this.newline('input');
	}
	
	Chell.prototype.start = function () {
		document.body.appendChild(this.fragment);
		this.input();
		
		this.pressed('enter')(function (evt) {
			var self = evt.target;
			
			self.textContent = trim(self.textContent);
	
			if (!self.textContent.length) {
				chell.input();
			} else {
				chell.output(self.textContent);
			}
		});
	}
	
	Chell.prototype.pressed = function (key) {
		var keys = {
			enter: 13
		}
		key = keys[key];
		if (!!key) {
			return (function (callback) {
				console.log(this.terminal);
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
	
	var chell = window.Chell = new Chell;
	chell.start();
	
})(this, document);