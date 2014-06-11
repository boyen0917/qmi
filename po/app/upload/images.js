$(function(){  
			var imageType = /image.*/;
			var file_clone = [];
			$("#fileInput").data("img-compose-arr",[]);
			$("#fileInput").data("img-compose-arr")[3] = 1;
			$("#fileInput").data("img-compose-arr")[5] = 2;
			console.log($("#fileInput").data("img-compose-arr"));

		$("#fileInput").change(function(e) {
			var file_ori = $(this);

			$.each(file_ori[0].files,function(i,file){
				if (file.type.match(imageType)) {
					file_clone.push(file);
				}
			});
			console.log(file_clone[0].type);
			console.log(file_clone[0].size);
			file_ori.replaceWith( file_ori.val('').clone( true ) );

// return false;
			var imageType = /image.*/;
			fileDisplayArea.innerHTML = "";
			$.each(file_clone,function(i,file){
				if (file.type.match(imageType)) {
					var reader = new FileReader();

					reader.onload = function(e) {
						

						var img = new Image();
						img.src = reader.result;
						
						fileDisplayArea.appendChild(img);
					}

					reader.readAsDataURL(file);	

				} else {
					console.log(this);
					fileDisplayArea.appendChild("File not supported!");
				}
			});
				
		});

		$("#submitt").click(function(){
			var file = $("#fileInput")[0].files[0];
			$.ajax({
					url: "https://project-o.s3.amazonaws.com/groups/1a9bca59-766d-402d-b5ea-9ad973e10d45/0/bd157262-4fba-46e8-8bff-3c293054e802?Expires=1717750370&AWSAccessKeyId=AKIAIXGU3YMKDJDPL7IA&Signature=kFGP9K6XlGVks9N7Xz%2BFfZdtaCE%3D",
					type: 'PUT',
					contentType: " ",
				 	data: file, 
					processData: false,
					complete: function(data) { 
						console.log(data);
					}
			});
			//
			    
		});

})
