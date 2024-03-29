var original = document.body.innerHTML;
document.body.innerHTML = "";

$.get(chrome.extension.getURL('/popup.html'), function(data) {
  // console.log(data);
  $($.parseHTML(data)).prependTo('body');
});

$(document).ready(function(){
    var canvas = document.getElementById("canvas"),
      context = canvas.getContext("2d"),
      video = document.getElementById("video"),
      videoObj = { "video": true },
      errBack = function(error) {
        console.log("Video capture error: ", error.code);
      };

    // Put video listeners into place
    if (navigator.getUserMedia) { // Standard
      navigator.getUserMedia(videoObj, function(stream) { 
        video.src = stream;
        video.play();
      }, errBack);
    } else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
      navigator.webkitGetUserMedia(videoObj, function(stream){
        video.src = window.webkitURL.createObjectURL(stream);
        video.play();
      }, errBack);
    }
    else if(navigator.mozGetUserMedia) { // Firefox-prefixed
      navigator.mozGetUserMedia(videoObj, function(stream){
        video.src = window.URL.createObjectURL(stream);
        video.play();
      }, errBack);
    }

    makeblob = function (dataURL) {
              var BASE64_MARKER = ';base64,';
              if (dataURL.indexOf(BASE64_MARKER) == -1) {
                  var parts = dataURL.split(',');
                  var contentType = parts[0].split(':')[1];
                  var raw = decodeURIComponent(parts[1]);
                  return new Blob([raw], { type: contentType });
              }
              var parts = dataURL.split(BASE64_MARKER);
              var contentType = parts[0].split(':')[1];
              var raw = window.atob(parts[1]);
              var rawLength = raw.length;

              var uInt8Array = new Uint8Array(rawLength);

              for (var i = 0; i < rawLength; ++i) {
                  uInt8Array[i] = raw.charCodeAt(i);
              }

              return new Blob([uInt8Array], { type: contentType });
          }

    document.getElementById("verify").addEventListener("click", function() {
      context.drawImage(video, 0, 0, 640, 480);
      var API_KEY = "b067f2e6c5344252b40d9ee0f682fe4f";

      // first get the faceID
      var params = {
        "returnFaceId": "true",
      };

      // get the picture from the canvas before sending it
      var canvas = document.getElementById("canvas");
      var enc_img = canvas.toDataURL();
      var x = makeblob(enc_img);

      jQuery.ajax({
        url: "https://api.projectoxford.ai/face/v1.0/detect?" + $.param(params),
        beforeSend: function(xhrObj){
          // Request headers
          xhrObj.setRequestHeader("Content-Type","application/octet-stream");
          xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", API_KEY);
        },
        processData: false,
        type: "POST",
        // Request body

        data: x
      })

      .done(function(data) {
        p = data

        if (jQuery.isEmptyObject(p)) {
          console.log('[!] Did not find any faces!');
        } else {
          console.log(p[0].faceId);
          fid = p[0].faceId;

          // this is ugly

          var params2 = {
            "faceId1": "4962b627-1df6-4636-8cd2-38a1cbde133e",
            "faceId2": fid
          };

          jQuery.ajax({
            url: "https://api.projectoxford.ai/face/v1.0/verify",
            beforeSend: function(xhrObj){
              // Request headers
              xhrObj.setRequestHeader("Content-Type", "application/json");
              xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", API_KEY);
            },
            type: "POST",
            // Request body
            data: JSON.stringify(params2)
          })

          .done(function(data) {
            console.log(data.isIdentical);
            
            if (data.isIdentical){
              context.drawImage(video, 0, 0, 640, 480);
              var canvas2 = document.getElementById("canvas");
              var enc_img2 = canvas.toDataURL();

              var x2 = makeblob(enc_img2);
              console.log(typeof(x2)); 
              
              jQuery.ajax({
                url: "https://api.projectoxford.ai/emotion/v1.0/recognize",
                beforeSend: function(xhrObj) {
                    // Request headers
                    xhrObj.setRequestHeader("Content-Type","application/octet-stream");
                    xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", "ac73df1d0aa94d36a254c955465c8a75");
                },
                type: "POST",
                processData: false,
                // Request body
                data: x2
                })
                
                .done(function(data) {
                    console.log(data);
                    if (data[0].scores.happiness > 0.75){
                      alert("Authentication successful!");
                      document.body.innerHTML = original;
                    } else {
                      alert("Please smile! (more)")
                    }
                })
                
                .fail(function() {
                    alert("error");
                });
              
            }
            else alert("Authentification failed.");
          })

          .fail(function(error) {
            alert('-1');
          });
          // here it ends
        }
      })

      .fail(function(error) {
        alert('-1');
      });
    });

})
