javascript: (function() {
  function addJQuery() {
    function notifyAndProceed() {
      console.log('jQuery added.');
      window.$JQ = jQuery.noConflict();
      proceed();
    }
    var head = document.head || document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.0.0/jquery.min.js';
    script.onreadystatechange = notifyAndProceed;
    script.onload = notifyAndProceed;
    head.appendChild(script);
  };

  if (!window.$JQ) {
    addJQuery();
  } else {
    proceed();
  }

  function addStyleSheet(css) {
    var alreadyThere = document.getElementById("dictionary-styles");
    if (alreadyThere && alreadyThere.innerHTML == css) { return; }

    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';
    style.id = "dictionary-styles";

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
    head.appendChild(style);
  };

  function proceed() {
    var selectedNode;
    var selectedWord;
    var wordInfo = [];
    var keyMap = {18: false, 68: false};

    function findSelection() {
      function check(doc) {
        return doc.selection ? doc.selection.createRange().text : doc.getSelection()
      }
      var selection = check(document);
      if (!selection) { for (i = 0; i < frames.length; i++) {
        selection = check(frames[i].document); }
      }
      selectedNode = selection;
      selectedWord = crop(selection);
    }

    function crop(selection) {
      var string = selection.toString().toLowerCase().trim();
      var firstWord = string.split(/\W+/)[0];
      return firstWord;
    }


    function lookupSelectedWord() {
      if (!selectedWord) { handleNoSelection(); return}

      $JQ.ajax({
        url: 'https://api.pearson.com/v2/dictionaries/laad3/entries?headword=' + selectedWord,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
          if (response.results.length == 0) {
            handleNoResults();
          } else {
            handleResults(response.results);
          }
        },
        error: function(response) {
          flashError("Sorry. Looks like something went wrong.")
        }
      });
    }

    function handleResults(results) {
      parse(results);
      var definitionBox = pack(wordInfo);
      var original = originalSelection();
      if (original) { place(definitionBox, original); }
      $JQ(original).children('.definition-box').show();
      var otherInstances = highlight(selectedWord);
      if (otherInstances) { attach(definitionBox, otherInstances); }
    }

    function parse(results) {
      for (var i = 0; i < results.length; i++) {
        var wordObject = {};
        wordObject['headword'] = results[i].headword;
        wordObject['part_of_speech'] = results[i].part_of_speech;
        var senses = results[i].senses;

        if (senses) {
          if (senses[0].definition) {
            wordObject['definition'] = senses[0].definition;
          } else if (senses[0].subsenses) {
            wordObject['definition'] = senses[0].subsenses[0].definition;
          }
        } else {
          continue;
        }

        if (results[i].headword == selectedWord) {
          wordInfo.unshift(wordObject)
        } else {
          wordInfo.push(wordObject);
        }
      }
    }

    function pack(wordInfo) {
      var definitionBox = $JQ("<div class='definition-box'>");
      var heading = $JQ("<div class='definition-header'>");
      var word = capitalize(selectedWord);
      heading.append(word);

      var xButton = $JQ("<div class='x-button'>");
      xButton.append("×");

      var definitionList = $JQ("<ul class='definition-list'>");

      for (var i = 0; i < wordInfo.length; i++) {
        var definitionItem = $JQ("<li class='definition-item'>");
        definitionItem.html(
          formatWordInfo(i)
        );
        definitionList.append(definitionItem);
      }

      definitionList.children().slice(3).wrapAll("<div class='slide-out' />");
      definitionBox.append(heading).append(xButton).append(definitionList);

      var moreButton = $JQ("<div class='show-toggle more'>").append("+");
      if (wordInfo.length > 3) {
        definitionBox.append(moreButton);
      }
      return definitionBox;
    }

    function capitalize(str) {
      return typeof str != "undefined"  ? (str += '', str[0].toUpperCase() + str.substr(1)) : '' ;
    }

    function formatWordInfo(i) {
      var definition = capitalize(wordInfo[i].definition);
      var headWord = (wordInfo[i].headword.toLowerCase() === selectedWord) ? "" : "<span class='related-word'>" + capitalize(wordInfo[i].headword) + "</span>";
      var partOfSpeech = (wordInfo[i].part_of_speech === undefined) ? "" : "<span class='part-of-speech'>" + wordInfo[i].part_of_speech + "</span>";
      var trailingPeriod = definition[definition.length-1] == "." ? "" : ".";

      return (i+1) + ". " + headWord + " " +
             partOfSpeech + " " +
             definition + trailingPeriod;
    }

    function originalSelection() {
      var range = selectedNode.getRangeAt(0);
      if (range.endContainer.parentNode.className !== "original-word") {
        var newNode = document.createElement("span");
        newNode.className = "original-word";
        newNode.appendChild(document.createTextNode(selectedNode.toString()));
        range.deleteContents();
        range.insertNode(newNode);
      }
      return newNode;
    }

    function place(definitionBox, element) {
      definitionBox = definitionBox.clone();
      var width = window.innerWidth;
      var elemXPos = $JQ(element).offset().left;
      var elemWidth = $JQ(element).width();
      var elemXCenter = elemXPos + elemWidth/2;

      if (elemXCenter > 200 && elemXCenter < (width - 200)) {
        definitionBox.css("left", elemXCenter - 200 + "px");
      } else if (elemXCenter <= 200) {
        definitionBox.css("left", "0");
      } else {
        definitionBox.css("right", "0");
      }

      $JQ(element).append(definitionBox);
    }

    function highlight(selectedWord) {
      return $JQ('body').highlight(selectedWord);
    }


    $JQ.fn.highlight = function(word) {
      var highlightedNodes = [];
      function innerHighlight(node, word) {
        var skip = 0;
        var notWithinOriginalWord = $JQ(node).parents('.original-word').length == 0 ? true : false;
        var notHighlighted = $JQ(node).parents('.highlighted').length == 0 ? true : false;

        if (node.nodeType == 3 && notHighlighted && notWithinOriginalWord) {
          var pos = node.data.toUpperCase().indexOf(word);
          if (pos >= 0) {
            var spannode = document.createElement('span');
            spannode.className = 'highlighted';
            var middlebit = node.splitText(pos);
            var endbit = middlebit.splitText(word.length);
            var middleclone = middlebit.cloneNode(true);
            spannode.appendChild(middleclone);
            middlebit.parentNode.replaceChild(spannode, middlebit);
            highlightedNodes.push(spannode);
            skip = 1;
          }
        }
        else if (node.nodeType == 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
          for (var i = 0; i < node.childNodes.length; ++i) {
            i += innerHighlight(node.childNodes[i], word);
          }
        }
        return skip;
      }
      this.each(function() {
        innerHighlight(this, word.toUpperCase());
      });
      return highlightedNodes;
    };

    function attach(definitionBox, otherInstances) {
      for (var i = 0; i < otherInstances.length; i++) {
        place(definitionBox, otherInstances[i]);
      }
    }

    function handleNoSelection() {
      flashError("Need to have a selection.");
    }

    function handleNoResults() {
      flashError('No definitions found for <em>' + selectedWord + '</em>.');
    }

    function flashError(text) {
      var errorBox = $JQ("<div class='error-box'>");
      var googleIt = $JQ("<a class='google-it' target='_blank' href='http://www.google.com/search?q=define+" + selectedWord + "'> Try Google.</a>");
      errorBox.append(text);
      if (selectedWord) { errorBox.append(googleIt); }
      $JQ('body').prepend(errorBox);
      setTimeout(fadeAndRemove('.error-box', 'slow'), 4000);
    }

    function fadeAndRemove(selector, speed) {
      return function() {
        $JQ(selector).fadeOut(speed, function() {
          $JQ(selector).remove();
        })
      }
    }

    function forClicks() {
      $JQ(document).on('dblclick', '.original-word, .highlighted', function(event) {
        $JQ(this).children('.definition-box').show();
      });

      $JQ(document).mouseup(function(event) {
        var defBox = $JQ('.definition-box');
        if (!defBox.is(event.target) && defBox.has(event.target).length === 0) {
          $JQ('.definition-box').fadeOut("fast");
          fadeAndRemove('.error-box', "fast")();
        }
      });

      $JQ(document).on('click', '.x-button', function() {
        $JQ(this).parent().fadeOut("fast");
      });

      $JQ(document).on('click', '.show-toggle', function() {
        if ($JQ(this).hasClass("more")) {
          $JQ(this).parent().find(".slide-out").show();
          $JQ(this).removeClass("more").addClass("less").text("–");
        } else {
          $JQ(this).parent().find(".slide-out").hide();
          $JQ(this).removeClass("less").addClass("more").text("+");
        }
      });
    }

    function forKeys() {
      $JQ(document).on('keydown', function(event) {
        if (event.keyCode === 27) {
          event.preventDefault();
          $JQ('.definition-box').fadeOut("fast");
          fadeAndRemove('.error-box', "fast")();
        }

        if (event.keyCode in keyMap) {
          keyMap[event.keyCode] = true;
          if (keyMap[18] && keyMap[68]) {
            proceed();
          }
        }
      }).keyup(function(event) {
        if (event.keyCode in keyMap) {
          keyMap[event.keyCode] = false;
        }
      });
    }

    function forResize() {
      $JQ(window).resize(function() {
        $JQ('.definition-box').each(function() {
          var definitionBox = $JQ(this).removeAttr("style");
          var parent = $JQ(this).parents()[0];
          $JQ(parent).find(this).remove();
          place(definitionBox, parent);
        })
      })
    }

    function addHandlers(cbArray) {
      for (var i = 0; i < cbArray.length; i++) {
        cbArray[i]();
      }
      window.handlersAdded = true;
    }

    addStyleSheet("\
      .my-group:before { \
        content: ''; \
        display: block; \
        clear: both; \
      } \
      .original-word { color: rgb(255, 82, 82) }\
      .highlighted { color: rgb(255, 82, 82) }\
      .definition-box { \
        position: absolute; \
        display: none; \
        margin-left: 8px;\
        margin-right: 8px;\
        width: 384px; \
        text-align: left; \
        opacity: 100; \
        font-family: futura;\
        font-size: 15px; \
        color: white; \
        background: rgba(34, 34, 34, .9); \
        z-index: 1000; \
        border: 0px solid grey; \
        border-radius: 5px\
        } \
      .definition-header { \
        display: inline-block; \
        text-align: inherit; \
        font-style: normal; \
        font-size: 22px; \
        letter-spacing: 0; \
        color: rgb(255, 82, 82); \
        margin: 0px; \
        padding-left: 10px; \
        padding-top: 10px; \
      } \
      .definition-list { \
        list-style: none; \
        padding: 0px; \
        margin: 10px; \
       } \
      .definition-item { \
        font-size: 15px; \
        font-style: normal; \
        letter-spacing: 0; \
        color: white; \
        margin-bottom: 10px;\
      } \
      .definition-item:last-child { \
        margin-bottom: 0; \
      } \
      .related-word { \
        color: rgb(255, 82, 82); \
      } \
      .part-of-speech { \
        color: rgb(209,209,209); \
        font-style: italic; \
      } \
      .slide-out { \
        display: none; \
      } \
      .x-button { \
        padding-right: 10px; \
        padding-top: 10px; \
        font-size: 21px; \
        color: white; \
        float: right; \
        transition: color .33s; \
      } \
      .show-toggle { \
        display: inline-block; \
        padding-right: 10px; \
        margin-top: -5px; \
        margin-bottom: 5px; \
        float: right; \
        color: white; \
        font-size: 22px; \
        transition: color .33s; \
      } \
      .x-button:hover, .show-toggle:hover{ \
        color: rgb(255, 82, 82); \
        cursor: pointer; \
      } \
      .error-box { \
        position: fixed;\
        z-index: 1001; \
        width: 100%; \
        top: 0 ; \
        left: 0 ; \
        padding: 5px 0; \
        text-align: center; \
        font-family: futura; \
        font-size: 21px; \
        color: rgb(255, 82, 82); \
        background: rgba(34, 34, 34, .9); \
      } \
      .google-it { \
        color: rgb(66,133,244); \
        text-decoration: none; \
      } \
    ");

    if (! window.handlersAdded) {
      addHandlers([forClicks, forKeys, forResize]);
    }
    findSelection();
    lookupSelectedWord();
  }
})();
