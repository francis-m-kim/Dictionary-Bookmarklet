javascript: (function() {
  function addJQuery() {
    function notify() {
      console.log('jQuery added.');
    }
    var head = document.head || document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.0.0/jquery.min.js';
    script.onreadystatechange = notify;
    script.onload = notify;
    head.appendChild(script);
  };

  if (!window.jQuery) {
    addJQuery();
    setTimeout(proceed, 1000)
  } else {
    proceed();
  }

  addStyleSheet = function(css) {
    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
    head.appendChild(style);
  };

  function findSelection() {
    function check(doc) {
      return doc.selection ? doc.selection.createRange().text : doc.getSelection()
    }
    var selection = check(document);
    if (!selection) { for (i = 0; i < frames.length; i++) {
      selection = check(frames[i].document); }
    }
    selected = selection;
  }

  function addFont(name) {
    var head = document.head || document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    name = name.split(' ').join('+');
    link.href = 'https://fonts.googleapis.com/css?family=' + name;
    head.appendChild(link);
  }





  function proceed() {
    console.log("The app is 'appening.");
  }
})();

// other crap that might be useful

function getIndices(word, str) {
  var startIndex = 0, wordLen = word.length;
  var index, indices = [];
  word = word.toUpperCase();
  str = str.toUpperCase();

  while ((index = str.indexOf(word, startIndex)) > -1) {
    if (index == 0 && str[index + wordLen] == " ") {
      indices.push(index);
    } else if (index == str.length - wordLen && str[index - 1] == " ") {
      indices.push(index);
    } else if (str[index - 1] == " " && str[index + wordLen] == " ") {
      indices.push(index);
    }
    startIndex = index + wordLen;
  }
  return indices;
}
