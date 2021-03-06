(function() {
  'use strict';

  var title = document.getElementById('title');
  var appContent = document.getElementById('app-content');
  var moveToNextNode = function(evt) {
    var nextNodeId = evt.target.nextNodeId;
    var trailText = evt.target.trailText;
    updateState(nextNodeId, trailText);
  }
  var updateState = function(nodeId, text) {
    var state = history.state;
    state.trail.push({
      nodeId: nodeId,
      text: text
    });
    history.pushState(state, null, '?nodeId=' + nodeId);
    updateContent(state);
  }
  var updateContent = function(state) {
    var nodeId = 0;
    if (state.trail.length > 0) {
      nodeId = state.trail[state.trail.length - 1].nodeId;
    }

    // Clear previous content:
    appContent.innerHTML = '';
    if (typeof(nodeId) === 'number') {
      title.textContent = 'Analyse the information risk in your data by working through these questions';
      // Get new content:
      var node = nodes[nodeId];

      var h4 = document.createElement('h4');
      h4.textContent = node.text;
      appContent.appendChild(h4);

      ['Yes', 'No'].forEach(function(answer) {
        var input = document.createElement('input');
        input.type = 'button';
        input.value = answer;
        input.classList.add('cta');
        input.classList.add('btn');
        input.classList.add('cta-half');
        var trailText = node.edges[answer][0];
        var nextNodeInstruction = node.edges[answer][1];
        if (nextNodeInstruction === 'next') {
          var nextNodeId = nodeId + 1;
        }
        else if (nextNodeInstruction.indexOf('move') >= 0) {
          var moveValue = Number(nextNodeInstruction.replace('move', ''));
          var nextNodeId = nodeId + moveValue;
        }
        else if (nextNodeInstruction.indexOf('TIER') >= 0) {
          var nextNodeId = nextNodeInstruction;
        }
        input.trailText = trailText;
        input.nextNodeId = nextNodeId;
        input.addEventListener('click', moveToNextNode);
        appContent.appendChild(input);
      });

      if ('guidance' in node) {
        var guidanceP = document.createElement('p');
        guidanceP.textContent = node.guidance;
        appContent.appendChild(guidanceP);
      }
    }
    else {
      title.textContent = 'Results';
      var p = document.createElement('p');
      p.classList.add('strong');
      p.textContent = 'I confirm:';
      appContent.appendChild(p);

      var ul = document.createElement('ul');
      state.trail.forEach(function(breadcrumb) {
        var li = document.createElement('li');
        li.textContent = breadcrumb.text;
        ul.append(li);
      });
      appContent.appendChild(ul);

      var h4 = document.createElement('h4');
      h4.innerHTML = 'Based on these responses, we believe your data is ' + tier_lookup[nodeId].replace(/\[(.+?)\]\((https?:\/\/.+?)\)/g, '<a href="$2">$1</a>');
      appContent.appendChild(h4);

      function download() {
        var pars = [
          new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: "Declaration of data analysis",
                        bold: true,
                        font: "Calibri",
                        size: 30,
                    }),
                ],
                spacing: {
                    after: 200,
                },
            }),
        ];
        state.trail.forEach(function(breadcrumb) {
            pars.push(new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: breadcrumb.text,
                        font: "Calibri",
                    })
                ],
                break: 1,
                bullet: {
                    level: 0
                    }
                }),
            );
        });
        pars.push(
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: "Signed\t\t\t\t\t\tDate",
                        bold: true,
                        font: "Calibri",
                    }),
                ],
                spacing: {
                    before: 400,
                    after: 200,
                },
            }),
        );
        pars.push(
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        text: ".........\t\t\t\t\t\t........",
                        font: "Calibri",
                    }),
                ],
                spacing: {
                    before: 800
                },
            }),
        );

        var doc = new docx.Document({
            sections: [{
                properties: {},
                children: pars,
            }],
        });

        var element = document.createElement('a');
        docx.Packer.toBlob(doc).then(function(blob) {
          element.setAttribute('href', window.URL.createObjectURL(blob));
          
          var timestamp = new Date().toISOString();
          element.setAttribute('download', 'data-classification-' + timestamp + '.docx');

          element.style.display = 'none';
          document.body.appendChild(element);

          element.click();

          document.body.removeChild(element);
        })
      }

      var input = document.createElement('input');
      input.type = 'button';
      input.value = 'Download this info';
      input.classList.add('cta');
      input.classList.add('btn');
      input.classList.add('cta-half');
      input.addEventListener('click', download);
      appContent.appendChild(input);

    }
    console.log(history.state.trail);
  }

  // Initialise the app:

  window.onload = function() {
    var urlParams = new URLSearchParams(window.location.search);
    var state = history.state;
    if (!state) {
      state = {trail: []};
      history.pushState(state, '', '?nodeId=0');
    }
    updateContent(state);
  };

  // Fires when the user goes back or forward in the history.
  window.onpopstate = function(evt) {
    if (evt.state != null) {
      updateContent(evt.state);
    }
  }

})();
