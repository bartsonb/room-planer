function displayHelperbox(){
    var helperBox = document.querySelector(".helpWrap");
    var helperButton = document.querySelector(".buttonWrap--help");



    console.log(helperBox);
    helperButton.addEventListener('click', function(){
        if(helperBox.classList.contains("helpWrap--off")){
            helperBox.classList.remove("helpWrap--off");
            helperBox.classList.add("helpWrap--on");
        }else{
            helperBox.classList.add("helpWrap--off");
            helperBox.classList.remove("helpWrap--on");
        }
    })
}

function closeHelperbox(){
    var helperBox = document.querySelector(".helpWrap");
    var helperCloseButton = document.querySelector(".help--close");

    helperCloseButton.addEventListener('click', function(){
        if(helperBox.classList.contains("helpWrap--off")){
            helperBox.classList.remove("helpWrap--off");
            helperBox.classList.add("helpWrap--on");
        }else{
            helperBox.classList.add("helpWrap--off");
            helperBox.classList.remove("helpWrap--on");
        }
    })

}

document.addEventListener('DOMContentLoaded', function() {
    var helperBox = document.querySelector("helpWrap");
    var helperButton = document.querySelector("buttonWrap--help");
    displayHelperbox();
    closeHelperbox();
});





