window.onload = function() {

		var fileInput = document.getElementById('fileInput');
		var fileDisplayArea = document.getElementById('fileDisplayArea');


		fileInput.addEventListener('change', function(e) {
			var file = fileInput.files[0];
			var imageType = /image.*/;
			if (file.type.match(imageType)) {
				var reader = new FileReader();

				reader.onload = function(e) {
					fileDisplayArea.innerHTML = "";

					var img = new Image();
					img.src = reader.result;

					fileDisplayArea.appendChild(img);
				}

				reader.readAsDataURL(file);	



			} else {
				fileDisplayArea.innerHTML = "File not supported!";
			}
		});


		$("#submitt").click(function(){
			console.debug("comming~");
			var file = fileInput.files[0];

			    $.ajax({
				  url: "https://project-o.s3.amazonaws.com/groups/3c8552fa-f544-4261-a63a-b0d6064c6197/0/fdb81b32-392a-4fad-a3f0-4b21c2c08e93?Expires=1717252285&AWSAccessKeyId=AKIAIXGU3YMKDJDPL7IA&Signature=o%2F5gcsfae3wzXppFCO%2BQTl%2Bfg8w%3D", // the presigned URL
				  type: 'PUT',
				  data: file,
				  processData: false,
				  success: function() { console.log('Uploaded data successfully.'); }
				});
		});

}
