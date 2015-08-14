(function ChellTerminal(window, document) {
	
	var terminal = ace.edit("terminal");
	
	terminal.renderer.setShowGutter(false);
	terminal.setHighlightActiveLine(false);
	terminal.setShowPrintMargin(false);
	terminal.setFontSize(20);
	
	terminal.on("change", function (change) {
		console.log(change);
	});
	
	terminal.focus();
	
	this.terminal = terminal;
	
})(this, document);