/*
 * Input Mask inspired from the Masked Input Plugin for jQuery by Josh Bush (digitalbush.com)
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE. 
 */
 
/*
 * Version: 0.9
 * Release: 2008-08-26
 * Author: Fabien Ménager
 */ 


function getKeycode(e) {
  return (window.event && (window.event.keyCode || window.event.which)) || e.which || e.keyCode || false;
}

/** DOM creator (documentation coming) */
var DOM = {
  defineTag: function (tag) {
    window[tag.toUpperCase()] = function () {
      return DOM.createNode(tag, arguments);
    };
  },
  
  createNode: function (tag, args) {
    var e;
    try {
      e = new Element(tag, args[0]);
      for (var i = 1; i < args.length; i++) {
        var arg = args[i];
        if (arg == null) continue;
        if (!Object.isArray(arg)) e.insert (arg);
        else {
          for (var j = 0; j < arg.length; j++) e.insert(arg[j]);
        }
      }
    }
    catch (ex) {
      alert('Cannot create <' + tag + '> element:\n' + Object.insepct(args));
      e = null;
    }
    return e;
  },
  
  tags: [
    'a', 'br', 'button', 'canvas', 'div', 'fieldset', 'form',
    'h1', 'h2', 'h3', 'hr', 'img', 'input', 'label', 'legend',
    'li', 'ol', 'optgroup', 'option', 'p', 'pre', 'select',
    'span', 'strong', 'table', 'tbody', 'td', 'textarea',
    'tfoot', 'th', 'thead', 'tr', 'tt', 'ul'
  ]
};

DOM.tags.each(function (tag) {
  DOM.defineTag (tag);
});


/** Universal get/set function for form elements
 * @param element A form element (Form.Element or id) : input, textarea, select, group of radio buttons, group of checkboxes
 * @param value   If set, sets the value to the element. Can be an array of values : ['elementvalue1', 'elementvalue2', ...] 
 * @param fire    Determines wether the onchange callback has to be called or not
 * @return        An array of values for multiple selectable elements, a boolean for 
 *                single checkboxes/radios, a string for textareas and text inputs
 */
function $V (element, value, fire) {
  if (!element) return;
  
  element = $(element);
  fire = Object.isUndefined(fire) ? true : fire;
  
  // If it is a form element
  if (Object.isElement(element) && element.tagName.match(/^(input|select|textarea)$/i)) {
    
    // If the element is a checkbox, we check if it's checked
    var oldValue = (element.type.match(/^checkbox$/i)) ? element.checked : $F(element);
    
    // If a value is provided
    if (!Object.isUndefined(value) && value != oldValue) {
      element.setValue(value);
      if (fire) (element.onchange || Prototype.emptyFunction).bind(element)();
    }
    
    // else, of no value is provided
    else return oldValue;
  }
  
  // If the element is a list of elements (like radio buttons)
  else if (Object.isArray(element) || (element[0] && Object.isElement(element[0]))) {
    if (!Object.isUndefined(value)) { // If a value is provided
      // If value isn't an array, we make it an array
      value = Object.isArray(value) ? value : [value];
      
      // For every element, we apply the right value (in an array or not)
      $A(element).each(function(e) { // For every element in the list
      $V(e, value.indexOf(e.value) != -1, fire);
      });
    }
    else { // else, if no value is provided
      var type, ret = [];
      
      $A(element).each(function (e) { // For every element in the list
        if ($V(e)) ret.push(e.value);
        type = e.type || type;
      });
      
      if (type && type.match(/^radio$/i)) ret = ret.reduce();
      return (ret && ret.length > 0) ? ret : null;
    }
  }
}

Element.addMethods({
  setResizable: function (element, options) {
    options = Object.extend({
      step: 1
    }, options);
  
    var staticOffset = null;
    
    // oGrippie is the draggable element
    var oGrippie = new Element('div');
    
    // We remove the margin between the textarea and the grippie
    element.style.marginBottom = '0';
    
    // grippie's class and style
    oGrippie.addClassName('grippie-h').setOpacity(0.5);
    if (!element.visible()) {
      oGrippie.hide();
    }
    
    function startDrag(e) {
      e.stop();
      staticOffset = element.getHeight() - e.pointerY(); 
      element.setOpacity(0.4);
      document.observe('mousemove', performDrag);
      document.observe('mouseup', endDrag);
    }
    
    // When the mouse is pressed on the grippie, we begin the drag
    oGrippie.observe('mousedown', startDrag);
    element.insert({after: oGrippie});
  
    function performDrag(e) {
      e.stop();
      var h = null;
      if (typeof options.step == 'string') {
        var iStep = element.getStyle(options.step);
        iStep = iStep.substr(0, iStep.length - 2);
        
        h = Math.max(iStep*2, staticOffset + e.pointerY()) - Math.round(oGrippie.getHeight()/2);
        h = Math.round(h / iStep)*iStep;
      } else {
        h = Math.max(32, staticOffset + Event.pointerY(e));
      }
      element.setStyle({height: h + 'px'});
    }
  
    function endDrag(e) {
      element.setStyle({opacity: 1});
      document.stopObserving('mousemove', performDrag);
      document.stopObserving('mouseup', endDrag);
      e.stop();
    }
  }
} );


Element.addMethods('select', {
  buildTree: function (element, options) {
    //if (Prototype.Browser.IE) return;
    
    var select  = element, // DOM select
        search  = null, // DOM text input
        tree    = null, // DOM UL/LI tree representing the select/optgroup
        list    = null, // DOM UL/LI list for keyword search
        pos     = null, // DOM select position
        dim     = null; // DOM select dimensions
    
    options = Object.extend({
      className: 'select-tree'
    }, options);
    
    // Utility functions ////////
    function hideSelectTrees() {
      $$('ul.'+options.className+' ul').invoke('hide');
    }
    
    function validKey(keycode) {
      return (keycode >= 48 && keycode <= 90 || // letters and digits
              keycode >= 96 && keycode <= 111 || // num pad
              keycode >= 186 && keycode <= 181 ||
              keycode >= 219 && keycode <= 222 ||
              keycode == 32 || // space
              keycode == 8); // backspace
    }
    
    function updateCoordinates() {
      pos = select.cumulativeOffset();
      dim = select.getDimensions();
      
      pos.left = pos.left+parseInt(select.getStyle('margin-left').split('px')[0])+'px';
      pos.top  = pos.top +parseInt(select.getStyle('margin-top').split('px')[0])-1+dim.height+'px';
    }
    
    function reposition() {
      updateCoordinates();
      var style = {zIndex: 40, position: 'absolute', left: pos.left, top: pos.top};
      tree.setStyle(style);
      list.setStyle(style);
    }
    
    function makeTree(sel, ul) {
      updateCoordinates();
      var style = {'width': dim.width+'px'};
      select.setStyle(style).childElements().invoke('hide');
      tree.setStyle(style);
      list.setStyle(style);
      search.setStyle({'width': dim.width-4+'px'});
      
      ul.update(null);
      
      sel.childElements().each(function (o) {
        var li = new Element('li').addClassName(o.className);

       /* li.setStyle({
          'color': o.getStyle('color'),
          'borderLeft': o.getStyle('borderLeft'),
          'borderRight': o.getStyle('border-right'),
          'borderTop': o.getStyle('border-top'),
          'borderBottom': o.getStyle('border-bottom')
        });
        */
        
        // If it is an optgroup
        if (o.tagName.toLowerCase() == 'optgroup') {
          li.insert(o.label?o.label:'&nbsp;');
          
          // New sublist
          var subTree = new Element('ul');
          makeTree(o, subTree.hide());
          li.insert(subTree).addClassName('drop');
          
          // On mouse over on the LI
          li.observe('mouseover', function() {
            var liDim = li.getDimensions();
            var liPos = li.positionedOffset();
            
            // Every select-tree list is hidden
            hideSelectTrees();
            
            // Every child element is drawn
            li.childElements().each(function (e) {
              e.show().setStyle({
                position: 'absolute',
                width: select.getWidth()+'px',
                left: liPos.left+liDim.width-1+'px',
                top: liPos.top+1+'px'
              });
            });
          });
  
        // If it is an option
        } else {
          li.insert(o.text?o.text:'&nbsp;');
          li.id = select.id+'_'+o.value;
          
          // on click on the li
          li.observe('click', function() {
            // we set the value and hide every other select tree
            $V(select, o.value, true);
            tree.highlight();
            $$('ul.'+options.className).invoke('hide');
          });
          
          // we hide every other other select tree ul on mouseover
          li.observe('mouseover', function() {
            tree.select('ul').each(function(ul) {ul.hide()});
          });
        }
        ul.insert(li);
      });
      tree.highlight();
    }
    /////////////////////////////
    
    // Every element is hidden, but preserves its width
    select.childElements().each(function(d) {
      d.setOpacity(0.01);
      d.setStyle({height: 0});
    });
    
    // Tree -------------
    tree = new Element('ul', {"class": options.className, id: select.id+'_tree'});
    tree.display = function (e) {
      e.stop();
      if (tree.empty()) {
        makeTree(select, tree);
      }
      search.focus();
      hideSelectTrees();
      reposition();
      tree.show();
      
      document.observe('mouseup', tree.undisplay);
    }
    
    tree.undisplay = function (e) {
      document.stopObserving('mouseup', tree.undisplay);
      tree.hide();
    }
    
    tree.highlight = function () {
      var selected = tree.select('.selected');
      var val = $V(select);
      selected.each(function(s) {
        s.removeClassName('selected');
      });
      if (val && (s = $(select.id+'_'+val))) {
        s.addClassName('selected');
      }
    }
    select.insert({after: tree.hide()});
    
    // List -------------
    list = new Element('ul')
              .addClassName(options.className);
    list.id = select.id+'_list';
    
    list.navigate = function (e) {
      if (search.value != '') {
        var keycode;
        if (window.event) keycode = window.event.keyCode;
        else if (e) keycode = e.which;
        
        var focused = list.select('.focused');
        
        switch (keycode) {
          case 37:
          case 38:
            if (focused && (focused = focused[0])) {
              focused.removeClassName('focused');
              if (!(focused = focused.previous())) {
                focused = list.childElements().last();
              }
              focused.addClassName('focused');
            } else if (!list.empty()) {
              list.childElements().last().addClassName('focused');
            }
          
          break;
          case 39: 
          case 40:
            if (focused && (focused = focused[0])) {
              focused.removeClassName('focused');
              if (!(focused = focused.next())) {
                focused = list.firstDescendant();
              }
              focused.addClassName('focused');
            } else if (!list.empty()) {
              list.firstDescendant().addClassName('focused');
            }
          
          break;
        }
      }
    }
    
    list.search = function(s) {
      var children = select.descendants();
      var li = null;
      list.update(null);
      if (s) {
        children.each(function (c) {
          if (c.tagName.toLowerCase() == 'option' && c.text.toLowerCase().include(s.toLowerCase())) {
            var re = new RegExp(s, "i");
            li = new Element('li').update(c.text.gsub(re, function(match){return '<span class="highlight">'+match+'</span>'}));
            li.onclick = function() {
              $V(select, c.value, true);
              tree.highlight();
              search.value = null;
              select.display(false);
            };
            list.insert(li);
          }
        });
      }
    }
    select.insert({after: list.hide()});
    
    reposition();

    // search ----------
    search = new Element('input', {type: 'text', autocomplete: 'off'})
                 .setStyle({
                   position: 'absolute',
                   top: '-1000px'
                 });
    search.name = select.name+'_tree__search';
    search.id   = select.id+'_tree__search';
    
    search.catchKey = function (e) {
      var keycode;
      if (window.event) keycode = window.event.keyCode;
      else if (e) keycode = e.which;

      if (validKey(keycode)) { // Valid keycode
        if (keycode == 8 && search.value == '' && !select.visible()) {
          select.display(true);
        } else {
          list.search(search.value);
        }
      }
      else if (keycode == 27) { // Escape
        select.display(false);
      } 
      else if (keycode == 13) { // Enter
        var focused = list.select('.focused');
        if (focused && (focused = focused[0])) {
          focused.onclick();
        }
        search.value = null;
      }
    }
    
    search.display = function (e) {
      var keycode;
      if (window.event) keycode = window.event.keyCode;
      else if (e) keycode = e.which;
      
      if (validKey(keycode) && keycode != 8 && keycode != 27) {
        select.hide();
        tree.undisplay();
        list.update(null).show();
        search.setStyle({position: 'relative', top: 0})
              .stopObserving('keydown', search.display);
      }
    }
    select.insert({after: search});
    
    // The search input to blur the select control and catch keys
    search.observe('keydown', search.display)
          .observe('keydown', list.navigate)
          .observe('keyup',   search.catchKey);

    // Select
    select.writeAttribute('size', 1);
    
    select.display = function (show) {
      search.setStyle({position: 'absolute', top: '-1200px'});
      select.show();
      list.hide();
      if (show) tree.display();
      search.value = null;
      search.observe('keydown', search.display);
    }

    select.observe('click', tree.display);
  }
});


/** Helper Function for Caret positioning
 * @param element The form element (automatically added by Prototype, don't use it)
 * @param begin   Where the selection starts
 * @param end     Where the selection ends
 * @param value   The value replacing the selection
 * @return If no argument is provided, it returns the selection start and end
 *         If only start is provided, it puts the caret at the start position and returns an empty value
 *         If start and end are provided, it selects the character range and returns the selected string
 *         If value is provided, it returns the selected text and replaces it by value
 */
Element.addMethods(['input', 'textarea'], {
  caret: function (element, begin, end, value) {
    if (element.length == 0) return null;
    
    // Begin ?
    if (Object.isNumber(begin)) {
      // End ?
      end = (Object.isNumber(end)) ? end : begin;
      
      // Text replacement
      var selected = element.value.substring(begin, end);
      if (value) {
        var s;
        s = element.value.substring(0, begin) + 
            value + 
            element.value.substring(end, element.value.length);
        element.value = s;
      }
      
      // Gecko, Opera
      if(element.setSelectionRange) {
        element.focus();
        element.setSelectionRange(begin, value ? begin+value.length : end);
      }
      // IE
      else if (element.createTextRange) {
        var range = element.createTextRange();
        range.collapse(true);
        range.moveEnd('character', value ? begin+value.length : end);
        range.moveStart('character', begin);
        range.select();
      }

      return selected;
    }
    // No begin and end
    else {
      // Gecko, Opera
      if (element.setSelectionRange) {
        begin = element.selectionStart;
        end = element.selectionEnd;
      }
      // IE
      else if (document.selection && document.selection.createRange) {
        var range = document.selection.createRange();
        begin = 0 - range.duplicate().moveStart('character', -100000);
        end = begin + range.text.length;
      }
      return {begin:begin, end:end};
    }
  }
});

/** Input mask for text input elements 
 * @param element The form element (automatically added by Prototype, don't use it)
 * @param mask    The input mask as a string composed by [9, a, *, ~] by default
 * @param options Options : placeholder, 
 *                          charmap, 
 *                          completed (function called when the text is full)
 */
Element.addMethods('input', {
  mask: function(element, mask, options) {
    element.options = Object.extend({
      placeholder: "_",
      charmap: {
        '9':"[0-9]",
        'a':"[A-Za-z]",
        '*':"[A-Za-z0-9]",
        '~':"[+-]"
      },
      completed: Prototype.emptyFunction,
      format: Prototype.K
    }, options);

    var maskArray = mask.toArray(),
        buffer = new Array(mask.length),
        locked = new Array(mask.length),
        valid = false,
        ignore = false, //Variable for ignoring control keys
        firstNonMaskPos = null;
        
    element.rawvalue = null;
    
    var re = new RegExp("^"+
      maskArray.collect(function(c) {
        return element.options.charmap[c]||((/[A-Za-z0-9]/.match(c) ? "" : "\\" )+c);
      }).join('')+"$");

    //Build buffer layout from mask & determine the first non masked character
    maskArray.each(function(c, i) {
      locked[i] = Object.isUndefined(element.options.charmap[c]);
      buffer[i] = locked[i] ? c : element.options.placeholder;
      if(!locked[i] && firstNonMaskPos == null)
        firstNonMaskPos = i;
    });
    
    // The element size and maxlength are updated
    var newChars = locked.findAll(Prototype.K).length;
    if (element.size) element.size += newChars;
    else              element.size = mask.length;

    if (element.maxLength) element.maxLength += newChars;
    else                   element.maxLength = mask.length;
    
    // Add a placeholder
    function addPlaceholder (c, r) {
      element.options.charmap[c] = r;
    }
    
    // Update the raw value, available by element.rawvalue
    function updateRawValue() {
      element.rawvalue = null;
      buffer.each(function(c, i) {
        if (!locked[i] && (c != element.options.placeholder)) {
          element.rawvalue = (element.rawvalue || '') +  c;
        }
      });
    }
    
    // Focus event, called on element.onfocus
    function focusEvent(e) {
      checkVal();
      writeBuffer();
      var f = function() {
        valid ?
          Prototype.emptyFunction :///element.caret(0, mask.length):
          element.caret(firstNonMaskPos);
      };
      f.defer();
    }
    focusEvent = focusEvent.bindAsEventListener(element);
    
    // Key down event, called on element.onkeydown
    function keydownEvent(e) {
      var pos = element.caret(),
          k = getKeycode(e);
      ignore = ((k < 41) && (k != 32) && (k != 16)); // ignore modifiers, home, end, ... except space and shift
      
      //delete selection before proceeding
      if((pos.begin - pos.end) != 0 && (!ignore || k==8 || k==46)) { // if not ignored or is backspace or delete
        clearBuffer(pos.begin, pos.end);
      }
      
      //backspace and delete get special treatment
      switch (k) {
        case 8: // backspace
          while(pos.begin-- >= 0) {
            if(!locked[pos.begin]) {
              buffer[pos.begin] = element.options.placeholder;
              if(Prototype.Browser.Opera) {
                //Opera won't let you cancel the backspace, so we'll let it backspace over a dummy character.
                s = writeBuffer();
                element.value = s.substring(0, pos.begin)+" "+s.substring(pos.begin);
                element.caret(pos.begin+1);
              }
              else {
                writeBuffer();
                element.caret(Math.max(firstNonMaskPos, pos.begin));
              }
              return e.stop();
            }
          }
        break;
        
        case 46: // delete
          clearBuffer(pos.begin, pos.begin+1);
          writeBuffer();
          element.caret(Math.max(firstNonMaskPos, pos.begin));
          return e.stop();
        break;
  
        case 27: // escape
          clearBuffer(0, mask.length);
          writeBuffer();
          element.caret(firstNonMaskPos);
          return e.stop();
        break;
      }
    }
    keydownEvent = keydownEvent.bindAsEventListener(element);
    
    function keypressEvent(e) {
      if (ignore) {
        ignore = false;
        //Fixes Mac FF bug on backspace
        return (e.keyCode == 8) ? false : null;
      }
      
      var k = getKeycode(e);

      if (e.ctrlKey || e.altKey || 
          (k == Event.KEY_TAB) || 
          (k >= Event.KEY_PAGEDOWN && k <= Event.KEY_DOWN)) return; //Ignore
      
      var pos = element.caret();
      
      if ((k >= 41 && k <= 122) || k == 32 || k > 186) {//typeable characters
        var p = seekNext(pos.begin-1);

        if (p < mask.length) {
          var nRe = new RegExp(element.options.charmap[mask.charAt(p)]);
          var c = String.fromCharCode(k);

          if (c.match(nRe)) {
            buffer[p] = c;
            writeBuffer();
            var next = seekNext(p);
            element.caret(next);
            
            if (next == mask.length) {
              checkVal();
              element.options.completed(element);
            }
          }
        }
      }

      e.stop();
    }
    keypressEvent = keypressEvent.bindAsEventListener(element);
    
    function clearBuffer(start, end) {
      for(var i = start; i < end && i < mask.length; i++) {
        if(!locked[i]) buffer[i] = element.options.placeholder;
      }
    }
    
    function writeBuffer() {
      $V(element, buffer.join(''), element.rawvalue != null);
      updateRawValue();
      return element.value;
    }
    
    function checkVal() {
      var test = element.value;
      var pos = 0;
      
      for (var i = 0; i < mask.length; i++) {
        if(!locked[i]) {
          buffer[i] = element.options.placeholder;
          while(pos++ < test.length) {
            //Regex Test each char here.
            var reChar = new RegExp(element.options.charmap[mask.charAt(i)]);
            if (test.charAt(pos-1).match(reChar)) {
              buffer[i] = test.charAt(pos-1);
              break;
            }
          }
        }
      }
      checkVal = checkVal.bindAsEventListener(element);
      
      var s = writeBuffer();
      if (!s.match(re)) {
        element.value = "";
        clearBuffer(0, mask.length);
        valid = false;
      }
      else valid = true;
    }
    
    function seekNext(pos) {
      while (++pos < mask.length) {
        if(!locked[pos]) return pos;
      }
      return mask.length;
    }
    
    element.observe("focus", focusEvent)
           .observe("blur",  checkVal)
           .observe("mask:check", checkVal)
           .observe("keydown", keydownEvent)
           .observe("keypress", keypressEvent);
    
    //Paste events for IE and Mozilla thanks to Kristinn Sigmundsson
    if (Prototype.Browser.IE)
      element.onpaste = function() {setTimeout(checkVal, 0);};     
    
    else if (Prototype.Browser.Gecko)
      element.addEventListener("input", checkVal, false);
      
    checkVal();//Perform initial check for existing values
  },
  
  slider: function(element, options) {
    var i, o = element.options = Object.extend({
      min: 0,
      max: 10,
      step: 1,
      orientation: 'horizontal',
      //rtl: true,
      ticksPosition: 'bottom',
      showTicks: true,
      tooltip: false,
      hideInput: true,
      ticks: {}
    }, options);
    
    element.sliderValue = parseFloat(element.getAttribute('value') || 0);
    
    if (o.hideInput) element.hide();
    
    element.insert({after: '<div class="control slider"><div class="slider"></div><a class="grip" href="#1" onclick="return false"></a><div class="tooltip"></div></div>'});
    var c = element.container = element.next().addClassName(o.orientation).addClassName(o.ticksPosition);
    
    element.grip = c.select('.grip').first();
    element.slider = c.select('div.slider').first();
    element.tooltip = c.select('div.tooltip').first().hide();
    
    var ticksCount = Math.round((o.max - o.min) / o.step),
        vertical = o.orientation == 'vertical';

    if (o.showTicks) {
      element.ticks = new Element('div', {className: 'ticks'});
      element.slider.insert({before: element.ticks});
      for (i = 0; i <= ticksCount; i++) {
        var v = o.ticks[o.min + (o.step * i)];
        element.ticks.insert('<div style="'+[vertical ? 'height' : 'width']+':'+(i == ticksCount ? 0 : (100/ticksCount))+'%;"><span>'+(Object.isUndefined(v)?'':v)+'</span></div>');
        var label = element.ticks.lastChild.select('span').first(),
            style = {};
            style[vertical ? 'top' : 'left'] = -(label.getDimensions()[vertical ? 'height' : 'width']/2) + 'px';
        label.setStyle(style);
      }
    }
    
    var staticOffset = 0,
        sliderSize = 0;

    function keyPressHandler(e) {
      e.stop();
      var key = getKeycode(e);
      switch(key) {
        // previous
        case 37:
        case 38:
          setValue(Number(element.value) - o.step);
        break;
        
        // next
        case 39:
        case 40:
          setValue(Number(element.value) + o.step);
        break;
      }
    }
    
    function inRange(value) {
      return (value >= o.min && value <= o.max);
    }
    
    function setValue(value) {
      if (inRange(value)) {
        $V(element, value);
        updateGrip(value);
      }
    }
    
    function updateValue(pos) {
      var tickOffset = sliderSize / ticksCount;
      element.sliderValue = Math.round((Math.round(pos / tickOffset)) * o.step * 1e14) / 1e14 + o.min;
      return ((element.sliderValue - o.min) * tickOffset) / o.step;
    }
    
    function updateGrip(value) {
      if (inRange(value)) {
        element.sliderValue = value;
        
        var tickOffset = sliderSize / ticksCount,
            posStyle = ((value - o.min) * tickOffset) / o.step;
        
        element.grip.style[vertical ? 'top' : 'left'] = posStyle + 'px';
      }
    }
    
    function updateDimensions() {
      staticOffset = element.slider.cumulativeOffset();
      sliderSize = element.slider.getDimensions()[vertical ? 'height' : 'width'];
    }
    
    function getPointerPosition(e) {
      return vertical ? (e.pointerY() - staticOffset.top) : (e.pointerX() - staticOffset.left);     
    }
    
    function mouseDownHandler(e) {
      e.stop();
      updateDimensions();
      document.observe('mousemove', mouseMoveHandler);
      document.observe('mouseup', mouseUpHandler);
      
      if (e.element() != element.grip) mouseMoveHandler(e);
      element.grip.blur();
    }
    
    function mouseMoveHandler(e) {
      e.stop();
      var pos = getPointerPosition(e);
      if (pos >= 0 && pos <= sliderSize) {
        var posStyle = updateValue(pos);
        updateGrip(element.sliderValue);
        
        // Tootip
        if (o.tooltip) {
          element.tooltip.show().update(element.sliderValue).style[vertical ? 'top' : 'left'] = posStyle + 'px';
        }
      }
    }
    
    function mouseUpHandler(e) {
      e.stop();
      $V(element, element.sliderValue);
      document.stopObserving('mousemove', mouseMoveHandler);
      document.stopObserving('mouseup', mouseUpHandler);
      element.tooltip.hide();
      element.grip.focus();
    }
    
    element.grip.observe('mousedown', mouseDownHandler)
                .observe('keypress', keyPressHandler);
                
    element.container.observe('mousedown', mouseDownHandler);
    
    updateDimensions();
    updateGrip(element.value);
  }
});
