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
	
	Chell.prototype.eval = function (command) {
		document.getElementById('eval').contentWindow.postMessage({
			code: command
		}, '*');
	};
	
	Chell.prototype.commands = ['tabs', 'bookmarks'];
	
	Chell.prototype.output = function (command) {
		var self = this;
		var output = this.newline('output');
		if (~this.commands.indexOf(command.split('.')[0])) {
			this.exec(command, {}, function (result) {
				output.innerHTML = JSON.stringify(result, null, 2);
			});
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
	
	Chell.prototype.start = function () {
		document.body.appendChild(this.fragment);
		this.input();
		
		this.pressed('enter')((function (evt) {
			var cmd = trim(evt.target.textContent);
			this.history.push(cmd);
	
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
			
			console.log(index, count, history.length);
			
			evt.target.textContent = history[index];
			evt.target.focus();
			focus(evt.target);
		}).bind(this));
	}
	
	function trim(str) { 
		return str.replace(/^\s+|\s+$/g, '').replace(/\u200B/g, '');
	};
	
	var chell = window.Chell = new Chell;
	chell.start();
	
})(this, document);