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
		range.setStartAfter(elt.firstElementChild);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
		elt.removeChild(elt.firstElementChild);
	}
	
	Chell.prototype.newline = function (type) {
		var self = this.terminal.appendChild(create('div', {
			className: 'line ' + type,
			contentEditable: true
		}));
		if (type === 'input') {
			self.appendChild(document.createElement('span'));
			self.focus();
			focus(self);
		}
	}
	
	Chell.prototype.exec = function (command) {
		command = command.split('.');
		arguments = [].slice.call(arguments, 1);
		chrome[command[0]][command[1]].apply(chrome, arguments);
	}
	
	Chell.prototype.start = function () {
		document.body.appendChild(this.fragment);
		this.newline('input');
	}
	
	Chell.prototype.pressed = function (key) {
		var keys = {
			enter: 13
		}
		key = keys[key];
		if (!!key) {
			return (function (callback) {
				console.log(this.terminal);
				this.terminal.addEventListener('keydown', function (e) {
					if (e.which === key) {
						callback.call(e, e);
						e.preventDefault();
						e.stopPropagation();
					}
				});
			}).bind(this);
		}
	}
	
	function trim(str) { 
		return str.replace(/^\s+|\s+$/g, '');
	};
	
	var chell = window.Chell = new Chell;
	chell.start();
	
	chell.pressed('enter')(function (e) {
		var self = e.target;

		if (!trim(self.textContent).length) {
			chell.newline('input');
		}
	
	});
	
})(this, document);